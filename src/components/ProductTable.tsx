'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Product, Supplier } from '@/types'

interface ProductTableProps {
  products: Product[]
  loading: boolean
}

export default function ProductTable({ 
  products, 
  loading
}: ProductTableProps) {
  const [productsWithSuppliers, setProductsWithSuppliers] = useState<(Product & { supplierCount: number })[]>([])
  const [expandedProducts, setExpandedProducts] = useState<Set<number>>(new Set())
  const [suppliers, setSuppliersMap] = useState<Map<number, Supplier[]>>(new Map())

  useEffect(() => {
    console.log('ProductTable received products:', products)
    if (products.length > 0) {
      // API에서 이미 supplier_count를 제공하는 경우 그대로 사용
      if (products[0].supplier_count !== undefined) {
        const productsWithCounts = products.map(p => ({ 
          ...p, 
          supplierCount: p.supplier_count || 0 
        }))
        setProductsWithSuppliers(productsWithCounts)
      } else {
        // supplier_count가 없는 경우에만 별도로 가져오기
        const initialProducts = products.map(p => ({ ...p, supplierCount: 0 }))
        setProductsWithSuppliers(initialProducts)
        fetchSupplierCounts()
      }
    } else {
      setProductsWithSuppliers([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products])

  const fetchSupplierCounts = async () => {
    const supabase = createClient()
    const productIds = products.map(p => p.id)
    console.log('Fetching supplier counts for product IDs:', productIds)
    
    const { data, error } = await supabase
      .from('suppliers')
      .select('product_id, id')
      .in('product_id', productIds)
    
    console.log('Supplier counts query result:', { data, error })
    
    const counts = new Map<number, number>()
    data?.forEach(supplier => {
      counts.set(supplier.product_id, (counts.get(supplier.product_id) || 0) + 1)
    })
    
    const productsWithCounts = products.map(product => ({
      ...product,
      supplierCount: counts.get(product.id) || 0
    }))
    
    console.log('Products with supplier counts:', productsWithCounts)
    setProductsWithSuppliers(productsWithCounts)
  }

  const toggleProductExpansion = (productId: number) => {
    console.log('Toggle expansion for product:', productId)
    const newExpanded = new Set(expandedProducts)
    
    if (newExpanded.has(productId)) {
      newExpanded.delete(productId)
    } else {
      newExpanded.add(productId)
    }
    
    setExpandedProducts(newExpanded)
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">검색 중...</p>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <p className="text-gray-600">검색 결과가 없습니다.</p>
      </div>
    )
  }

  console.log('Rendering ProductTable with productsWithSuppliers:', productsWithSuppliers)

  // productsWithSuppliers가 아직 로드되지 않았으면 products를 사용
  const displayProducts = productsWithSuppliers.length > 0 ? productsWithSuppliers : products.map(p => ({ ...p, supplierCount: p.supplier_count || 0 }))

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      {/* 테이블 헤더 */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">제품 검색 결과</h3>
        <p className="text-sm text-gray-600 mt-1">총 {displayProducts.length}개의 제품이 발견되었습니다</p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b-2 border-gray-200">
            <tr>
              <th className="px-8 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wide w-2/5">
                <div className="flex items-center space-x-2">
                  <span>제품명</span>
                </div>
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wide w-1/6">
                <div className="flex items-center space-x-2">
                  <span>CAS 번호</span>
                </div>
              </th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 uppercase tracking-wide w-1/6">
                <div className="flex items-center justify-center space-x-2">
                  <span>공급업체 수</span>
                </div>
              </th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 uppercase tracking-wide w-1/6">
                작업
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {displayProducts.map((product) => (
              <React.Fragment key={product.id}>
                <tr className="hover:bg-blue-50/30 transition-colors duration-150">
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                      <div className="text-base font-semibold text-gray-900 leading-tight">
                        {product.name}
                      </div>
                      {(product as any).description && (
                        <div className="text-sm text-gray-500 mt-1 line-clamp-2">
                          {(product as any).description}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="text-sm font-mono text-gray-700 bg-gray-100 px-2 py-1 rounded text-center">
                        {product.cas_no || '-'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <div className="flex justify-center">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        {product.supplierCount || product.supplier_count || 0}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <button
                      onClick={() => toggleProductExpansion(product.id)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      {expandedProducts.has(product.id) ? (
                        <>
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                          접기
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                          공급업체 보기
                        </>
                      )}
                    </button>
                  </td>
                </tr>
                {expandedProducts.has(product.id) && (
                  <tr>
                    <td colSpan={4} className="px-0 py-0">
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-t border-gray-200">
                        <div className="px-8 py-4">
                          <h4 className="text-lg font-semibold text-gray-800 mb-3">
                            {product.name} - 공급업체 목록
                          </h4>
                          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                            <div className="overflow-x-auto">
                              <table className="min-w-full">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700 uppercase tracking-wide">
                                      공급업체명
                                    </th>
                                    <th className="py-3 px-4 text-center text-sm font-semibold text-gray-700 uppercase tracking-wide">
                                      유형
                                    </th>
                                    <th className="py-3 px-4 text-center text-sm font-semibold text-gray-700 uppercase tracking-wide">
                                      국가
                                    </th>
                                    <th className="py-3 px-4 text-center text-sm font-semibold text-gray-700 uppercase tracking-wide">
                                      출처
                                    </th>
                                    <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700 uppercase tracking-wide">
                                      연락처
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                  {(product.suppliers && product.suppliers.length > 0) ? (
                                    product.suppliers.map((supplier: any) => (
                                      <tr key={supplier.id} className="hover:bg-gray-50 transition-colors duration-150">
                                        <td className="py-4 px-6">
                                          <div className="flex flex-col">
                                            <div className="font-medium text-gray-900">
                                              {(() => {
                                                const linkUrl = supplier.source_url || supplier.supplier_url
                                                return linkUrl ? (
                                                  <a 
                                                    href={linkUrl} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:text-blue-800 hover:underline font-semibold"
                                                  >
                                                    {supplier.name}
                                                  </a>
                                                ) : (
                                                  <span className="font-semibold">{supplier.name}</span>
                                                )
                                              })()}
                                            </div>
                                          </div>
                                        </td>
                                        <td className="py-4 px-4 text-center">
                                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                            supplier.supplier_type === 'Manufacturer' 
                                              ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                                          }`}>
                                            {supplier.supplier_type || '-'}
                                          </span>
                                        </td>
                                        <td className="py-4 px-4 text-center">
                                          <span className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-gray-800 text-sm font-medium">
                                            {supplier.country || '-'}
                                          </span>
                                        </td>
                                        <td className="py-4 px-4 text-center">
                                          {(() => {
                                            // 출처 정보 결정
                                            const dataSource = supplier.data_source || 
                                              (supplier.supplier_url?.includes('cphi') ? 'CPHI Online' :
                                               supplier.supplier_url?.includes('pharmacompass') ? 'PharmaCompass' :
                                               supplier.supplier_url?.includes('pharmaoffer') ? 'PharmaOffer' : 'Unknown')
                                            
                                            // 연결할 URL 결정 (source_url 우선, 없으면 supplier_url)
                                            const linkUrl = supplier.source_url || supplier.supplier_url
                                            
                                            // 출처별 스타일 결정
                                            const getSourceStyle = (source: string) => {
                                              if (source === 'CPHI Online') {
                                                return 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 border-blue-200 hover:from-blue-200 hover:to-cyan-200'
                                              } else if (source === 'PharmaCompass') {
                                                return 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border-purple-200 hover:from-purple-200 hover:to-pink-200'
                                              } else if (source === 'PharmaOffer') {
                                                return 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-green-200 hover:from-green-200 hover:to-emerald-200'
                                              } else {
                                                return 'bg-gradient-to-r from-gray-100 to-gray-100 text-gray-700 border-gray-200 hover:from-gray-200 hover:to-gray-200'
                                              }
                                            }
                                            
                                            return linkUrl ? (
                                              <a 
                                                href={linkUrl} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className={`inline-flex items-center px-3 py-1 rounded-lg transition-all duration-200 border ${getSourceStyle(dataSource)}`}
                                              >
                                                <span className="text-sm font-medium">
                                                  {dataSource}
                                                </span>
                                                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                </svg>
                                              </a>
                                            ) : (
                                              <span className={`inline-flex items-center px-3 py-1 rounded-lg border ${getSourceStyle(dataSource)}`}>
                                                <span className="text-sm font-medium">
                                                  {dataSource}
                                                </span>
                                              </span>
                                            )
                                          })()}
                                        </td>
                                        <td className="py-4 px-6">
                                          <div className="flex flex-col space-y-1">
                                            {supplier.email && (
                                              <a href={`mailto:${supplier.email}`} className="inline-flex items-center text-blue-600 hover:text-blue-800 hover:underline text-sm">
                                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                </svg>
                                                {supplier.email}
                                              </a>
                                            )}
                                            {supplier.telephone && (
                                              <div className="inline-flex items-center text-gray-600 text-sm">
                                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                </svg>
                                                {supplier.telephone}
                                              </div>
                                            )}
                                            {!supplier.email && !supplier.telephone && (
                                              <span className="text-gray-400 text-sm">연락처 없음</span>
                                            )}
                                          </div>
                                        </td>
                                      </tr>
                                    ))
                                  ) : (
                                    <tr>
                                      <td colSpan={5} className="py-8 px-6 text-center">
                                        <div className="flex flex-col items-center space-y-2">
                                          <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                          </svg>
                                          <p className="text-gray-500 font-medium">이 제품에 대한 공급업체 정보가 없습니다.</p>
                                          <p className="text-gray-400 text-sm">실시간 크롤링을 통해 최신 공급업체 정보를 확인해보세요.</p>
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}