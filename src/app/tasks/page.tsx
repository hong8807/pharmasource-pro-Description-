'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { Clock, User, CheckCircle, AlertCircle } from 'lucide-react'

interface Task {
  id: number
  status: string
  assigned_at: string | null
  completed_at?: string | null
  sourcing_request: {
    id: number
    product_name: string
    client_name: string
    usage_amount: string | null
    requirements: string | null
    created_at: string
    sales_user: {
      name: string
      email: string
    }
  }
}

export default function TasksPage() {
  const router = useRouter()
  const { userData, loading } = useAuth()
  const [unassignedTasks, setUnassignedTasks] = useState<Task[]>([])
  const [myTasks, setMyTasks] = useState<Task[]>([])
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    if (!loading && (!userData || (userData.department !== 'trade' && userData.department !== 'admin'))) {
      router.push('/')
    }
  }, [userData, loading, router])

  useEffect(() => {
    if (userData && (userData.department === 'trade' || userData.department === 'admin')) {
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
      console.error('TASK 목록 로드 실패:', error)
    } finally {
      setDataLoading(false)
    }
  }

  const assignTask = async (taskId: number) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/assign`, {
        method: 'POST'
      })
      if (response.ok) {
        fetchTasks()
      }
    } catch (error) {
      console.error('TASK 할당 실패:', error)
    }
  }

  if (loading || dataLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-huxeed-green mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!userData || (userData.department !== 'trade' && userData.department !== 'admin')) {
    return null
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">TASK 관리</h1>
        
        {/* 미할당 TASK */}
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <AlertCircle className="w-5 h-5 mr-2 text-orange-500" />
            미할당 TASK ({unassignedTasks.length})
          </h2>
          
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {unassignedTasks.length > 0 ? (
              unassignedTasks.map((task) => (
                <div key={task.id} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {task.sourcing_request.product_name}
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center text-gray-600">
                        <User className="w-4 h-4 mr-2" />
                        <span>{task.sourcing_request.client_name}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Clock className="w-4 h-4 mr-2" />
                        <span>{new Date(task.sourcing_request.created_at).toLocaleDateString('ko-KR')}</span>
                      </div>
                      {task.sourcing_request.usage_amount && (
                        <div className="text-gray-600">
                          <span className="font-medium">사용량:</span> {task.sourcing_request.usage_amount}
                        </div>
                      )}
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-xs text-gray-500 mb-3">
                        요청자: {task.sourcing_request.sales_user.name}
                      </p>
                      <button
                        onClick={() => assignTask(task.id)}
                        className="w-full bg-gradient-to-r from-huxeed-green to-green-600 text-white px-4 py-2 rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 font-medium text-sm"
                      >
                        TASK 할당받기
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full bg-gray-50 rounded-lg p-8 text-center">
                <p className="text-gray-500">현재 미할당 TASK가 없습니다.</p>
              </div>
            )}
          </div>
        </div>

        {/* 내 TASK */}
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <CheckCircle className="w-5 h-5 mr-2 text-blue-500" />
            내 진행중 TASK ({myTasks.filter(t => t.status !== 'completed').length})
          </h2>
          
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {myTasks.filter(t => t.status !== 'completed').length > 0 ? (
              myTasks.filter(t => t.status !== 'completed').map((task) => (
                <div key={task.id} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {task.sourcing_request.product_name}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        task.status === 'assigned' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {task.status === 'assigned' ? '할당됨' : '진행중'}
                      </span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center text-gray-600">
                        <User className="w-4 h-4 mr-2" />
                        <span>{task.sourcing_request.client_name}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Clock className="w-4 h-4 mr-2" />
                        <span>할당일: {new Date(task.assigned_at!).toLocaleDateString('ko-KR')}</span>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => {
                          console.log('Navigating to task:', task.id)
                          router.push(`/tasks/${task.id}`)
                        }}
                        className="w-full bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors font-medium text-sm"
                      >
                        상세 보기
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full bg-gray-50 rounded-lg p-8 text-center">
                <p className="text-gray-500">진행중인 TASK가 없습니다.</p>
              </div>
            )}
          </div>
        </div>

        {/* 완료된 TASK */}
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
            완료된 TASK ({myTasks.filter(t => t.status === 'completed').length})
          </h2>
          
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {myTasks.filter(t => t.status === 'completed').length > 0 ? (
              myTasks.filter(t => t.status === 'completed').map((task) => (
                <div key={task.id} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow opacity-75">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {task.sourcing_request.product_name}
                      </h3>
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        완료
                      </span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center text-gray-600">
                        <User className="w-4 h-4 mr-2" />
                        <span>{task.sourcing_request.client_name}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        <span>완료일: {task.completed_at ? new Date(task.completed_at).toLocaleDateString('ko-KR') : '-'}</span>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => router.push(`/tasks/${task.id}`)}
                        className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors font-medium text-sm"
                      >
                        상세 보기
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full bg-gray-50 rounded-lg p-8 text-center">
                <p className="text-gray-500">완료된 TASK가 없습니다.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}