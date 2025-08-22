import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// 제품명을 CPHI URL 슬러그로 변환하는 함수
function generateCphiSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // 특수문자 제거
    .replace(/\s+/g, '-') // 공백을 하이픈으로
    .replace(/-+/g, '-') // 연속 하이픈 정리
    .replace(/^-|-$/g, '') // 앞뒤 하이픈 제거
}

// 병렬 상세 정보 수집 함수
async function collectDetailInfoParallel(products: any[], maxConcurrent = 5) {
  const startTime = Date.now()
  console.log(`🚀 병렬 상세 정보 수집 시작: ${products.length}개 제품, 동시실행 ${maxConcurrent}개`)
  
  // 청크 단위로 병렬 처리
  const chunks = []
  for (let i = 0; i < products.length; i += maxConcurrent) {
    chunks.push(products.slice(i, i + maxConcurrent))
  }
  
  let totalSuccess = 0
  let totalAttempts = 0
  
  for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
    const chunk = chunks[chunkIndex]
    console.log(`청크 ${chunkIndex + 1}/${chunks.length} 처리 중 (${chunk.length}개)...`)
    
    // 청크 내 병렬 처리 (개별 딜레이 적용)
    const promises = chunk.map(async (item, index) => {
      // 개별 요청 간 순차 딜레이 (서버 부하 방지)
      await new Promise(resolve => setTimeout(resolve, index * 200))
      
      try {
        // 제품 상세 정보 URL 생성
        const idStr = item.id.toString().padStart(6, '0')
        const path1 = idStr.substring(0, 2)
        const path2 = idStr.substring(2, 4) 
        const path3 = idStr.substring(4, 6)
        
        const detailUrl = `https://www.cphi-online.com/46/product/${path1}/${path2}/${path3}/search${item.id}_46.json?v=21`
        
        // 재시도 로직 추가
        let detailResponse
        let lastError
        
        for (let retry = 0; retry < 3; retry++) {
          try {
            detailResponse = await fetch(detailUrl, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json, */*',
                'Referer': 'https://www.cphi-online.com/'
              },
              signal: AbortSignal.timeout(6000)
            })
            
            if (detailResponse.ok) break // 성공 시 루프 탈출
            
            lastError = `HTTP ${detailResponse.status}`
            if (retry < 2) await new Promise(resolve => setTimeout(resolve, 1000 * (retry + 1))) // 점진적 딜레이
            
          } catch (error) {
            lastError = error instanceof Error ? error.message : 'Unknown'
            if (retry < 2) await new Promise(resolve => setTimeout(resolve, 1000 * (retry + 1))) // 점진적 딜레이
          }
        }
        
        if (detailResponse && detailResponse.ok) {
          const detailData = await detailResponse.json()
          const detail = detailData.result || detailData
          
          // 상세 정보 업데이트
          item.company = detail.supplier || detail.companyname || ''
          item.country = detail.country || ''
          item.companyTypes = detail.companyTypes || ''
          item.verified = detail.verified || 'false'
          
          // 정확한 링크 정보 업데이트
          if (detail.link) {
            item.exactLink = detail.link.startsWith('http') ? detail.link : `https://www.cphi-online.com${detail.link}`
          }
          
          return { success: true, id: item.id, company: item.company, country: item.country }
        } else {
          return { success: false, id: item.id, error: lastError || 'Failed after 3 retries' }
        }
      } catch (error) {
        return { success: false, id: item.id, error: error instanceof Error ? error.message : 'Unknown' }
      }
    })
    
    // 청크 결과 대기
    const results = await Promise.allSettled(promises)
    const chunkSuccesses = results.filter(r => r.status === 'fulfilled' && r.value.success).length
    
    totalSuccess += chunkSuccesses
    totalAttempts += chunk.length
    
    console.log(`청크 ${chunkIndex + 1} 완료: ${chunkSuccesses}/${chunk.length} 성공`)
    
    // 청크 간 딜레이 (차단 방지 및 서버 부하 방지)
    if (chunkIndex < chunks.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1200)) // 800ms → 1200ms로 증가
    }
  }
  
  const processingTime = Date.now() - startTime
  console.log(`✅ 병렬 상세 정보 수집 완료: ${totalSuccess}/${totalAttempts} 성공 (${processingTime}ms)`)
  
  return {
    totalSuccess,
    totalAttempts,
    successRate: (totalSuccess / totalAttempts * 100).toFixed(1),
    processingTime
  }
}

// 실시간 크롤링 함수 (더 많은 결과용)
async function performExtendedRealtimeCrawling(query: string, limit: number = 300, offset: number = 0) {
  const startTime = Date.now()
  const maxTimeout = 30000 // 30초 타임아웃 (300개 데이터용)
  
  console.log(`=== 확장 실시간 크롤링 시작 ===`)
  console.log(`검색어: "${query}", 제한: ${limit}`)
  
  try {
    // 향상된 헤더 조합으로 CPHI JSON API 직접 호출
    const cphiJsonUrl = new URL('https://www.cphi-online.com/live/search/search46json.jsp')
    cphiJsonUrl.searchParams.set('site', '46')
    cphiJsonUrl.searchParams.set('types', 'all')
    cphiJsonUrl.searchParams.set('name', query)
    cphiJsonUrl.searchParams.set('facets', 'all')

    const headerOptions: Record<string, string>[] = [
      // 옵션 1: 최신 Chrome with full headers
      {
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'X-Requested-With': 'XMLHttpRequest',
        'Referer': 'https://www.cphi-online.com/',
        'Origin': 'https://www.cphi-online.com'
      },
      // 옵션 2: Firefox 시뮬레이션
      {
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Accept-Language': 'ko-KR,ko;q=0.8,en-US;q=0.5,en;q=0.3',
        'Accept-Encoding': 'gzip, deflate, br',
        'X-Requested-With': 'XMLHttpRequest',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
        'Referer': 'https://www.cphi-online.com/',
        'Origin': 'https://www.cphi-online.com'
      },
      // 옵션 3: Edge 시뮬레이션
      {
        'Accept': 'application/json, */*',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
        'Referer': 'https://www.cphi-online.com/',
        'X-Requested-With': 'XMLHttpRequest'
      },
      // 옵션 4: 간소화된 요청
      {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': '*/*',
        'Referer': 'https://www.cphi-online.com/'
      }
    ]

    for (let i = 0; i < headerOptions.length; i++) {
      if (Date.now() - startTime > maxTimeout) break

      try {
        // 요청 간 딜레이 (첫 번째 요청 제외)
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000)

        console.log(`확장 크롤링 옵션 ${i + 1} 시도: ${headerOptions[i]['User-Agent']?.substring(0, 50)}...`)

        const response = await fetch(cphiJsonUrl.toString(), {
          headers: headerOptions[i],
          method: 'GET',
          signal: controller.signal
        })

        clearTimeout(timeoutId)

        console.log(`확장 크롤링 옵션 ${i + 1} 응답: ${response.status} ${response.statusText}`)

        if (response.ok) {
          const jsonData = await response.json()
          const results = jsonData.results || []
          
          // 디버깅: 첫 번째 결과의 모든 필드 출력
          if (results.length > 0) {
            console.log('CPHI API 첫 번째 결과 전체 필드:', JSON.stringify(results[0], null, 2))
          }
          
          // 제품과 회사만 필터링하고 더 많은 결과 처리
          const filteredResults = results.filter((item: any) => 
            item.type === 'product' || item.type === 'company'
          )
          
          // 제품의 경우 병렬 상세 정보 수집 (오프셋 적용하여 최대 50개)
          const allProductsExt = filteredResults.filter((r: any) => r.type === 'product')
          const targetProductsExt = allProductsExt.slice(offset, offset + Math.min(50, limit))
          
          if (targetProductsExt.length > 0) {
            await collectDetailInfoParallel(targetProductsExt, 3) // 8개 → 3개로 감소 (서버 부하 방지)
          }

          const processedResults = filteredResults.slice(offset, offset + limit).map((item: any, index: number) => {
            let url = ''
            
            // CPHI API에서 제공하는 실제 링크 사용 (우선순위)
            if (item.link) {
              url = item.link.startsWith('http') ? item.link : `https://www.cphi-online.com${item.link}`
            } else if (item.url) {
              url = item.url.startsWith('http') ? item.url : `https://www.cphi-online.com${item.url}`
            } else {
              // 백업: 제품명/회사명 기반 상세 페이지 URL 생성
              if (item.type === 'product' && item.name) {
                // 제품 상세 페이지 URL (Image #2 스타일)
                const productSlug = generateCphiSlug(item.name)
                url = `https://www.cphi-online.com/product/${productSlug}/`
              } else if (item.type === 'company' && item.name) {
                // 회사 상세 페이지 URL
                const companySlug = generateCphiSlug(item.name)
                url = `https://www.cphi-online.com/company/${companySlug}/`
              }
            }
            
            return {
              id: item.id || index,
              title: item.name || '',
              type: item.type || 'product',
              score: item.score || 0,
              source: 'CPHI Online (실시간)',
              url: url,
              filterVal: item.filterVal || '',
              // 회사 정보 추가 (제품인 경우)
              company: item.company || item.supplier || '',
              country: item.country || '',
              companyTypes: item.companyTypes || '',
              verified: item.verified || 'false',
              // 디버깅을 위한 원본 링크 정보 추가
              originalLink: item.link || '',
              originalUrl: item.url || ''
            }
          })

          return {
            query,
            results: processedResults,
            count: processedResults.length,
            totalAvailable: filteredResults.length,
            hasMore: (offset + limit) < filteredResults.length,
            source: 'CPHI Online (실시간)',
            processingTime: `${Date.now() - startTime}ms`,
            timestamp: new Date().toISOString(),
            success: true
          }
        }
      } catch (fetchError) {
        const errorMsg = fetchError instanceof Error ? fetchError.message : 'Unknown error'
        console.log(`확장 실시간 크롤링 옵션 ${i + 1} 실패: ${errorMsg}`)
      }
    }

    // 모든 옵션 실패
    return {
      query,
      results: [],
      count: 0,
      totalAvailable: 0,
      hasMore: false,
      error: 'CPHI API 접근 불가',
      processingTime: `${Date.now() - startTime}ms`,
      timestamp: new Date().toISOString(),
      success: false
    }

  } catch (error) {
    return {
      query,
      results: [],
      count: 0,
      totalAvailable: 0,
      hasMore: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      processingTime: `${Date.now() - startTime}ms`,
      timestamp: new Date().toISOString(),
      success: false
    }
  }
}

// 실시간 크롤링 함수
async function performRealtimeCrawling(query: string) {
  const startTime = Date.now()
  const maxTimeout = 10000 // 10초 타임아웃
  
  try {
    // 향상된 헤더 조합으로 CPHI JSON API 직접 호출
    const cphiJsonUrl = new URL('https://www.cphi-online.com/live/search/search46json.jsp')
    cphiJsonUrl.searchParams.set('site', '46')
    cphiJsonUrl.searchParams.set('types', 'all')
    cphiJsonUrl.searchParams.set('name', query)
    cphiJsonUrl.searchParams.set('facets', 'all')

    const headerOptions: Record<string, string>[] = [
      // 옵션 1: 최신 Chrome with full headers
      {
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'X-Requested-With': 'XMLHttpRequest',
        'Referer': 'https://www.cphi-online.com/',
        'Origin': 'https://www.cphi-online.com'
      },
      // 옵션 2: Firefox 시뮬레이션
      {
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Accept-Language': 'ko-KR,ko;q=0.8,en-US;q=0.5,en;q=0.3',
        'Accept-Encoding': 'gzip, deflate, br',
        'X-Requested-With': 'XMLHttpRequest',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
        'Referer': 'https://www.cphi-online.com/',
        'Origin': 'https://www.cphi-online.com'
      },
      // 옵션 3: Edge 시뮬레이션
      {
        'Accept': 'application/json, */*',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
        'Referer': 'https://www.cphi-online.com/',
        'X-Requested-With': 'XMLHttpRequest'
      },
      // 옵션 4: 간소화된 요청 (이 옵션이 성공함)
      {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': '*/*',
        'Referer': 'https://www.cphi-online.com/'
      }
    ]

    for (let i = 0; i < headerOptions.length; i++) {
      if (Date.now() - startTime > maxTimeout) break

      try {
        // 요청 간 딜레이 (첫 번째 요청 제외)
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 8000)

        console.log(`기본 크롤링 옵션 ${i + 1} 시도: ${headerOptions[i]['User-Agent']?.substring(0, 50)}...`)

        const response = await fetch(cphiJsonUrl.toString(), {
          headers: headerOptions[i],
          method: 'GET',
          signal: controller.signal
        })

        clearTimeout(timeoutId)

        console.log(`기본 크롤링 옵션 ${i + 1} 응답: ${response.status} ${response.statusText}`)

        if (response.ok) {
          const jsonData = await response.json()
          const results = jsonData.results || []
          
          // 제품과 회사만 필터링하고 더 많은 결과 처리
          const filteredResults = results.filter((item: any) => 
            item.type === 'product' || item.type === 'company'
          )
          
          // 제품의 경우 병렬 상세 정보 수집 (최대 20개)
          const allProducts = filteredResults.filter((r: any) => r.type === 'product')
          const targetProducts = allProducts.slice(0, Math.min(20, allProducts.length))
          
          if (targetProducts.length > 0) {
            await collectDetailInfoParallel(targetProducts, 3) // 5개 → 3개로 감소 (서버 부하 방지)
          }
          
          const processedResults = filteredResults.slice(0, 30).map((item: any, index: number) => {
            let url = ''
            
            // CPHI API에서 제공하는 실제 링크 사용 (우선순위)
            if (item.link) {
              url = item.link.startsWith('http') ? item.link : `https://www.cphi-online.com${item.link}`
            } else if (item.url) {
              url = item.url.startsWith('http') ? item.url : `https://www.cphi-online.com${item.url}`
            } else {
              // 백업: 제품명/회사명 기반 상세 페이지 URL 생성
              if (item.type === 'product' && item.name) {
                // 제품 상세 페이지 URL (Image #2 스타일)
                const productSlug = generateCphiSlug(item.name)
                url = `https://www.cphi-online.com/product/${productSlug}/`
              } else if (item.type === 'company' && item.name) {
                // 회사 상세 페이지 URL
                const companySlug = generateCphiSlug(item.name)
                url = `https://www.cphi-online.com/company/${companySlug}/`
              }
            }
            
            return {
              id: item.id || index,
              title: item.name || '',
              type: item.type || 'product',
              score: item.score || 0,
              source: 'CPHI Online (실시간)',
              url: url,
              filterVal: item.filterVal || '',
              // 회사 정보 추가 (제품인 경우)
              company: item.company || item.supplier || '',
              country: item.country || '',
              companyTypes: item.companyTypes || '',
              verified: item.verified || 'false',
              // 디버깅을 위한 원본 링크 정보 추가
              originalLink: item.link || '',
              originalUrl: item.url || ''
            }
          })

          return {
            query,
            results: processedResults,
            count: processedResults.length,
            totalAvailable: filteredResults.length,
            hasMore: filteredResults.length > 30,
            source: 'CPHI Online (실시간)',
            processingTime: `${Date.now() - startTime}ms`,
            timestamp: new Date().toISOString(),
            success: true
          }
        }
      } catch (fetchError) {
        console.log(`실시간 크롤링 옵션 ${i + 1} 실패:`, fetchError)
      }
    }

    // 모든 옵션 실패
    return {
      query,
      results: [],
      count: 0,
      error: 'CPHI API 접근 불가',
      processingTime: `${Date.now() - startTime}ms`,
      timestamp: new Date().toISOString(),
      success: false
    }

  } catch (error) {
    return {
      query,
      results: [],
      count: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
      processingTime: `${Date.now() - startTime}ms`,
      timestamp: new Date().toISOString(),
      success: false
    }
  }
}

// 로컬 DB 데이터로 실시간 크롤링 결과 보강
async function enrichWithLocalData(realtimeResults: any[], query: string) {
  try {
    // 제품명으로 로컬 DB에서 공급업체 정보 검색
    for (const item of realtimeResults) {
      if (item.type === 'product' && item.title && !item.company) {
        try {
          // 제품명으로 로컬 DB 검색
          const { data: localProducts } = await supabase
            .from('products')
            .select(`
              suppliers(
                name,
                country,
                supplier_type,
                verified
              )
            `)
            .ilike('name', `%${item.title}%`)
            .limit(1)
          
          if (localProducts && localProducts.length > 0 && localProducts[0].suppliers) {
            const suppliers = localProducts[0].suppliers as any[]
            if (suppliers.length > 0) {
              const supplier = suppliers[0]
              item.company = supplier.name || ''
              item.country = supplier.country || ''
              item.companyTypes = supplier.supplier_type || ''
              item.verified = supplier.verified ? 'true' : 'false'
            }
          }
        } catch (dbError) {
          console.log(`로컬 DB 매칭 실패 (${item.title}):`, dbError)
        }
      }
    }
  } catch (error) {
    console.error('로컬 데이터 보강 실패:', error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      query = '', 
      searchType = 'all', // 'all', 'product', 'cas', 'supplier'
      filters = {},
      page = 1,
      limit = 20,
      includeRealtime = true, // 실시간 크롤링 포함 여부
      realtimeOnly = false, // 실시간 크롤링만 요청
      realtimeLimit = 50, // 실시간 크롤링 결과 수
      realtimeOffset = 0 // 실시간 크롤링 오프셋
    } = body
    
    const offset = (page - 1) * limit
    const results: any = {
      products: [],
      suppliers: [],
      total: 0,
      realtime: null // 실시간 크롤링 결과
    }
    
    if (!query || query.length < 2) {
      return NextResponse.json({
        error: 'Search query must be at least 2 characters long'
      }, { status: 400 })
    }

    // 실시간 크롤링만 요청하는 경우
    if (realtimeOnly) {
      try {
        console.log(`확장 실시간 CPHI 크롤링 시작: "${query}" (limit: ${realtimeLimit}, offset: ${realtimeOffset})`)
        const realtimeResults = await performExtendedRealtimeCrawling(query, realtimeLimit, realtimeOffset)
        
        // 실시간 크롤링에서 이미 상세 정보 수집됨
        
        return NextResponse.json({
          query,
          searchType: 'realtime',
          results: {
            products: [],
            suppliers: [],
            total: 0,
            realtime: realtimeResults
          },
          pagination: { page: 1, limit: realtimeLimit, totalPages: 1 }
        })
      } catch (error) {
        console.error('확장 실시간 크롤링 에러:', error)
        return NextResponse.json({
          error: '확장 실시간 크롤링 실패',
          message: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
      }
    }
    
    // Search products by name or CAS number
    if (searchType === 'all' || searchType === 'product' || searchType === 'cas') {
      let productQuery = supabase
        .from('products')
        .select(`
          id,
          name,
          cas_no,
          product_url
        `, { count: 'exact' })
      
      // Apply search based on type
      if (searchType === 'cas') {
        productQuery = productQuery.ilike('cas_no', `%${query}%`)
      } else if (searchType === 'product') {
        productQuery = productQuery.ilike('name', `%${query}%`)
      } else {
        productQuery = productQuery.or(`name.ilike.%${query}%,cas_no.ilike.%${query}%`)
      }
      
      // First get all matching products to apply filters
      const { data: allProducts, error: productError } = await productQuery
      
      if (productError) throw productError
      
      // Get product IDs for supplier lookup
      const productIds = allProducts?.map(p => p.id) || []
      
      // Fetch suppliers for these products
      let suppliersData: any[] = []
      if (productIds.length > 0) {
        let suppliersQuery = supabase
          .from('suppliers')
          .select(`
            id,
            product_id,
            name,
            supplier_type,
            country,
            email,
            telephone,
            website,
            supplier_url,
            verified
          `)
          .in('product_id', productIds)
        
        // Apply supplier filters if any
        if (filters.country) {
          suppliersQuery = suppliersQuery.eq('country', filters.country)
        }
        if (filters.supplier_type) {
          suppliersQuery = suppliersQuery.eq('supplier_type', filters.supplier_type)
        }
        
        const { data: supplierResults } = await suppliersQuery
        suppliersData = supplierResults || []
      }
      
      // Group suppliers by product_id
      const suppliersByProduct = suppliersData.reduce((acc, supplier) => {
        if (!acc[supplier.product_id]) {
          acc[supplier.product_id] = []
        }
        acc[supplier.product_id].push(supplier)
        return acc
      }, {} as Record<number, any[]>)
      
      // Filter products based on supplier filters
      let filteredProducts = allProducts || []
      
      if (filters.country || filters.supplier_type) {
        filteredProducts = filteredProducts.filter(product => {
          const suppliers = suppliersByProduct[product.id] || []
          // If no suppliers and filters are applied, exclude the product
          if (suppliers.length === 0) return false
          // Product has suppliers that match the filters
          return true
        })
      }
      
      // Apply pagination after filtering
      const totalFiltered = filteredProducts.length
      const paginatedProducts = filteredProducts.slice(offset, offset + limit)
      
      results.products = paginatedProducts.map(product => {
        const suppliers = suppliersByProduct[product.id] || []
        
        const countries = [...new Set(suppliers.map((s: any) => s.country).filter(Boolean))]
        const manufacturerCount = suppliers.filter((s: any) => s.supplier_type === 'Manufacturer').length
        const traderCount = suppliers.filter((s: any) => s.supplier_type === 'Trader').length
        
        return {
          id: product.id,
          name: product.name,
          cas_no: product.cas_no,
          product_url: product.product_url,
          supplier_count: suppliers.length,
          countries: countries,
          manufacturer_count: manufacturerCount,
          trader_count: traderCount,
          suppliers: suppliers.map((supplier: any) => {
            // 출처 판별 로직 개선
            let dataSource = 'Unknown'
            let sourceUrl = supplier.supplier_url || ''
            
            if (supplier.supplier_url?.includes('cphi')) {
              dataSource = 'CPHI Online'
              sourceUrl = supplier.supplier_url
            } else if (supplier.supplier_url?.includes('pharmacompass')) {
              dataSource = 'PharmaCompass'
              sourceUrl = supplier.supplier_url
            } else if (supplier.supplier_url?.includes('pharmaoffer')) {
              dataSource = 'PharmaOffer'
              sourceUrl = supplier.supplier_url
            } else if (product.product_url?.includes('pharmaoffer')) {
              // supplier_url이 없어도 product_url이 PharmOffer인 경우
              dataSource = 'PharmaOffer'
              sourceUrl = product.product_url
            } else if (product.product_url?.includes('cphi')) {
              dataSource = 'CPHI Online'
              sourceUrl = product.product_url
            } else if (product.product_url?.includes('pharmacompass')) {
              dataSource = 'PharmaCompass'
              sourceUrl = product.product_url
            }
            
            return {
              ...supplier,
              data_source: dataSource,
              source_url: sourceUrl // 참조할 URL 추가
            }
          })
        }
      })
      
      results.productCount = totalFiltered
    }
    
    // Search suppliers by name
    if (searchType === 'all' || searchType === 'supplier') {
      let supplierQuery = supabase
        .from('suppliers')
        .select(`
          id,
          name,
          supplier_type,
          country,
          email,
          telephone,
          website,
          supplier_url,
          verified,
          product_id
        `, { count: 'exact' })
        .ilike('name', `%${query}%`)
      
      // Apply filters
      if (filters.country) {
        supplierQuery = supplierQuery.eq('country', filters.country)
      }
      
      if (filters.supplier_type) {
        supplierQuery = supplierQuery.eq('supplier_type', filters.supplier_type)
      }
      
      supplierQuery = supplierQuery.range(offset, offset + limit - 1)
      
      const { data: suppliers, error: supplierError, count: supplierCount } = await supplierQuery
      
      if (supplierError) throw supplierError
      
      // Get product IDs from suppliers
      const productIdsForSuppliers = [...new Set(suppliers?.map(s => s.product_id).filter(Boolean) || [])]
      
      // Fetch product information for these suppliers
      let productsMap: Record<number, any> = {}
      if (productIdsForSuppliers.length > 0) {
        const { data: productsData } = await supabase
          .from('products')
          .select('id, name, cas_no, product_url')
          .in('id', productIdsForSuppliers)
        
        if (productsData) {
          productsMap = productsData.reduce((acc, product) => {
            acc[product.id] = product
            return acc
          }, {} as Record<number, any>)
        }
      }
      
      results.suppliers = suppliers?.map(supplier => {
        // 출처 정보 생성 (개선된 로직)
        const getDataSourceAndUrl = (supplierUrl: string, productId: number) => {
          let dataSource = 'Unknown'
          let sourceUrl = supplierUrl || ''
          
          if (supplierUrl?.includes('cphi')) {
            dataSource = 'CPHI Online'
            sourceUrl = supplierUrl
          } else if (supplierUrl?.includes('pharmacompass')) {
            dataSource = 'PharmaCompass'
            sourceUrl = supplierUrl
          } else if (supplierUrl?.includes('pharmaoffer')) {
            dataSource = 'PharmaOffer'
            sourceUrl = supplierUrl
          } else {
            // supplier_url이 없는 경우 product URL 확인
            const product = productsMap[productId]
            if (product) {
              if (product.product_url?.includes('pharmaoffer')) {
                dataSource = 'PharmaOffer'
                sourceUrl = product.product_url
              } else if (product.product_url?.includes('cphi')) {
                dataSource = 'CPHI Online'
                sourceUrl = product.product_url
              } else if (product.product_url?.includes('pharmacompass')) {
                dataSource = 'PharmaCompass'
                sourceUrl = product.product_url
              }
            }
          }
          
          return { dataSource, sourceUrl }
        }

        const { dataSource, sourceUrl } = getDataSourceAndUrl(supplier.supplier_url, supplier.product_id)

        return {
          id: supplier.id,
          name: supplier.name,
          supplier_type: supplier.supplier_type,
          country: supplier.country,
          email: supplier.email,
          telephone: supplier.telephone,
          website: supplier.website,
          supplier_url: supplier.supplier_url,
          verified: supplier.verified,
          data_source: dataSource,
          source_url: sourceUrl,
          product: supplier.product_id && productsMap[supplier.product_id] ? {
            id: productsMap[supplier.product_id].id,
            name: productsMap[supplier.product_id].name,
            cas_no: productsMap[supplier.product_id].cas_no
          } : null
        }
      }) || []
      
      results.supplierCount = supplierCount || 0
    }
    
    // Calculate total results
    results.total = (results.productCount || 0) + (results.supplierCount || 0)
    
    // 실시간 크롤링 (첫 페이지이고 제품 검색일 때만)
    if (includeRealtime && page === 1 && (searchType === 'all' || searchType === 'product')) {
      try {
        console.log(`실시간 CPHI 크롤링 시작: "${query}"`)
        const realtimeResults = await performRealtimeCrawling(query)
        
        // 실시간 크롤링에서 이미 상세 정보 수집됨
        
        results.realtime = realtimeResults
      } catch (realtimeError) {
        console.error('실시간 크롤링 에러:', realtimeError)
        results.realtime = {
          error: '실시간 크롤링 실패',
          message: realtimeError instanceof Error ? realtimeError.message : 'Unknown error'
        }
      }
    }
    
    return NextResponse.json({
      query,
      searchType,
      results,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(results.total / limit)
      }
    })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    )
  }
}

// GET method for autocomplete suggestions
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q') || ''
    const type = searchParams.get('type') || 'all'
    
    if (!query || query.length < 2) {
      return NextResponse.json({ suggestions: [] })
    }
    
    const suggestions: any[] = []
    
    // Get product name suggestions
    if (type === 'all' || type === 'product') {
      const { data: products } = await supabase
        .from('products')
        .select('name')
        .ilike('name', `%${query}%`)
        .limit(5)
      
      if (products) {
        suggestions.push(...products.map(p => ({
          type: 'product',
          value: p.name,
          label: `Product: ${p.name}`
        })))
      }
    }
    
    // Get CAS number suggestions
    if (type === 'all' || type === 'cas') {
      const { data: casNumbers } = await supabase
        .from('products')
        .select('cas_no, name')
        .ilike('cas_no', `%${query}%`)
        .not('cas_no', 'is', null)
        .limit(5)
      
      if (casNumbers) {
        suggestions.push(...casNumbers.map(p => ({
          type: 'cas',
          value: p.cas_no,
          label: `CAS: ${p.cas_no} (${p.name})`
        })))
      }
    }
    
    // Get supplier name suggestions
    if (type === 'all' || type === 'supplier') {
      const { data: suppliers } = await supabase
        .from('suppliers')
        .select('name, country')
        .ilike('name', `%${query}%`)
        .limit(5)
      
      if (suppliers) {
        suggestions.push(...suppliers.map(s => ({
          type: 'supplier',
          value: s.name,
          label: `Supplier: ${s.name}${s.country ? ` (${s.country})` : ''}`
        })))
      }
    }
    
    return NextResponse.json({ suggestions })
  } catch (error) {
    console.error('Autocomplete error:', error)
    return NextResponse.json({ suggestions: [] })
  }
}