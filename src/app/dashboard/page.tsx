'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Statistics {
  totalProducts: number
  totalSuppliers: number
  manufacturerCount: number
  traderCount: number
  countryCount: number
  topCountries: { country: string; count: number }[]
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Statistics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStatistics()
  }, [])

  const fetchStatistics = async () => {
    setLoading(true)
    try {
      // 제품 총 개수
      const { count: productCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })

      // 공급업체 총 개수
      const { count: supplierCount } = await supabase
        .from('suppliers')
        .select('*', { count: 'exact', head: true })

      // 제조사 개수
      const { count: manufacturerCount } = await supabase
        .from('suppliers')
        .select('*', { count: 'exact', head: true })
        .eq('supplier_type', 'Manufacturer')

      // 무역업체 개수
      const { count: traderCount } = await supabase
        .from('suppliers')
        .select('*', { count: 'exact', head: true })
        .eq('supplier_type', 'Trader')

      // 국가별 공급업체 수
      const { data: suppliersData } = await supabase
        .from('suppliers')
        .select('country')
        .not('country', 'is', null)

      const countryCounts = new Map<string, number>()
      suppliersData?.forEach(item => {
        const country = item.country
        if (country) {
          countryCounts.set(country, (countryCounts.get(country) || 0) + 1)
        }
      })

      const topCountries = Array.from(countryCounts.entries())
        .map(([country, count]) => ({ country, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)

      setStats({
        totalProducts: productCount || 0,
        totalSuppliers: supplierCount || 0,
        manufacturerCount: manufacturerCount || 0,
        traderCount: traderCount || 0,
        countryCount: countryCounts.size,
        topCountries
      })
    } catch (error) {
      console.error('통계 데이터 로딩 중 오류:', error)
    } finally {
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

  if (!stats) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-600">데이터를 불러올 수 없습니다.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">대시보드</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">총 제품 수</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalProducts.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-primary-100 rounded-full">
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">총 공급업체 수</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalSuppliers.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">제조사</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.manufacturerCount.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">무역업체</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.traderCount.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">공급업체 상위 10개국</h2>
          <div className="space-y-3">
            {stats.topCountries.map((item, index) => (
              <div key={item.country} className="flex items-center">
                <span className="text-sm font-medium text-gray-600 w-8">{index + 1}.</span>
                <span className="flex-1 text-sm text-gray-900">{item.country}</span>
                <span className="text-sm font-semibold text-gray-900">{item.count}개</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">데이터 출처</h2>
          <div className="space-y-4">
            <div className="border-l-4 border-primary-500 pl-4">
              <h3 className="font-semibold text-gray-900">PharmaCompass</h3>
              <p className="text-sm text-gray-600">928페이지의 제품 데이터</p>
              <p className="text-xs text-gray-500">Selenium 기반 크롤러 사용</p>
            </div>
            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="font-semibold text-gray-900">PharmaOffer</h3>
              <p className="text-sm text-gray-600">276페이지의 제품 데이터</p>
              <p className="text-xs text-gray-500">requests/BeautifulSoup 크롤러 사용</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}