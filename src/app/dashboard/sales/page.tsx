'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'

interface DashboardData {
  stats: {
    pending: number
    in_progress: number
    completed: number
    total: number
  }
  recentCompleted: Array<{
    id: number
    product_name: string
    client_name: string
    status: string
    completed_at: string
  }>
}

export default function SalesDashboard() {
  const router = useRouter()
  const { userData, loading } = useAuth()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    if (!loading && (!userData || userData.department !== 'sales')) {
      router.push('/login')
    }
  }, [userData, loading, router])

  useEffect(() => {
    if (userData && userData.department === 'sales') {
      fetchDashboardData()
      
      // 30초마다 자동 새로고침
      const interval = setInterval(() => {
        fetchDashboardData()
      }, 30000)
      
      return () => clearInterval(interval)
    }
  }, [userData])

  const fetchDashboardData = async () => {
    setDataLoading(true)
    try {
      const response = await fetch('/api/dashboard/sales')
      if (response.ok) {
        const data = await response.json()
        console.log('Dashboard data received:', data)
        setDashboardData(data)
      } else {
        const error = await response.json()
        console.error('API Error:', error)
      }
    } catch (error) {
      console.error('대시보드 데이터 로드 실패:', error)
    } finally {
      setDataLoading(false)
    }
  }

  if (loading || dataLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!userData || userData.department !== 'sales') {
    return null
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">영업부 대시보드</h1>
          <button
            onClick={fetchDashboardData}
            className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            새로고침
          </button>
        </div>
        
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {/* 내 소싱 의뢰 현황 */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">내 소싱 의뢰 현황</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">대기중</span>
                <span className="font-semibold">{dashboardData?.stats.pending || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">진행중</span>
                <span className="font-semibold">{dashboardData?.stats.in_progress || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">완료</span>
                <span className="font-semibold">{dashboardData?.stats.completed || 0}</span>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between">
                  <span className="text-gray-900 font-medium">전체</span>
                  <span className="font-bold text-indigo-600">{dashboardData?.stats.total || 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 빠른 의뢰 */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">빠른 의뢰</h2>
            <button
              onClick={() => router.push('/sourcing/new')}
              className="w-full bg-indigo-600 text-white rounded-md py-2 px-4 hover:bg-indigo-700 transition"
            >
              새 소싱 의뢰 작성
            </button>
          </div>

          {/* 최근 완료된 소싱 */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">최근 완료된 소싱</h2>
            {dashboardData?.recentCompleted && dashboardData.recentCompleted.length > 0 ? (
              <ul className="space-y-2">
                {dashboardData.recentCompleted.map((item) => (
                  <li key={item.id} className="text-sm">
                    <div className="font-medium text-gray-900">{item.product_name}</div>
                    <div className="text-gray-500">{item.client_name}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-sm">아직 완료된 소싱이 없습니다.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}