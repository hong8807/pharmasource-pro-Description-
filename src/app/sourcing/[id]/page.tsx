'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { 
  ArrowLeft, 
  Calendar, 
  Building2, 
  Package, 
  FileText, 
  User, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Loader2,
  DollarSign,
  Award,
  Send,
  Check,
  X,
  MessageSquare,
  Edit,
  Trash2,
  Paperclip,
  Download,
  Plus,
  Upload
} from 'lucide-react'

interface SourcingDetail {
  id: number
  product_name: string
  client_name: string
  usage_amount?: string
  existing_manufacturer?: string
  requirements?: string
  status: string
  created_at: string
  sales_user?: {
    id: string
    name: string
    email: string
    department: string
  }
  sourcing_tasks?: Array<{
    id: number
    status: string
    assigned_at?: string
    completed_at?: string
    quote_status?: string | null
    quote_sent_at?: string | null
    quote_response_at?: string | null
    quote_notes?: string | null
    trade_user?: {
      id: string
      name: string
      email: string
      department: string
    }
  }>
  progress?: Array<{
    id: number
    description: string
    created_at: string
    manufacturer_name?: string | null
    supplier_name?: string | null
    quote_price?: number | null
    quote_currency?: string | null
    quote_lead_time?: string | null
    has_gmp?: boolean
    has_dmf?: boolean
    has_cep?: boolean
    has_iso?: boolean
    certificate_notes?: string | null
    user: {
      name: string
    }
  }>
  files?: Array<{
    id: string
    entity_type: string
    entity_id: number
    file_name: string
    file_size: number
    file_type: string
    storage_path: string
    created_at: string
  }>
  client_quote_status?: {
    id: number
    quote_sent: boolean
    quote_sent_at?: string
    client_response?: string
    response_date?: string
    response_notes?: string
    expected_outcome?: string
  }
}

