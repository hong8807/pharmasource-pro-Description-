'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import Link from 'next/link'
import { Trash2 } from 'lucide-react'

interface SourcingRequest {
  id: number
  product_name: string
  client_name: string
  status: string
  created_at: string
  usage_amount?: string
  existing_manufacturer?: string
  sourcing_tasks?: Array<{
    id: number
    status: string
  }>
}

export default function SourcingList() {
  const router = useRouter()
  const { userData, loading } = useAuth()
  const [requests, setRequests] = useState<SourcingRequest[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [deleting, setDeleting] = useState<number | null>(null)

  useEffect(() => {
    if (!loading && (!userData || userData.department !== 'sales')) {
      router.push('/login')
    }
  }, [userData, loading, router])

  useEffect(() => {
    if (userData && userData.department === 'sales') {
      fetchRequests()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData, currentPage])

  const fetchRequests = async () => {
    try {
      const response = await fetch(`/api/sourcing-requests?page=${currentPage}&limit=10`)
      if (response.ok) {
        const { data, totalPages } = await response.json()
        setRequests(data || [])
        setTotalPages(totalPages || 1)
      }
    } catch (error) {
      console.error('소싱 의뢰 목록 로드 실패:', error)
    } finally {
      setDataLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('정말로 이 소싱 의뢰를 삭제하시겠습니까?')) return

    setDeleting(id)
    try {
      const response = await fetch(`/api/sourcing-requests/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // 목록 새로고침
        fetchRequests()
      } else {
        const error = await response.json()
        alert(error.error || '삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('소싱 의뢰 삭제 실패:', error)
      alert('삭제에 실패했습니다.')
    } finally {
      setDeleting(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      pending: { label: '대기중', className: 'bg-gray-100 text-gray-800' },
      assigned: { label: '할당됨', className: 'bg-blue-100 text-blue-800' },
      in_progress: { label: '진행중', className: 'bg-yellow-100 text-yellow-800' },
      completed: { label: '완료', className: 'bg-green-100 text-green-800' },
      cancelled: { label: '취소', className: 'bg-red-100 text-red-800' }
    }
    
    const statusInfo = statusMap[status] || { label: status, className: 'bg-gray-100 text-gray-800' }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.className}`}>
        {statusInfo.label}
      </span>
    )
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

  if (!userData || userData.department !== 'sales') {
    return null
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold text-gray-900">내 소싱 의뢰</h1>
            <p className="mt-2 text-sm text-gray-700">
              등록한 소싱 의뢰 목록과 진행 상태를 확인할 수 있습니다.
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <Link
              href="/sourcing/new"
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-huxeed-green px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-huxeed-green focus:ring-offset-2 sm:w-auto"
            >
              새 소싱 의뢰
            </Link>
          </div>
        </div>

        <div className="mt-8 flex flex-col">
          <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        제품명
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        거래처
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        사용량
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        상태
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        요청일
                      </th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {requests.length > 0 ? (
                      requests.map((request) => (
                        <tr key={request.id}>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                            {request.product_name}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {request.client_name}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {request.usage_amount || '-'}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {getStatusBadge(request.sourcing_tasks?.[0]?.status || request.status)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {new Date(request.created_at).toLocaleDateString('ko-KR')}
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            <div className="flex items-center justify-end gap-3">
                              <Link
                                href={`/sourcing/${request.id}`}
                                className="text-huxeed-green hover:text-green-600"
                              >
                                상세보기
                              </Link>
                              {(request.sourcing_tasks?.[0]?.status === 'unassigned' || !request.sourcing_tasks?.[0]) && (
                                <button
                                  onClick={() => handleDelete(request.id)}
                                  disabled={deleting === request.id}
                                  className="text-red-600 hover:text-red-900 disabled:opacity-50"
                                  title="삭제"
                                >
                                  {deleting === request.id ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                                  ) : (
                                    <Trash2 className="w-4 h-4" />
                                  )}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-3 py-4 text-sm text-gray-500 text-center">
                          등록된 소싱 의뢰가 없습니다.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
            >
              이전
            </button>
            <span className="text-sm text-gray-700">
              {currentPage} / {totalPages} 페이지
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
            >
              다음
            </button>
          </div>
        )}
      </div>
    </div>
  )
}