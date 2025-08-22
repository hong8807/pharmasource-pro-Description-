'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Product, Supplier } from '@/types'

export default function ProductDetailPage() {
  const params = useParams()
  const productId = params.id as string
  const [product, setProduct] = useState<Product | null>(null)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (productId) {
      fetchProductDetails()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId])

  const fetchProductDetails = async () => {
    console.log('Fetching product details for ID:', productId, 'Type:', typeof productId)
    setLoading(true)
    try {
      const supabase = createClient()
      console.log('Supabase client created')
      
      // productId 검증
      const parsedId = parseInt(productId)
      if (isNaN(parsedId)) {
        console.error('Invalid product ID:', productId)
        throw new Error('Invalid product ID')
      }
      
      // 제품 정보 가져오기
      console.log('Fetching product with parsed ID:', parsedId)
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', parsedId)
        .single()

      console.log('Product query result:', { productData, productError })
      if (productError) {
        console.error('Product error:', productError)
        throw productError
      }
      // 필드명 매핑
      if (productData) {
        const mappedProduct: Product = {
          id: productData.id,
          name: (productData as any).product_name || (productData as any).name || '',
          cas_no: productData.cas_no,
          product_url: productData.product_url,
          created_at: productData.created_at || new Date().toISOString()
        }
        setProduct(mappedProduct)
      }

      // 공급업체 정보 가져오기
      console.log('Fetching suppliers for product ID:', parsedId)
      const { data: suppliersData, error: suppliersError } = await supabase
        .from('suppliers')
        .select('*')
        .eq('product_id', parsedId)
        .order('supplier_type', { ascending: true })

      console.log('Suppliers query result:', { count: suppliersData?.length, suppliersError })
      if (suppliersError) {
        console.error('Suppliers error:', suppliersError)
        throw suppliersError
      }
      // 공급업체 필드명 매핑
      if (suppliersData) {
        const mappedSuppliers: Supplier[] = suppliersData.map((supplier: any) => ({
          id: supplier.id,
          product_id: supplier.product_id,
          name: supplier.company_name || supplier.name || '',
          supplier_type: supplier.supplier_type,
          country: supplier.country,
          address: supplier.address,
          telephone: supplier.telephone,
          email: supplier.contact_info || supplier.email,
          website: supplier.website,
          supplier_url: supplier.supplier_url,
          created_at: supplier.created_at || new Date().toISOString()
        }))
        setSuppliers(mappedSuppliers)
      } else {
        setSuppliers([])
      }
    } catch (error) {
      console.error('데이터 로딩 중 오류:', error)
      setProduct(null)
      setSuppliers([])
    } finally {
      console.log('Loading finished')
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-600">제품을 찾을 수 없습니다.</p>
        </div>
      </div>
    )
  }

  const manufacturerCount = suppliers.filter(s => s.supplier_type === 'Manufacturer').length
  const traderCount = suppliers.filter(s => s.supplier_type === 'Trader').length
  const countries = [...new Set(suppliers.map(s => s.country).filter(Boolean))]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link href="/" className="text-primary-600 hover:text-primary-900 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          검색으로 돌아가기
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-600">CAS 번호:</span>
            <span className="ml-2 text-gray-900">{product.cas_no || '-'}</span>
          </div>
          <div>
            <span className="font-medium text-gray-600">총 공급업체:</span>
            <span className="ml-2 text-gray-900">{suppliers.length}개</span>
          </div>
          <div>
            <span className="font-medium text-gray-600">제조사:</span>
            <span className="ml-2 text-gray-900">{manufacturerCount}개</span>
          </div>
          <div>
            <span className="font-medium text-gray-600">무역업체:</span>
            <span className="ml-2 text-gray-900">{traderCount}개</span>
          </div>
        </div>
        {countries.length > 0 && (
          <div className="mt-4">
            <span className="font-medium text-gray-600">공급 국가:</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {countries.map(country => (
                <span key={country} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                  {country}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h2 className="text-xl font-semibold text-gray-900">공급업체 목록</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  공급업체명
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  유형
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  국가
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  연락처
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  웹사이트
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  자료 출처
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {suppliers.map((supplier) => (
                <tr key={supplier.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {supplier.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      supplier.supplier_type === 'Manufacturer' 
                        ? 'bg-blue-100 text-blue-800' 
                        : supplier.supplier_type === 'Trader'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {supplier.supplier_type || '미분류'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {supplier.country === 'N/A' ? (
                      <span className="text-red-500" title="데이터 수집 필요">
                        N/A (재크롤링 필요)
                      </span>
                    ) : (
                      supplier.country || '-'
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div className="space-y-1">
                      {supplier.email && (
                        <div>
                          <a href={`mailto:${supplier.email}`} className="text-primary-600 hover:text-primary-900">
                            {supplier.email}
                          </a>
                        </div>
                      )}
                      {supplier.telephone && (
                        <div className="text-gray-600">{supplier.telephone}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {supplier.website && (
                      <a
                        href={supplier.website.startsWith('http') ? supplier.website : `https://${supplier.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:text-primary-900"
                      >
                        방문
                      </a>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {supplier.supplier_url && (
                      <a
                        href={supplier.supplier_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:text-primary-900 truncate block max-w-xs"
                        title={supplier.supplier_url}
                      >
                        {supplier.supplier_url.length > 40 
                          ? supplier.supplier_url.substring(0, 40) + '...' 
                          : supplier.supplier_url}
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}