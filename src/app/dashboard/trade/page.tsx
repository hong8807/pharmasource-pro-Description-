'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import Link from 'next/link'

interface Task {
  id: number
  status: string
  assigned_at?: string
  sourcing_request: {
    id: number
    product_name: string
    client_name: string
    usage_amount?: string
    requirements?: string
    created_at: string
    sales_user?: {
      name: string
      email: string
    }
  }
}

export default function TradeDashboard() {
  const router = useRouter()
  const { userData, loading } = useAuth()
  const [unassignedTasks, setUnassignedTasks] = useState<Task[]>([])
  const [myTasks, setMyTasks] = useState<Task[]>([])
  const [tasksLoading, setTasksLoading] = useState(true)

  console.log('TradeDashboard - userData:', userData, 'loading:', loading)

  useEffect(() => {
    if (!loading && (!userData || userData.department !== 'trade')) {
      console.log('Redirecting to login - userData:', userData)
      // 현재 경로가 이미 루트가 아닌 경우에만 리다이렉트
      if (window.location.pathname !== '/') {
        router.push('/')
      }
    }
  }, [userData, loading, router])

  useEffect(() => {
    if (userData?.department === 'trade') {
      fetchTasks()
    }
  }, [userData])

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/tasks')
      if (response.ok) {
        const data = await response.json()
        setUnassignedTasks(data.unassigned || [])
        setMyTasks(data.myTasks || [])
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error)
    } finally {
      setTasksLoading(false)
    }
  }

  const handleAssignTask = async (taskId: number) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/assign`, {
        method: 'POST'
      })
      
      if (response.ok) {
        // 성공 시 태스크 목록 새로고침
        await fetchTasks()
        // TASK 상세 페이지로 이동
        router.push(`/tasks/${taskId}`)
      } else {
        const error = await response.json()
        alert(error.error || 'TASK 할당에 실패했습니다.')
      }
    } catch (error) {
      console.error('Failed to assign task:', error)
      alert('TASK 할당 중 오류가 발생했습니다.')
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

  if (!userData || userData.department !== 'trade') {
    return null
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">무역부 대시보드</h1>
        
        <div className="mt-8">
          {/* 미할당 TASK */}
          <div className="mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              미할당 TASK ({unassignedTasks.length})
            </h2>
            {tasksLoading ? (
              <div className="bg-white shadow rounded-lg p-6">
                <p className="text-gray-500 text-sm">로딩 중...</p>
              </div>
            ) : unassignedTasks.length === 0 ? (
              <div className="bg-white shadow rounded-lg p-6">
                <p className="text-gray-500 text-sm">현재 할당 가능한 TASK가 없습니다.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {unassignedTasks.map((task) => (
                  <div key={task.id} className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {task.sourcing_request.product_name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-1">
                      거래처: {task.sourcing_request.client_name}
                    </p>
                    <p className="text-sm text-gray-600 mb-1">
                      사용량: {task.sourcing_request.usage_amount || '-'}
                    </p>
                    <p className="text-sm text-gray-600 mb-4">
                      요청자: {task.sourcing_request.sales_user?.name || '-'}
                    </p>
                    <button
                      onClick={() => handleAssignTask(task.id)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-huxeed-green hover:bg-green-600"
                    >
                      TASK 할당받기
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 내 진행중 TASK */}
          <div className="mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              내 진행중 TASK ({myTasks.length})
            </h2>
            {myTasks.length === 0 ? (
              <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <p className="text-gray-500 text-sm">진행중인 TASK가 없습니다.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {myTasks.map((task) => (
                  <div key={task.id} className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {task.sourcing_request.product_name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-1">
                      거래처: {task.sourcing_request.client_name}
                    </p>
                    <p className="text-sm text-gray-600 mb-1">
                      상태: {task.status === 'assigned' ? '할당됨' : task.status === 'in_progress' ? '진행중' : '완료'}
                    </p>
                    <p className="text-sm text-gray-600 mb-4">
                      할당일: {task.assigned_at ? new Date(task.assigned_at).toLocaleDateString('ko-KR') : '-'}
                    </p>
                    <Link 
                      href={`/tasks/${task.id}`}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-huxeed-green hover:bg-green-600"
                    >
                      상세보기
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 소싱 통계 */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-sm font-medium text-gray-500">진행중 TASK</h3>
              <p className="mt-2 text-3xl font-semibold text-gray-900">
                {myTasks.filter(t => t.status !== 'completed').length}
              </p>
            </div>
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-sm font-medium text-gray-500">완료된 TASK</h3>
              <p className="mt-2 text-3xl font-semibold text-gray-900">
                {myTasks.filter(t => t.status === 'completed').length}
              </p>
            </div>
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-sm font-medium text-gray-500">미할당 TASK</h3>
              <p className="mt-2 text-3xl font-semibold text-gray-900">{unassignedTasks.length}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}