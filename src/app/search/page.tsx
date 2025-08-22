'use client'

import { useState } from 'react'
import SearchBar from '@/components/SearchBar'
import ProductTable from '@/components/ProductTable'
import { Product, Supplier, SearchResult } from '@/types'

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchType, setSearchType] = useState<'all' | 'product' | 'cas' | 'supplier'>('all')
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [showSuppliers, setShowSuppliers] = useState(false)
  const [realtimeProgress, setRealtimeProgress] = useState<{
    isLoading: boolean
    status: string
    results?: any
    allResults: any[]  // 누적된 모든 결과
    currentOffset: number  // 현재 오프셋
    hasMoreAvailable: boolean  // 더 가져올 수 있는지 여부
  }>({
    isLoading: false,
    status: '',
    allResults: [],
    currentOffset: 0,
    hasMoreAvailable: false
  })

  const handleShowMoreRealtime = async () => {
    if (!searchTerm || searchTerm.length < 2) return

    const currentOffset = realtimeProgress.currentOffset
    const batchSize = 300

    setRealtimeProgress(prev => ({
      ...prev,
      isLoading: true,
      status: `CPHI 추가 결과 검색 중... (${currentOffset + 1}~${currentOffset + batchSize}번째) - 최대 35초 소요`
    }))

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 35000) // 35초 타임아웃

      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchTerm,
          realtimeOnly: true,
          realtimeLimit: batchSize,
          realtimeOffset: currentOffset // 오프셋 추가
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP ${response.status}: 확장 실시간 크롤링 실패`)
      }

      const data = await response.json()
      
      if (data.results.realtime && data.results.realtime.success) {
        const newResults = data.results.realtime.results || []
        const totalCollected = realtimeProgress.allResults.length + newResults.length
        
        setRealtimeProgress(prev => ({
          ...prev,
          isLoading: false,
          status: `누적 ${totalCollected}개 수집 완료 (총 ${data.results.realtime.totalAvailable || '알 수 없음'}개 중) - ${data.results.realtime.processingTime}`,
          results: data.results.realtime,
          allResults: [...prev.allResults, ...newResults],
          currentOffset: currentOffset + newResults.length,
          hasMoreAvailable: newResults.length === batchSize && data.results.realtime.hasMore !== false
        }))
      } else {
        throw new Error(data.results.realtime?.error || '실시간 크롤링 결과가 없습니다')
      }
    } catch (error) {
      console.error('확장 실시간 크롤링 에러:', error)
      let errorMessage = '알 수 없는 오류'
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = '요청 시간 초과 (35초)'
        } else {
          errorMessage = error.message
        }
      }
      
      setRealtimeProgress(prev => ({
        ...prev,
        isLoading: false,
        status: `확장 크롤링 실패: ${errorMessage}`
      }))
    }
  }

  // DB 데이터만 빠르게 검색하는 함수
  const searchDatabaseOnly = async (page: number = 1) => {
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchTerm,
          searchType,
          filters: {},
          page,
          limit: 20,
          includeRealtime: false // 실시간 크롤링 제외
        })
      })

      if (!response.ok) {
        throw new Error('Search failed')
      }

      const data = await response.json()
      setSearchResults(data.results)
      setShowSuppliers(searchType === 'supplier' || (data.results.suppliers && data.results.suppliers.length > 0 && data.results.products.length === 0))
      
    } catch (error) {
      console.error('Database search error:', error)
      throw error
    }
  }

  // 실시간 크롤링만 처리하는 함수
  const performRealtimeCrawling = async () => {
    setRealtimeProgress({
      isLoading: true,
      status: 'CPHI 실시간 검색 중...',
      results: null,
      allResults: [],
      currentOffset: 0,
      hasMoreAvailable: false
    })

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchTerm,
          realtimeOnly: true,
          realtimeLimit: 30
        })
      })

      if (!response.ok) {
        throw new Error('Realtime crawling failed')
      }

      const data = await response.json()
      
      if (data.results.realtime && data.results.realtime.success) {
        const initialResults = data.results.realtime.results || []
        setRealtimeProgress({
          isLoading: false,
          status: `실시간 결과 ${data.results.realtime.count}개 수집 완료`,
          results: data.results.realtime,
          allResults: initialResults,
          currentOffset: initialResults.length,
          hasMoreAvailable: data.results.realtime.hasMore !== false && initialResults.length > 0
        })
      } else {
        setRealtimeProgress({
          isLoading: false,
          status: `실시간 크롤링 실패: ${data.results.realtime?.error || '알 수 없는 오류'}`,
          results: null,
          allResults: [],
          currentOffset: 0,
          hasMoreAvailable: false
        })
      }
    } catch (error) {
      console.error('Realtime crawling error:', error)
      setRealtimeProgress({
        isLoading: false,
        status: '실시간 크롤링 실패',
        results: null,
        allResults: [],
        currentOffset: 0,
        hasMoreAvailable: false
      })
    }
  }

  const handleSearch = async (page: number = 1) => {
    if (searchTerm.length < 2) {
      alert('검색어는 최소 2자 이상 입력해주세요.')
      return
    }

    setLoading(true)
    setCurrentPage(page)
    
    try {
      // 1. DB 데이터 먼저 빠르게 로드
      await searchDatabaseOnly(page)
      
      // 2. 첫 페이지인 경우 실시간 크롤링을 비동기로 시작
      if (page === 1) {
        performRealtimeCrawling() // await 없이 비동기 실행
      }
      
    } catch (error) {
      console.error('Search error:', error)
      alert('검색 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }



  const formatProductsForTable = (products: Product[]): any[] => {
    return products.map(product => ({
      id: product.id,
      name: product.name,
      cas_no: product.cas_no || '-',
      supplier_count: product.supplier_count || 0,
      countries: product.countries?.join(', ') || '-',
      manufacturers: product.manufacturer_count || 0,
      traders: product.trader_count || 0
    }))
  }

  const formatSuppliersForTable = (suppliers: Supplier[]): any[] => {
    return suppliers.map(supplier => ({
      id: supplier.id,
      name: supplier.name,
      type: supplier.supplier_type || '-',
      country: supplier.country || '-',
      product_name: supplier.product?.name || '-',
      cas_no: supplier.product?.cas_no || '-',
      email: supplier.email || '-',
      telephone: supplier.telephone || '-',
      data_source: (supplier as any).data_source || '-',
      supplier_url: (supplier as any).supplier_url
    }))
  }

  const supplierColumns = [
    { key: 'name', label: '공급업체명' },
    { key: 'type', label: '유형' },
    { key: 'country', label: '국가' },
    { key: 'product_name', label: '제품명' },
    { key: 'cas_no', label: 'CAS 번호' },
    { key: 'data_source', label: '출처' },
    { key: 'email', label: '이메일' },
    { key: 'telephone', label: '전화번호' }
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">통합 검색</h1>
      
      <SearchBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onSearch={() => handleSearch(1)}
        loading={loading}
        searchType={searchType}
        onSearchTypeChange={setSearchType}
      />

      {/* 실시간 크롤링 진행 상황 */}
      {(realtimeProgress.isLoading || realtimeProgress.results) && (
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            {realtimeProgress.isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-blue-800 font-medium">{realtimeProgress.status}</span>
              </>
            ) : (
              <>
                {realtimeProgress.results?.success ? (
                  <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                )}
                <span className={`font-medium ${realtimeProgress.results?.success ? 'text-green-800' : 'text-yellow-800'}`}>
                  {realtimeProgress.status}
                </span>
                {realtimeProgress.results?.processingTime && (
                  <span className="text-xs text-gray-500">
                    ({realtimeProgress.results.processingTime})
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      )}

      <div className="mt-8">
        <div className="w-full">
          {/* CPHI 실시간 검색 결과 */}
          {realtimeProgress.results?.success && realtimeProgress.allResults?.length > 0 && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-800 mb-3">
                🔍 CPHI Online 실시간 검색 결과
              </h3>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-blue-700">
                  &quot;{realtimeProgress.results.query}&quot;에 대한 CPHI 실시간 결과: 
                  <span className="font-semibold ml-1">{realtimeProgress.allResults.length}개</span>
                  {realtimeProgress.results.totalAvailable && (
                    <span className="text-blue-600 font-medium">
                      {' '}(총 {realtimeProgress.results.totalAvailable}개 중)
                    </span>
                  )}
                  <span className="ml-2 text-xs bg-blue-200 px-2 py-1 rounded">
                    {new Date(realtimeProgress.results.timestamp).toLocaleTimeString('ko-KR')} 업데이트
                  </span>
                </p>
                {realtimeProgress.hasMoreAvailable && (
                  <button
                    onClick={handleShowMoreRealtime}
                    disabled={realtimeProgress.isLoading}
                    className="inline-flex items-center px-3 py-1 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    {realtimeProgress.isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        검색 중...
                      </>
                    ) : (
                      `더 많은 결과 보기 (+300개)`
                    )}
                  </button>
                )}
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white rounded-lg shadow">
                  <thead className="bg-blue-100">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-blue-800 uppercase">제품/회사명</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-blue-800 uppercase">유형</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-blue-800 uppercase">공급업체</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-blue-800 uppercase">국가</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-blue-800 uppercase">출처</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-blue-200">
                    {realtimeProgress.allResults.map((item: any, index: number) => (
                      <tr 
                        key={index} 
                        className={`hover:bg-blue-50 ${item.url ? 'cursor-pointer' : ''}`}
                        onClick={() => {
                          if (item.url) {
                            console.log('클릭한 URL:', item.url)
                            console.log('제품/회사명:', item.title)
                            
                            try {
                              // 생성된 상세 페이지 URL로 직접 이동
                              window.open(item.url, '_blank', 'noopener,noreferrer')
                            } catch (error) {
                              console.error('링크 열기 실패:', error)
                              // 에러 시 CPHI 메인 페이지로 이동
                              window.open('https://www.cphi-online.com/', '_blank', 'noopener,noreferrer')
                            }
                          }
                        }}
                      >
                        <td className="px-4 py-2 text-sm">
                          <div className="flex items-center gap-2">
                            <span className={`font-medium ${item.url ? 'text-blue-600 hover:text-blue-800' : 'text-gray-900'}`}>
                              {item.title || '-'}
                            </span>
                            {item.url && (
                              <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600">
                          <span className={`inline-block px-2 py-1 rounded text-xs ${
                            item.type === 'product' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-orange-100 text-orange-700'
                          }`}>
                            {item.type === 'product' ? '제품' : item.type === 'company' ? '회사' : item.type}
                          </span>
                          {item.verified === 'true' && (
                            <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">✓ 인증</span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {item.company || (item.type === 'company' ? item.title : '-')}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600">
                          {item.country || '-'}
                        </td>
                        <td className="px-4 py-2 text-sm text-blue-600">
                          {item.source}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {searchResults && (
            <div className="space-y-6">
              {/* 검색 결과 요약 */}
              <div className="bg-white p-4 rounded-lg shadow-md">
                <h2 className="text-lg font-semibold mb-2">검색 결과</h2>
                <p className="text-gray-600">
                  &quot;{searchTerm}&quot;에 대한 검색 결과: 
                  {(searchResults.productCount ?? 0) > 0 && ` 제품 ${searchResults.productCount}개`}
                  {(searchResults.productCount ?? 0) > 0 && (searchResults.supplierCount ?? 0) > 0 && ','}
                  {(searchResults.supplierCount ?? 0) > 0 && ` 공급업체 ${searchResults.supplierCount}개`}
                </p>
              </div>

              {/* 탭 전환 */}
              {(searchResults.productCount ?? 0) > 0 && (searchResults.supplierCount ?? 0) > 0 && (
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setShowSuppliers(false)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      !showSuppliers 
                        ? 'bg-primary-600 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    제품 ({searchResults.productCount})
                  </button>
                  <button
                    onClick={() => setShowSuppliers(true)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      showSuppliers 
                        ? 'bg-primary-600 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    공급업체 ({searchResults.supplierCount})
                  </button>
                </div>
              )}

              {/* 검색 결과 테이블 */}
              {!showSuppliers && searchResults.products.length > 0 ? (
                <ProductTable
                  products={searchResults.products}
                  loading={loading}
                />
              ) : !showSuppliers && searchResults && searchResults.products.length === 0 ? (
                <div className="bg-white rounded-lg shadow-md p-8 text-center">
                  <p className="text-gray-600">검색된 제품이 없습니다.</p>
                </div>
              ) : null}

              {showSuppliers && searchResults.suppliers.length > 0 && (
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        {supplierColumns.map(col => (
                          <th key={col.key} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {col.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {formatSuppliersForTable(searchResults.suppliers).map((supplier, index) => (
                        <tr key={supplier.id} className="hover:bg-gray-50">
                          {supplierColumns.map(col => (
                            <td key={col.key} className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                              {col.key === 'name' && supplier.supplier_url ? (
                                <a 
                                  href={supplier.supplier_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 hover:underline"
                                >
                                  {supplier[col.key]}
                                </a>
                              ) : col.key === 'data_source' && supplier.supplier_url ? (
                                <a 
                                  href={supplier.supplier_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1"
                                >
                                  {supplier[col.key]}
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                </a>
                              ) : (
                                supplier[col.key]
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {searchResults.products.length === 0 && searchResults.suppliers.length === 0 && (
                <div className="bg-white p-8 rounded-lg shadow-md text-center">
                  <p className="text-gray-500">검색 결과가 없습니다.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}