export default function SourcingDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { userData, loading } = useAuth()
  const [sourcing, setSourcing] = useState<SourcingDetail | null>(null)
  const [dataLoading, setDataLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [newProgress, setNewProgress] = useState('')
  const [showingProgressInput, setShowingProgressInput] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editForm, setEditForm] = useState({
    product_name: '',
    client_name: '',
    usage_amount: '',
    existing_manufacturer: '',
    requirements: ''
  })
  const [showQuoteStatus, setShowQuoteStatus] = useState(false)
  const [quoteStatus, setQuoteStatus] = useState({
    quote_sent: false,
    client_response: '',
    response_notes: '',
    expected_outcome: ''
  })

  useEffect(() => {
    console.log('Auth 상태:', { loading, userData, department: userData?.department })
    if (!loading && (!userData || userData.department !== 'sales')) {
      console.log('영업부가 아님, 홈으로 리다이렉트')
      router.push('/')
    }
  }, [userData, loading, router])

  useEffect(() => {
    if (userData && userData.department === 'sales' && params.id) {
      fetchSourcingDetail()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData, params.id])
  
  useEffect(() => {
    if (sourcing?.client_quote_status) {
      setQuoteStatus({
        quote_sent: sourcing.client_quote_status.quote_sent || false,
        client_response: sourcing.client_quote_status.client_response || '',
        response_notes: sourcing.client_quote_status.response_notes || '',
        expected_outcome: sourcing.client_quote_status.expected_outcome || ''
      })
    }
  }, [sourcing])

  const fetchSourcingDetail = async () => {
    try {
      console.log('소싱 상세 정보 요청 시작:', params.id)
      const response = await fetch(`/api/sourcing-requests/${params.id}`)
      console.log('API 응답 상태:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('받은 데이터:', data)
        console.log('받은 파일 데이터:', data.files)
        setSourcing(data)
        setEditForm({
          product_name: data.product_name || '',
          client_name: data.client_name || '',
          usage_amount: data.usage_amount || '',
          existing_manufacturer: data.existing_manufacturer || '',
          requirements: data.requirements || ''
        })
      } else if (response.status === 404) {
        console.log('소싱 의뢰를 찾을 수 없음')
        router.push('/sourcing')
      } else {
        const error = await response.json()
        console.error('API 에러:', error)
      }
    } catch (error) {
      console.error('소싱 의뢰 상세 정보 로드 실패:', error)
    } finally {
      setDataLoading(false)
    }
  }

  const addProgress = async () => {
    if (!newProgress.trim()) return
    
    // sourcing_tasks 배열에서 task 정보 가져오기
    const task = sourcing?.sourcing_tasks?.[0]
    if (!task) {
      alert('TASK가 아직 생성되지 않았습니다.')
      return
    }

    setSubmitting(true)
    try {
      console.log('진행 내역 추가 요청:', {
        taskId: task.id,
        description: newProgress
      })
      
      const response = await fetch(`/api/tasks/${task.id}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          description: newProgress
        })
      })

      const responseData = await response.json()
      console.log('API 응답:', response.status, responseData)

      if (response.ok) {
        setNewProgress('')
        setShowingProgressInput(false)
        fetchSourcingDetail()
      } else {
        console.error('진행 내역 추가 실패:', responseData)
        alert(`진행 내역 추가 실패: ${responseData.error || '알 수 없는 오류'}`)
      }
    } catch (error) {
      console.error('진행 내역 추가 실패:', error)
      alert('진행 내역 추가 중 오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdate = async () => {
    setSubmitting(true)
    try {
      const response = await fetch(`/api/sourcing-requests/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      })

      if (response.ok) {
        setEditMode(false)
        fetchSourcingDetail()
      }
    } catch (error) {
      console.error('소싱 의뢰 수정 실패:', error)
      alert('수정에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('정말로 이 소싱 의뢰를 삭제하시겠습니까?')) return

    setSubmitting(true)
    try {
      const response = await fetch(`/api/sourcing-requests/${params.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        router.push('/sourcing')
      } else {
        const error = await response.json()
        alert(error.error || '삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('소싱 의뢰 삭제 실패:', error)
      alert('삭제에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }
  
  const updateQuoteStatus = async () => {
    setSubmitting(true)
    try {
      const response = await fetch('/api/client-quote-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sourcing_request_id: sourcing?.id,
          quote_sent: quoteStatus.quote_sent,
          quote_sent_at: quoteStatus.quote_sent ? new Date().toISOString() : null,
          client_response: quoteStatus.client_response || null,
          response_date: quoteStatus.client_response ? new Date().toISOString() : null,
          response_notes: quoteStatus.response_notes || null,
          expected_outcome: quoteStatus.expected_outcome || null
        })
      })

      if (response.ok) {
        setShowQuoteStatus(false)
        fetchSourcingDetail()
        alert('거래처 견적 상태가 업데이트되었습니다.')
      } else {
        const error = await response.json()
        alert(`업데이트 실패: ${error.error || '알 수 없는 오류'}`)
      }
    } catch (error) {
      console.error('거래처 견적 상태 업데이트 실패:', error)
      alert('업데이트 중 오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading || dataLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
          <p className="mt-2 text-xs text-gray-500">
            Auth: {loading ? '확인중' : '완료'} | Data: {dataLoading ? '로딩중' : '완료'}
          </p>
        </div>
      </div>
    )
  }

  if (!userData || userData.department !== 'sales' || !sourcing) {
    return null
  }

  const task = sourcing.sourcing_tasks?.[0]
  const taskStatus = task?.status || sourcing.status
  
  console.log('소싱 의뢰 상태 디버깅:', {
    sourcingStatus: sourcing.status,
    taskStatus: task?.status,
    finalTaskStatus: taskStatus,
    isEditAllowed: taskStatus === 'pending' || taskStatus === 'unassigned'
  })

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { bg: 'bg-gray-100', text: 'text-gray-800', label: '대기중', icon: Clock },
      unassigned: { bg: 'bg-gray-100', text: 'text-gray-800', label: '미할당', icon: AlertCircle },
      assigned: { bg: 'bg-blue-100', text: 'text-blue-800', label: '할당됨', icon: User },
      in_progress: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: '진행중', icon: Loader2 },
      completed: { bg: 'bg-green-100', text: 'text-green-800', label: '완료', icon: CheckCircle }
    }
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    const Icon = config.icon
    
    return (
      <span className={`inline-flex items-center gap-2 px-3 py-1 text-sm font-medium rounded-full ${config.bg} ${config.text}`}>
        <Icon className="w-4 h-4" />
        {config.label}
      </span>
    )
  }

  return (
    <div className="py-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => router.push('/sourcing')}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            소싱 의뢰 목록으로
          </button>
          {getStatusBadge(taskStatus)}
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* 소싱 의뢰 정보 */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-gray-900">
                {editMode ? (
                  <input
                    type="text"
                    value={editForm.product_name}
                    onChange={(e) => setEditForm({...editForm, product_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                ) : (
                  sourcing.product_name
                )}
              </h1>
              {(taskStatus !== 'completed' && taskStatus !== 'cancelled') && (
                <div className="flex gap-2">
                  {!editMode ? (
                    <>
                      <button
                        onClick={() => {
                          setEditMode(true)
                          setEditForm({
                            product_name: sourcing.product_name || '',
                            client_name: sourcing.client_name || '',
                            usage_amount: sourcing.usage_amount || '',
                            existing_manufacturer: sourcing.existing_manufacturer || '',
                            requirements: sourcing.requirements || ''
                          })
                        }}
                        className="px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        <Edit className="w-4 h-4" />
                        수정
                      </button>
                      {taskStatus === 'unassigned' && (
                        <button
                          onClick={handleDelete}
                          disabled={submitting}
                          className="px-3 py-1 text-sm font-medium text-red-600 hover:text-red-800 flex items-center gap-1 disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                          삭제
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      <button
                        onClick={handleUpdate}
                        disabled={submitting}
                        className="px-3 py-1 text-sm font-medium text-green-600 hover:text-green-800 disabled:opacity-50"
                      >
                        저장
                      </button>
                      <button
                        onClick={() => {
                          setEditMode(false)
                          setEditForm({
                            product_name: sourcing.product_name || '',
                            client_name: sourcing.client_name || '',
                            usage_amount: sourcing.usage_amount || '',
                            existing_manufacturer: sourcing.existing_manufacturer || '',
                            requirements: sourcing.requirements || ''
                          })
                        }}
                        className="px-3 py-1 text-sm font-medium text-gray-600 hover:text-gray-800"
                      >
                        취소
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-start">
                  <Building2 className="w-5 h-5 mr-3 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">거래처</p>
                    {editMode ? (
                      <input
                        type="text"
                        value={editForm.client_name}
                        onChange={(e) => setEditForm({...editForm, client_name: e.target.value})}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-base text-gray-900">{sourcing.client_name}</p>
                    )}
                  </div>
                </div>
                
                {sourcing.usage_amount && (
                  <div className="flex items-start">
                    <Package className="w-5 h-5 mr-3 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">사용량</p>
                      {editMode ? (
                        <input
                          type="text"
                          value={editForm.usage_amount}
                          onChange={(e) => setEditForm({...editForm, usage_amount: e.target.value})}
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      ) : (
                        <p className="text-base text-gray-900">{sourcing.usage_amount}</p>
                      )}
                    </div>
                  </div>
                )}
                
                {sourcing.existing_manufacturer && (
                  <div className="flex items-start">
                    <Building2 className="w-5 h-5 mr-3 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">기존 제조원</p>
                      {editMode ? (
                        <input
                          type="text"
                          value={editForm.existing_manufacturer}
                          onChange={(e) => setEditForm({...editForm, existing_manufacturer: e.target.value})}
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      ) : (
                        <p className="text-base text-gray-900">{sourcing.existing_manufacturer}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="space-y-3">
                <div className="flex items-start">
                  <User className="w-5 h-5 mr-3 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">요청자</p>
                    <p className="text-base text-gray-900">{sourcing.sales_user?.name || '알 수 없음'}</p>
                    <p className="text-sm text-gray-600">{sourcing.sales_user?.email}</p>
                    <p className="text-xs text-gray-500">영업부</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Calendar className="w-5 h-5 mr-3 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">요청일</p>
                    <p className="text-base text-gray-900">
                      {new Date(sourcing.created_at).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                </div>
                
                {task?.trade_user && (
                  <div className="flex items-start">
                    <User className="w-5 h-5 mr-3 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">소싱 담당자</p>
                      <p className="text-base text-gray-900">{task.trade_user.name}</p>
                      <p className="text-sm text-gray-600">{task.trade_user.email}</p>
                      <p className="text-xs text-gray-500">무역부</p>
                    </div>
                  </div>
                )}
                
                {task?.completed_at && (
                  <div className="flex items-start">
                    <CheckCircle className="w-5 h-5 mr-3 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">완료일</p>
                      <p className="text-base text-gray-900">
                        {new Date(task.completed_at).toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {sourcing.requirements && (
              <div className="mt-4">
                <div className="flex items-start">
                  <FileText className="w-5 h-5 mr-3 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500 mb-1">필요사항</p>
                    {editMode ? (
                      <textarea
                        value={editForm.requirements}
                        onChange={(e) => setEditForm({...editForm, requirements: e.target.value})}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        rows={3}
                      />
                    ) : (
                      <p className="text-base text-gray-900 whitespace-pre-wrap">{sourcing.requirements}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* 소싱 의뢰 첨부파일 표시 */}
            {(() => {
              console.log('전체 파일 목록:', sourcing.files)
              console.log('sourcing.id 타입:', typeof sourcing.id, 'sourcing.id 값:', sourcing.id)
              const requestFiles = sourcing.files?.filter(file => {
                console.log('file.entity_id 타입:', typeof file.entity_id, 'file.entity_id 값:', file.entity_id)
                console.log('비교 결과:', file.entity_type === 'sourcing_request' && Number(file.entity_id) === Number(sourcing.id))
                return file.entity_type === 'sourcing_request' && Number(file.entity_id) === Number(sourcing.id)
              })
              console.log('필터링된 소싱 의뢰 파일:', requestFiles)
              if (requestFiles && requestFiles.length > 0 || editMode) {
                return (
                  <div className="mt-4">
                    <div className="flex items-start">
                      <Paperclip className="w-5 h-5 mr-3 text-gray-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-500 mb-2">첨부파일</p>
                        {requestFiles && requestFiles.length > 0 && (
                          <div className="space-y-1 mb-3">
                            {requestFiles.map((file) => (
                              <div key={file.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                <a
                                  href={`/api/files/download/${file.id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 text-sm text-blue-700 hover:text-blue-900"
                                >
                                  <Download className="w-3 h-3" />
                                  <span className="truncate">{file.file_name}</span>
                                  <span className="text-xs text-gray-500">({(file.file_size / 1024).toFixed(1)} KB)</span>
                                </a>
                                {editMode && (
                                  <button
                                    onClick={async () => {
                                      if (confirm('이 파일을 삭제하시겠습니까?')) {
                                        try {
                                          const response = await fetch(`/api/files/${file.id}`, {
                                            method: 'DELETE'
                                          })
                                          if (response.ok) {
                                            fetchSourcingDetail()
                                          }
                                        } catch (error) {
                                          console.error('파일 삭제 실패:', error)
                                        }
                                      }
                                    }}
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        {editMode && (
                          <div>
                            <label className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 cursor-pointer transition-colors">
                              <Plus className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-600">파일 추가</span>
                              <input
                                type="file"
                                multiple
                                onChange={async (e) => {
                                  if (!e.target.files) return
                                  const files = Array.from(e.target.files)
                                  for (const file of files) {
                                    const formData = new FormData()
                                    formData.append('file', file)
                                    formData.append('entity_type', 'sourcing_request')
                                    formData.append('entity_id', sourcing.id.toString())
                                    
                                    try {
                                      const response = await fetch('/api/files/upload', {
                                        method: 'POST',
                                        body: formData
                                      })
                                      if (response.ok) {
                                        fetchSourcingDetail()
                                      }
                                    } catch (error) {
                                      console.error('파일 업로드 실패:', error)
                                    }
                                  }
                                }}
                                className="hidden"
                                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                              />
                            </label>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              }
              return null
            })()}
          </div>

          {/* 진행 내역 */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                <MessageSquare className="w-5 h-5 mr-2" />
                진행 내역
              </h2>
              {sourcing.sourcing_tasks?.[0] && (taskStatus === 'in_progress' || taskStatus === 'assigned') && (
                <button
                  onClick={() => setShowingProgressInput(!showingProgressInput)}
                  className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                >
                  {showingProgressInput ? '취소' : '+ 내역 추가'}
                </button>
              )}
            </div>
            
            {/* 진행 내역 입력 */}
            {showingProgressInput && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newProgress}
                    onChange={(e) => setNewProgress(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && addProgress()}
                    placeholder="진행 내역을 입력하세요..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    disabled={submitting}
                  />
                  <button
                    onClick={addProgress}
                    disabled={submitting || !newProgress.trim()}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
            
            <div className="space-y-4">
              {sourcing.progress && sourcing.progress.length > 0 ? (
                sourcing.progress.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">{item.user.name}</span>
                        <span className="text-sm text-gray-500">
                          {new Date(item.created_at).toLocaleString('ko-KR')}
                        </span>
                      </div>
                      <p className="text-gray-700">{item.description}</p>
                      
                      {/* 견적 정보 표시 */}
                      {item.manufacturer_name && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg space-y-2">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-medium">제조사: {item.manufacturer_name}</span>
                          </div>
                          {item.supplier_name && item.supplier_name !== item.manufacturer_name && (
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-gray-500" />
                              <span className="text-sm">공급사: {item.supplier_name}</span>
                            </div>
                          )}
                          {item.quote_price && (
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-4 h-4 text-gray-500" />
                              <span className="text-sm">견적가: {item.quote_currency} {item.quote_price.toLocaleString()}</span>
                            </div>
                          )}
                          {item.quote_lead_time && (
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-gray-500" />
                              <span className="text-sm">리드타임: {item.quote_lead_time}</span>
                            </div>
                          )}
                          <div className="flex flex-wrap gap-2 mt-2">
                            {item.has_gmp && <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">GMP</span>}
                            {item.has_dmf && <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">DMF</span>}
                            {item.has_cep && <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">CEP</span>}
                            {item.has_iso && <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">ISO</span>}
                          </div>
                          {item.certificate_notes && (
                            <p className="text-sm text-gray-600 mt-2">{item.certificate_notes}</p>
                          )}
                        </div>
                      )}
                      
                      {/* 첨부 파일 표시 */}
                      {(() => {
                        const attachedFiles = sourcing.files?.filter(file => 
                          file.entity_type === 'sourcing_progress' && Number(file.entity_id) === Number(item.id)
                        )
                        if (attachedFiles && attachedFiles.length > 0) {
                          return (
                            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <Paperclip className="w-4 h-4 text-blue-600" />
                                <span className="text-sm font-medium text-blue-900">첨부파일</span>
                              </div>
                              <div className="space-y-1">
                                {attachedFiles.map((file) => (
                                  <a
                                    key={file.id}
                                    href={`/api/files/download/${file.id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-sm text-blue-700 hover:text-blue-900 hover:bg-blue-100 px-2 py-1 rounded transition-colors"
                                  >
                                    <Download className="w-3 h-3" />
                                    <span className="truncate">{file.file_name}</span>
                                    <span className="text-xs text-gray-500">({(file.file_size / 1024).toFixed(1)} KB)</span>
                                  </a>
                                ))}
                              </div>
                            </div>
                          )
                        }
                        return null
                      })()}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-4">아직 진행 내역이 없습니다.</p>
              )}
            </div>
          </div>

          {/* 소싱 완료 요약 */}
          {taskStatus === 'completed' && task && (
            <div className="p-6 bg-green-50">
              <h3 className="text-lg font-medium text-green-900 mb-3">소싱 완료</h3>
              <div className="text-sm text-green-800 space-y-1">
                <p>• 요청자: {sourcing.sales_user?.name} (영업부)</p>
                <p>• 담당자: {task.trade_user?.name} (무역부)</p>
                <p>• 소요 기간: {
                  task.completed_at && sourcing.created_at
                    ? Math.ceil((new Date(task.completed_at).getTime() - new Date(sourcing.created_at).getTime()) / (1000 * 60 * 60 * 24))
                    : 0
                }일</p>
              </div>
              
              {/* 최종 견적 정보 표시 */}
              {sourcing.progress && sourcing.progress.length > 0 && (() => {
                const lastQuote = [...sourcing.progress].reverse().find(p => p.manufacturer_name)
                if (lastQuote) {
                  return (
                    <div className="mt-4 pt-4 border-t border-green-200">
                      <h4 className="font-medium text-green-900 mb-2">최종 견적 정보</h4>
                      <div className="bg-white p-3 rounded-lg space-y-2">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-gray-500" />
                          <span className="text-sm">제조사: <strong>{lastQuote.manufacturer_name}</strong></span>
                        </div>
                        {lastQuote.quote_price && (
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-gray-500" />
                            <span className="text-sm">견적가: <strong>{lastQuote.quote_currency} {lastQuote.quote_price.toLocaleString()}</strong></span>
                          </div>
                        )}
                        {lastQuote.quote_lead_time && (
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <span className="text-sm">리드타임: <strong>{lastQuote.quote_lead_time}</strong></span>
                          </div>
                        )}
                        <div className="flex flex-wrap gap-2 mt-2">
                          {lastQuote.has_gmp && <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">GMP</span>}
                          {lastQuote.has_dmf && <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">DMF</span>}
                          {lastQuote.has_cep && <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">CEP</span>}
                          {lastQuote.has_iso && <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">ISO</span>}
                        </div>
                      </div>
                    </div>
                  )
                }
                return null
              })()}
              
            </div>
          )}
          
          {/* 거래처 견적 진행 상황 */}
          {taskStatus === 'completed' && (
            <div className="p-6 bg-blue-50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-blue-900">거래처 견적 진행 상황</h3>
                <button
                  onClick={() => setShowQuoteStatus(!showQuoteStatus)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  {showQuoteStatus ? '취소' : '상태 업데이트'}
                </button>
              </div>
              
              {/* 현재 상태 표시 */}
              {sourcing.client_quote_status && !showQuoteStatus && (
                <div className="bg-white p-4 rounded-lg space-y-3">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-gray-700">견적 발송:</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      sourcing.client_quote_status.quote_sent 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {sourcing.client_quote_status.quote_sent ? '발송함' : '미발송'}
                    </span>
                    {sourcing.client_quote_status.quote_sent_at && (
                      <span className="text-sm text-gray-500">
                        ({new Date(sourcing.client_quote_status.quote_sent_at).toLocaleDateString('ko-KR')})
                      </span>
                    )}
                  </div>
                  
                  {sourcing.client_quote_status.client_response && (
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium text-gray-700">거래처 반응:</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        sourcing.client_quote_status.client_response === 'positive'
                          ? 'bg-green-100 text-green-800'
                          : sourcing.client_quote_status.client_response === 'negative'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {sourcing.client_quote_status.client_response === 'positive' ? '긍정적' :
                         sourcing.client_quote_status.client_response === 'negative' ? '부정적' : '보류'}
                      </span>
                    </div>
                  )}
                  
                  {sourcing.client_quote_status.expected_outcome && (
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium text-gray-700">예상 진행:</span>
                      <span className="text-sm text-gray-900">
                        {sourcing.client_quote_status.expected_outcome === 'business_discussion' ? '비즈니스 구체적 논의' :
                         sourcing.client_quote_status.expected_outcome === 'request_alternative' ? '다른 제조원 소싱 요청' :
                         sourcing.client_quote_status.expected_outcome === 'no_interest' ? '관심 없음' : '보류'}
                      </span>
                    </div>
                  )}
                  
                  {sourcing.client_quote_status.response_notes && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">상세 내용:</p>
                      <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded">{sourcing.client_quote_status.response_notes}</p>
                    </div>
                  )}
                </div>
              )}
              
              {/* 상태 업데이트 폼 */}
              {showQuoteStatus && (
                <div className="bg-white p-4 rounded-lg space-y-4">
                  <div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={quoteStatus.quote_sent}
                        onChange={(e) => setQuoteStatus({...quoteStatus, quote_sent: e.target.checked})}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">거래처에 견적 발송 완료</span>
                    </label>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">거래처 반응</label>
                    <select
                      value={quoteStatus.client_response}
                      onChange={(e) => setQuoteStatus({...quoteStatus, client_response: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">선택해주세요</option>
                      <option value="positive">긍정적</option>
                      <option value="negative">부정적</option>
                      <option value="pending">보류</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">예상 진행 상황</label>
                    <select
                      value={quoteStatus.expected_outcome}
                      onChange={(e) => setQuoteStatus({...quoteStatus, expected_outcome: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">선택해주세요</option>
                      <option value="business_discussion">비즈니스 구체적 논의</option>
                      <option value="request_alternative">다른 제조원 소싱 요청</option>
                      <option value="no_interest">관심 없음</option>
                      <option value="pending">보류</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">상세 내용</label>
                    <textarea
                      value={quoteStatus.response_notes}
                      onChange={(e) => setQuoteStatus({...quoteStatus, response_notes: e.target.value})}
                      placeholder="거래처 반응이나 추가 정보를 입력하세요..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={updateQuoteStatus}
                      disabled={submitting}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      {submitting ? '저장 중...' : '저장'}
                    </button>
                    <button
                      onClick={() => {
                        setShowQuoteStatus(false)
                        // Reset to original values
                        if (sourcing?.client_quote_status) {
                          setQuoteStatus({
                            quote_sent: sourcing.client_quote_status.quote_sent || false,
                            client_response: sourcing.client_quote_status.client_response || '',
                            response_notes: sourcing.client_quote_status.response_notes || '',
                            expected_outcome: sourcing.client_quote_status.expected_outcome || ''
                          })
                        }
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      취소
                    </button>
                  </div>
                </div>
              )}
              
              {/* 초기 상태 */}
              {!sourcing.client_quote_status && !showQuoteStatus && (
                <p className="text-sm text-blue-800">아직 거래처 견적 진행 상황이 등록되지 않았습니다.</p>
              )}
            </div>
          )}

          {/* 소싱이 아직 진행중이거나 미할당인 경우 */}
          {taskStatus !== 'completed' && (
            <div className="p-6 bg-gray-50 text-center">
              <p className="text-gray-600">
                {taskStatus === 'unassigned' ? '무역부 담당자 할당 대기중입니다.' :
                 taskStatus === 'assigned' ? '무역부 담당자가 할당되었습니다.' :
                 taskStatus === 'in_progress' ? '소싱이 진행중입니다.' :
                 '소싱 의뢰가 대기중입니다.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}