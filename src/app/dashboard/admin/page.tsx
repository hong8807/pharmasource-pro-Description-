'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'

export default function AdminDashboard() {
  const router = useRouter()
  const { userData, loading } = useAuth()
  const [crawlingStatus, setCrawlingStatus] = useState<{
    isRunning: boolean;
    lastUpdate: string | null;
    pharmacompassProducts: number;
    pharmacompassSuppliers: number;
  }>({
    isRunning: false,
    lastUpdate: null,
    pharmacompassProducts: 0,
    pharmacompassSuppliers: 0
  })

  useEffect(() => {
    if (!loading && (!userData || userData.department !== 'admin')) {
      router.push('/login')
    }
    
    // 관리자인 경우 크롤링 상태 조회
    if (userData && userData.department === 'admin') {
      fetchCrawlingStatus()
    }
  }, [userData, loading, router])

  const fetchCrawlingStatus = async () => {
    try {
      const response = await fetch('/api/admin/update-pharmacompass')
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setCrawlingStatus(prev => ({
            ...prev,
            pharmacompassProducts: result.data.pharmacompass_products || 0,
            pharmacompassSuppliers: result.data.pharmacompass_suppliers || 0,
            lastUpdate: result.data.last_updated
          }))
        }
      }
    } catch (error) {
      console.error('크롤링 상태 조회 실패:', error)
    }
  }

  const startPharmaCompassUpdate = async () => {
    if (crawlingStatus.isRunning) return
    
    setCrawlingStatus(prev => ({ ...prev, isRunning: true }))
    
    try {
      const response = await fetch('/api/admin/update-pharmacompass', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const result = await response.json()
      
      if (result.success) {
        alert('PharmaCompass 데이터 업데이트가 완료되었습니다!')
        await fetchCrawlingStatus() // 상태 새로고침
      } else {
        alert(`업데이트 실패: ${result.error}`)
      }
    } catch (error) {
      console.error('PharmaCompass 업데이트 실패:', error)
      alert('업데이트 중 오류가 발생했습니다.')
    } finally {
      setCrawlingStatus(prev => ({ ...prev, isRunning: false }))
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-huxeed-green mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!userData || userData.department !== 'admin') {
    return null
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">관리자 대시보드</h1>
        
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-4">
          {/* 전체 통계 */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-sm font-medium text-gray-500">총 제품 수</h3>
            <p className="mt-2 text-3xl font-semibold text-gray-900">11,473</p>
          </div>
          
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-sm font-medium text-gray-500">총 공급업체 수</h3>
            <p className="mt-2 text-3xl font-semibold text-gray-900">16,419</p>
          </div>
          
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-sm font-medium text-gray-500">활성 사용자</h3>
            <p className="mt-2 text-3xl font-semibold text-gray-900">1</p>
          </div>
          
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-sm font-medium text-gray-500">진행중 소싱</h3>
            <p className="mt-2 text-3xl font-semibold text-gray-900">0</p>
          </div>
        </div>

        {/* 데이터 크롤링 관리 */}
        <div className="mt-8">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium text-gray-900">데이터 크롤링 관리</h2>
              <div className="flex items-center space-x-2">
                <div className={`h-2 w-2 rounded-full ${crawlingStatus.isRunning ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`}></div>
                <span className="text-sm text-gray-600">
                  {crawlingStatus.isRunning ? '크롤링 진행중' : '대기중'}
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">PharmaCompass 제품</h3>
                <p className="text-2xl font-bold text-huxeed-green">
                  {crawlingStatus.pharmacompassProducts.toLocaleString()}
                </p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">PharmaCompass 공급업체</h3>
                <p className="text-2xl font-bold text-green-600">
                  {crawlingStatus.pharmacompassSuppliers.toLocaleString()}
                </p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">마지막 업데이트</h3>
                <p className="text-sm text-gray-600">
                  {crawlingStatus.lastUpdate 
                    ? new Date(crawlingStatus.lastUpdate).toLocaleString('ko-KR')
                    : '정보 없음'
                  }
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-between border-t pt-4">
              <div className="text-sm text-gray-600">
                <p>• PharmaCompass 웹사이트에서 최신 API 제품 및 공급업체 정보를 수집합니다.</p>
                <p>• 크롤링은 약 30분-1시간 소요되며, 백그라운드에서 실행됩니다.</p>
                <p>• 기존 데이터는 유지되고 새로운 데이터만 추가됩니다.</p>
              </div>
              
              <button
                onClick={startPharmaCompassUpdate}
                disabled={crawlingStatus.isRunning}
                className={`px-6 py-3 rounded-lg text-white font-medium transition-colors ${
                  crawlingStatus.isRunning
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-huxeed-green hover:bg-green-600 active:bg-green-700'
                }`}
              >
                {crawlingStatus.isRunning ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>크롤링 진행중...</span>
                  </div>
                ) : (
                  'PharmaCompass 업데이트'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* 부서별 현황 */}
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">영업부 현황</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">총 소싱 의뢰</span>
                <span className="font-semibold">0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">진행중</span>
                <span className="font-semibold">0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">완료</span>
                <span className="font-semibold">0</span>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">무역부 현황</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">총 처리 TASK</span>
                <span className="font-semibold">0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">진행중</span>
                <span className="font-semibold">0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">평균 처리 시간</span>
                <span className="font-semibold">-</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}