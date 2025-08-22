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
  MessageSquare,
  Paperclip,
  Plus,
  Send,
  DollarSign,
  Award,
  Upload,
  FileCheck,
  X,
  Mail,
  Edit2,
  Trash2,
  Download
} from 'lucide-react'

interface TaskDetail {
  id: number
  status: string
  assigned_at: string | null
  trade_user_id?: string | null
  quote_status?: string | null
  quote_sent_at?: string | null
  quote_response_at?: string | null
  quote_notes?: string | null
  sourcing_request: {
    id: number
    product_name: string
    client_name: string
    usage_amount: string | null
    existing_supplier: string | null
    requirements: string | null
    created_at: string
    sales_user: {
      name: string
      email: string
    }
  }
  progress: Array<{
    id: number
    description: string
    created_at: string
    manufacturer_name?: string | null
    supplier_name?: string | null
    quote_price?: number | null
    quote_currency?: string | null
    quote_lead_time?: string | null
    supplier_id?: number | null
    has_gmp?: boolean
    has_dmf?: boolean
    has_cep?: boolean
    has_iso?: boolean
    certificate_notes?: string | null
    user: {
      name: string
    }
    user_id?: string
  }>
  files?: Array<{
    id: string
    file_name: string
    file_size: number
    file_type: string
    created_at: string
    entity_type?: string
    entity_id?: number
  }>
}

interface QuoteFormData {
  manufacturer_name: string
  supplier_name: string
  quote_price: string
  quote_currency: string
  quote_lead_time: string
  has_gmp: boolean
  has_dmf: boolean
  has_cep: boolean
  has_iso: boolean
  certificate_notes: string
  description: string
}

export default function TaskDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { userData, loading } = useAuth()
  const [task, setTask] = useState<TaskDetail | null>(null)
  const [dataLoading, setDataLoading] = useState(true)
  const [newProgress, setNewProgress] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showQuoteForm, setShowQuoteForm] = useState(false)
  const [quoteForm, setQuoteForm] = useState<QuoteFormData>({
    manufacturer_name: '',
    supplier_name: '',
    quote_price: '',
    quote_currency: 'USD',
    quote_lead_time: '',
    has_gmp: false,
    has_dmf: false,
    has_cep: false,
    has_iso: false,
    certificate_notes: '',
    description: ''
  })
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploadingFiles, setUploadingFiles] = useState(false)
  const [editingProgressId, setEditingProgressId] = useState<number | null>(null)
  const [editingProgressText, setEditingProgressText] = useState('')
  const [editingQuoteInfo, setEditingQuoteInfo] = useState(false)

  useEffect(() => {
    if (!loading && (!userData || (userData.department !== 'trade' && userData.department !== 'admin'))) {
      router.push('/')
    }
  }, [userData, loading, router])

  useEffect(() => {
    if (userData && (userData.department === 'trade' || userData.department === 'admin') && params.id) {
      fetchTaskDetail()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData, params.id])

  const fetchTaskDetail = async () => {
    try {
      console.log('Fetching task detail for ID:', params.id)
      const response = await fetch(`/api/tasks/${params.id}`)
      console.log('Task detail response:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Task data received:', data)
        setTask(data)
      } else if (response.status === 404) {
        console.log('Task not found, redirecting to tasks list')
        router.push('/tasks')
      } else if (response.status === 403) {
        const error = await response.json()
        console.error('Access denied:', error)
        alert('이 TASK에 접근할 권한이 없습니다.')
        router.push('/tasks')
      } else {
        const error = await response.json()
        console.error('Failed to fetch task:', error)
      }
    } catch (error) {
      console.error('TASK 상세 정보 로드 실패:', error)
    } finally {
      setDataLoading(false)
    }
  }

  const addProgress = async () => {
    if (!newProgress.trim()) return

    setSubmitting(true)
    try {
      const response = await fetch(`/api/tasks/${params.id}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ description: newProgress })
      })

      if (response.ok) {
        const result = await response.json()
        
        // 파일 업로드
        if (selectedFiles.length > 0) {
          setUploadingFiles(true)
          for (const file of selectedFiles) {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('entity_type', 'sourcing_progress')
            formData.append('entity_id', result.id.toString())

            const uploadResponse = await fetch('/api/files/upload', {
              method: 'POST',
              body: formData
            })
            
            if (!uploadResponse.ok) {
              const error = await uploadResponse.json()
              console.error('File upload error:', error)
            }
          }
          setUploadingFiles(false)
        }
        
        setNewProgress('')
        setSelectedFiles([])
        fetchTaskDetail()
      }
    } catch (error) {
      console.error('진행 내역 추가 실패:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const submitQuote = async () => {
    if (!quoteForm.manufacturer_name || !quoteForm.quote_price || !quoteForm.description) {
      alert('제조사명, 견적가, 진행 내용은 필수 입력 항목입니다.')
      return
    }

    setSubmitting(true)
    try {
      // 먼저 진행 내역 추가
      const progressData: any = {
        description: quoteForm.description,
        manufacturer_name: quoteForm.manufacturer_name,
        supplier_name: quoteForm.supplier_name || quoteForm.manufacturer_name,
        quote_currency: quoteForm.quote_currency,
        quote_lead_time: quoteForm.quote_lead_time,
        has_gmp: quoteForm.has_gmp,
        has_dmf: quoteForm.has_dmf,
        has_cep: quoteForm.has_cep,
        has_iso: quoteForm.has_iso,
        certificate_notes: quoteForm.certificate_notes
      }
      
      // Only include quote_price if it's a valid number
      if (quoteForm.quote_price && !isNaN(parseFloat(quoteForm.quote_price))) {
        progressData.quote_price = quoteForm.quote_price
      }

      const response = await fetch(`/api/tasks/${params.id}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(progressData)
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Progress created:', result)
        
        // 파일 업로드
        if (selectedFiles.length > 0) {
          setUploadingFiles(true)
          for (const file of selectedFiles) {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('entity_type', 'sourcing_progress')
            formData.append('entity_id', result.id.toString())

            const uploadResponse = await fetch('/api/files/upload', {
              method: 'POST',
              body: formData
            })
            
            if (!uploadResponse.ok) {
              const error = await uploadResponse.json()
              console.error('File upload error:', error)
            }
          }
          setUploadingFiles(false)
        }

        // 초기화
        setQuoteForm({
          manufacturer_name: '',
          supplier_name: '',
          quote_price: '',
          quote_currency: 'USD',
          quote_lead_time: '',
          has_gmp: false,
          has_dmf: false,
          has_cep: false,
          has_iso: false,
          certificate_notes: '',
          description: ''
        })
        setSelectedFiles([])
        setShowQuoteForm(false)
        fetchTaskDetail()
      } else {
        const error = await response.json()
        console.error('Progress API error:', error)
        alert('견적 정보 저장에 실패했습니다. 콘솔을 확인해주세요.')
      }
    } catch (error) {
      console.error('견적 정보 추가 실패:', error)
      alert('견적 정보 저장 중 오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files))
    }
  }

  const removeFile = (index: number) => {
    setSelectedFiles(files => files.filter((_, i) => i !== index))
  }

  const handleEditProgress = (item: any) => {
    setEditingProgressId(item.id)
    setEditingProgressText(item.description)
    // Check if this is a quote entry
    if (item.manufacturer_name) {
      setEditingQuoteInfo(true)
      setQuoteForm({
        manufacturer_name: item.manufacturer_name || '',
        supplier_name: item.supplier_name || item.manufacturer_name || '',
        quote_price: item.quote_price?.toString() || '',
        quote_currency: item.quote_currency || 'USD',
        quote_lead_time: item.quote_lead_time || '',
        has_gmp: item.has_gmp || false,
        has_dmf: item.has_dmf || false,
        has_cep: item.has_cep || false,
        has_iso: item.has_iso || false,
        certificate_notes: item.certificate_notes || '',
        description: item.description || ''
      })
    } else {
      setEditingQuoteInfo(false)
    }
  }

  const saveProgressEdit = async () => {
    if (editingQuoteInfo) {
      // Save quote info
      if (!quoteForm.description.trim()) return
      
      const updateData: any = {
        description: quoteForm.description,
        manufacturer_name: quoteForm.manufacturer_name,
        supplier_name: quoteForm.supplier_name || quoteForm.manufacturer_name,
        quote_currency: quoteForm.quote_currency,
        quote_lead_time: quoteForm.quote_lead_time,
        has_gmp: quoteForm.has_gmp,
        has_dmf: quoteForm.has_dmf,
        has_cep: quoteForm.has_cep,
        has_iso: quoteForm.has_iso,
        certificate_notes: quoteForm.certificate_notes
      }
      
      if (quoteForm.quote_price && !isNaN(parseFloat(quoteForm.quote_price))) {
        updateData.quote_price = quoteForm.quote_price
      }
      
      try {
        const response = await fetch(`/api/sourcing-progress/${editingProgressId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updateData)
        })

        if (response.ok) {
          setEditingProgressId(null)
          setEditingProgressText('')
          setEditingQuoteInfo(false)
          setQuoteForm({
            manufacturer_name: '',
            supplier_name: '',
            quote_price: '',
            quote_currency: 'USD',
            quote_lead_time: '',
            has_gmp: false,
            has_dmf: false,
            has_cep: false,
            has_iso: false,
            certificate_notes: '',
            description: ''
          })
          fetchTaskDetail()
        }
      } catch (error) {
        console.error('견적 정보 수정 실패:', error)
      }
    } else {
      // Save text only
      if (!editingProgressText.trim()) return

      try {
        const response = await fetch(`/api/sourcing-progress/${editingProgressId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ description: editingProgressText })
        })

        if (response.ok) {
          setEditingProgressId(null)
          setEditingProgressText('')
          fetchTaskDetail()
        }
      } catch (error) {
        console.error('진행 내역 수정 실패:', error)
      }
    }
  }

  const deleteProgress = async (progressId: number) => {
    if (!confirm('정말로 이 진행 내역을 삭제하시겠습니까?')) return

    try {
      const response = await fetch(`/api/sourcing-progress/${progressId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchTaskDetail()
      } else {
        const error = await response.json()
        console.error('Delete error response:', error)
        alert(`진행 내역 삭제 실패: ${error.error}`)
      }
    } catch (error) {
      console.error('진행 내역 삭제 실패:', error)
      alert('진행 내역 삭제 중 오류가 발생했습니다.')
    }
  }

  const updateStatus = async (newStatus: string) => {
    try {
      const response = await fetch(`/api/tasks/${params.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        fetchTaskDetail()
      }
    } catch (error) {
      console.error('상태 업데이트 실패:', error)
    }
  }

  const handleDeleteRequest = async () => {
    if (!confirm('정말로 이 소싱 의뢰를 삭제하시겠습니까?\n삭제하면 관련된 모든 진행 내역도 함께 삭제됩니다.')) return

    console.log('삭제 요청 시작:', {
      taskId: task?.id,
      requestId: task?.sourcing_request?.id,
      tradeUserId: task?.trade_user_id,
      currentUserId: userData?.id
    })

    setSubmitting(true)
    try {
      const response = await fetch(`/api/sourcing-requests/${task?.sourcing_request?.id}`, {
        method: 'DELETE'
      })

      const responseText = await response.text()
      console.log('삭제 응답:', response.status, responseText)

      if (response.ok) {
        router.push('/tasks')
      } else {
        let error
        try {
          error = JSON.parse(responseText)
        } catch {
          error = { error: responseText }
        }
        console.error('삭제 실패 응답:', error)
        alert(error.error || '삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('소싱 의뢰 삭제 실패:', error)
      alert('삭제에 실패했습니다.')
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
        </div>
      </div>
    )
  }

  if (!userData || (userData.department !== 'trade' && userData.department !== 'admin')) {
    return null
  }

  if (!task) {
    return null
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      assigned: { bg: 'bg-blue-100', text: 'text-blue-800', label: '할당됨' },
      in_progress: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: '진행중' },
      completed: { bg: 'bg-green-100', text: 'text-green-800', label: '완료' }
    }
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.assigned
    return (
      <span className={`px-3 py-1 text-sm font-medium rounded-full ${config.bg} ${config.text}`}>
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
            onClick={() => router.push('/tasks')}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            TASK 목록으로
          </button>
          <div className="flex items-center gap-3">
            {getStatusBadge(task.status)}
            {task.status !== 'completed' && (
              <button
                onClick={handleDeleteRequest}
                disabled={submitting}
                className="px-3 py-1 text-sm font-medium text-red-600 hover:text-red-800 flex items-center gap-1 disabled:opacity-50"
                title="소싱 의뢰 삭제"
              >
                <Trash2 className="w-4 h-4" />
                삭제
              </button>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Task Info */}
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">{task.sourcing_request.product_name}</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-start">
                  <Building2 className="w-5 h-5 mr-3 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">거래처</p>
                    <p className="text-base text-gray-900">{task.sourcing_request.client_name}</p>
                  </div>
                </div>
                
                {task.sourcing_request.usage_amount && (
                  <div className="flex items-start">
                    <Package className="w-5 h-5 mr-3 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">사용량</p>
                      <p className="text-base text-gray-900">{task.sourcing_request.usage_amount}</p>
                    </div>
                  </div>
                )}
                
                {task.sourcing_request.existing_supplier && (
                  <div className="flex items-start">
                    <Building2 className="w-5 h-5 mr-3 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">기존 제조원</p>
                      <p className="text-base text-gray-900">{task.sourcing_request.existing_supplier}</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="space-y-3">
                <div className="flex items-start">
                  <User className="w-5 h-5 mr-3 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">요청자</p>
                    <p className="text-base text-gray-900">{task.sourcing_request.sales_user.name}</p>
                    <p className="text-sm text-gray-600">{task.sourcing_request.sales_user.email}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Calendar className="w-5 h-5 mr-3 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">요청일</p>
                    <p className="text-base text-gray-900">
                      {new Date(task.sourcing_request.created_at).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                </div>
                
                {task.assigned_at && (
                  <div className="flex items-start">
                    <Clock className="w-5 h-5 mr-3 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">할당일</p>
                      <p className="text-base text-gray-900">
                        {new Date(task.assigned_at).toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {task.sourcing_request.requirements && (
              <div className="mt-4">
                <div className="flex items-start">
                  <FileText className="w-5 h-5 mr-3 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500 mb-1">필요사항</p>
                    <p className="text-base text-gray-900 whitespace-pre-wrap">{task.sourcing_request.requirements}</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* 소싱 의뢰 첨부파일 표시 */}
            {(() => {
              const requestFiles = task.files?.filter(file => 
                file.entity_type === 'sourcing_request' && file.entity_id === task.sourcing_request.id
              )
              if (requestFiles && requestFiles.length > 0) {
                return (
                  <div className="mt-4">
                    <div className="flex items-start">
                      <Paperclip className="w-5 h-5 mr-3 text-gray-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-500 mb-2">첨부파일</p>
                        <div className="space-y-1">
                          {requestFiles.map((file) => (
                            <a
                              key={file.id}
                              href={`/api/files/download/${file.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-sm text-blue-700 hover:text-blue-900 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                            >
                              <Download className="w-3 h-3" />
                              <span className="truncate">{file.file_name}</span>
                              <span className="text-xs text-gray-500">({(file.file_size / 1024).toFixed(1)} KB)</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              }
              return null
            })()}
          </div>

          {/* Status Change Buttons */}
          <div className="p-6 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">상태 변경</h2>
              <div className="flex gap-2">
                {task.status === 'assigned' && (
                  <button
                    onClick={() => updateStatus('in_progress')}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium text-sm"
                  >
                    진행 시작
                  </button>
                )}
                {task.status === 'in_progress' && (
                  <button
                    onClick={() => updateStatus('completed')}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
                  >
                    완료 처리
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Progress Timeline */}
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <MessageSquare className="w-5 h-5 mr-2" />
              진행 내역
            </h2>
            
            {/* Progress Input */}
            <div className="mb-6">
              {!showQuoteForm ? (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex gap-2 mb-3">
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
                      disabled={submitting || uploadingFiles || !newProgress.trim()}
                      className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {uploadingFiles ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setShowQuoteForm(true)}
                      className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 font-medium"
                    >
                      <Plus className="w-4 h-4" />
                      견적 정보 추가
                    </button>
                    <label className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-700 cursor-pointer">
                      <Paperclip className="w-4 h-4" />
                      <span>파일 첨부</span>
                      <input
                        type="file"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                      />
                    </label>
                  </div>
                  {selectedFiles.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-200">
                          <span className="text-sm text-gray-700 truncate">{file.name}</span>
                          <button
                            onClick={() => removeFile(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                      <DollarSign className="w-5 h-5" />
                      견적 정보 입력
                    </h3>
                    <button
                      onClick={() => setShowQuoteForm(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">제조사명 *</label>
                        <input
                          type="text"
                          value={quoteForm.manufacturer_name}
                          onChange={(e) => setQuoteForm({...quoteForm, manufacturer_name: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="예: ABC Pharma"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">공급사명</label>
                        <input
                          type="text"
                          value={quoteForm.supplier_name}
                          onChange={(e) => setQuoteForm({...quoteForm, supplier_name: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="제조사와 동일시 빈칸"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">견적가 *</label>
                        <div className="flex gap-2">
                          <select
                            value={quoteForm.quote_currency}
                            onChange={(e) => setQuoteForm({...quoteForm, quote_currency: e.target.value})}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          >
                            <option value="USD">USD</option>
                            <option value="EUR">EUR</option>
                            <option value="KRW">KRW</option>
                            <option value="CNY">CNY</option>
                            <option value="INR">INR</option>
                          </select>
                          <input
                            type="number"
                            value={quoteForm.quote_price}
                            onChange={(e) => setQuoteForm({...quoteForm, quote_price: e.target.value})}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="0.00"
                            step="0.01"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">리드타임</label>
                        <input
                          type="text"
                          value={quoteForm.quote_lead_time}
                          onChange={(e) => setQuoteForm({...quoteForm, quote_lead_time: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="예: 30-45일"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">자격 증명</label>
                      <div className="flex flex-wrap gap-4">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={quoteForm.has_gmp}
                            onChange={(e) => setQuoteForm({...quoteForm, has_gmp: e.target.checked})}
                            className="rounded text-purple-600 focus:ring-purple-500"
                          />
                          <span className="text-sm">GMP</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={quoteForm.has_dmf}
                            onChange={(e) => setQuoteForm({...quoteForm, has_dmf: e.target.checked})}
                            className="rounded text-purple-600 focus:ring-purple-500"
                          />
                          <span className="text-sm">DMF</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={quoteForm.has_cep}
                            onChange={(e) => setQuoteForm({...quoteForm, has_cep: e.target.checked})}
                            className="rounded text-purple-600 focus:ring-purple-500"
                          />
                          <span className="text-sm">CEP</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={quoteForm.has_iso}
                            onChange={(e) => setQuoteForm({...quoteForm, has_iso: e.target.checked})}
                            className="rounded text-purple-600 focus:ring-purple-500"
                          />
                          <span className="text-sm">ISO</span>
                        </label>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">자격 증명 참고사항</label>
                      <input
                        type="text"
                        value={quoteForm.certificate_notes}
                        onChange={(e) => setQuoteForm({...quoteForm, certificate_notes: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="예: GMP 2025년 갱신 예정"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">진행 내용 *</label>
                      <textarea
                        value={quoteForm.description}
                        onChange={(e) => setQuoteForm({...quoteForm, description: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        rows={3}
                        placeholder="견적 진행 상황을 설명해주세요..."
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">첨부파일</label>
                      <div className="space-y-2">
                        <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 cursor-pointer transition-colors">
                          <Upload className="w-5 h-5 text-gray-400" />
                          <span className="text-sm text-gray-600">견적서, 성적서, 자격증명서 업로드</span>
                          <input
                            type="file"
                            multiple
                            onChange={handleFileSelect}
                            className="hidden"
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                          />
                        </label>
                        {selectedFiles.length > 0 && (
                          <div className="space-y-1">
                            {selectedFiles.map((file, index) => (
                              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <div className="flex items-center gap-2">
                                  <FileCheck className="w-4 h-4 text-gray-500" />
                                  <span className="text-sm text-gray-700">{file.name}</span>
                                  <span className="text-xs text-gray-500">({(file.size / 1024).toFixed(1)} KB)</span>
                                </div>
                                <button
                                  onClick={() => removeFile(index)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2 pt-4">
                      <button
                        onClick={submitQuote}
                        disabled={submitting || uploadingFiles}
                        className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                      >
                        {uploadingFiles ? '파일 업로드 중...' : '견적 정보 저장'}
                      </button>
                      <button
                        onClick={() => setShowQuoteForm(false)}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Progress List */}
            <div className="space-y-4">
              {task.progress && task.progress.length > 0 ? (
                task.progress.map((item) => (
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
                      {editingProgressId === item.id ? (
                        editingQuoteInfo ? (
                          // Edit quote info
                          <div className="w-full p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                            <div className="space-y-3">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">제조사명</label>
                                  <input
                                    type="text"
                                    value={quoteForm.manufacturer_name}
                                    onChange={(e) => setQuoteForm({...quoteForm, manufacturer_name: e.target.value})}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">공급사명</label>
                                  <input
                                    type="text"
                                    value={quoteForm.supplier_name}
                                    onChange={(e) => setQuoteForm({...quoteForm, supplier_name: e.target.value})}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="제조사와 동일시 빈칸"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">견적가</label>
                                  <div className="flex gap-1">
                                    <select
                                      value={quoteForm.quote_currency}
                                      onChange={(e) => setQuoteForm({...quoteForm, quote_currency: e.target.value})}
                                      className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    >
                                      <option value="USD">USD</option>
                                      <option value="EUR">EUR</option>
                                      <option value="KRW">KRW</option>
                                      <option value="CNY">CNY</option>
                                      <option value="INR">INR</option>
                                    </select>
                                    <input
                                      type="number"
                                      value={quoteForm.quote_price}
                                      onChange={(e) => setQuoteForm({...quoteForm, quote_price: e.target.value})}
                                      className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                      step="0.01"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">리드타임</label>
                                  <input
                                    type="text"
                                    value={quoteForm.quote_lead_time}
                                    onChange={(e) => setQuoteForm({...quoteForm, quote_lead_time: e.target.value})}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="예: 30-45일"
                                  />
                                </div>
                              </div>
                              
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">자격 증명</label>
                                <div className="flex flex-wrap gap-3">
                                  <label className="flex items-center gap-1">
                                    <input
                                      type="checkbox"
                                      checked={quoteForm.has_gmp}
                                      onChange={(e) => setQuoteForm({...quoteForm, has_gmp: e.target.checked})}
                                      className="rounded text-purple-600 focus:ring-purple-500"
                                    />
                                    <span className="text-xs">GMP</span>
                                  </label>
                                  <label className="flex items-center gap-1">
                                    <input
                                      type="checkbox"
                                      checked={quoteForm.has_dmf}
                                      onChange={(e) => setQuoteForm({...quoteForm, has_dmf: e.target.checked})}
                                      className="rounded text-purple-600 focus:ring-purple-500"
                                    />
                                    <span className="text-xs">DMF</span>
                                  </label>
                                  <label className="flex items-center gap-1">
                                    <input
                                      type="checkbox"
                                      checked={quoteForm.has_cep}
                                      onChange={(e) => setQuoteForm({...quoteForm, has_cep: e.target.checked})}
                                      className="rounded text-purple-600 focus:ring-purple-500"
                                    />
                                    <span className="text-xs">CEP</span>
                                  </label>
                                  <label className="flex items-center gap-1">
                                    <input
                                      type="checkbox"
                                      checked={quoteForm.has_iso}
                                      onChange={(e) => setQuoteForm({...quoteForm, has_iso: e.target.checked})}
                                      className="rounded text-purple-600 focus:ring-purple-500"
                                    />
                                    <span className="text-xs">ISO</span>
                                  </label>
                                </div>
                              </div>
                              
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">자격 증명 참고사항</label>
                                <input
                                  type="text"
                                  value={quoteForm.certificate_notes}
                                  onChange={(e) => setQuoteForm({...quoteForm, certificate_notes: e.target.value})}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                  placeholder="예: GMP 2025년 갱신 예정"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">진행 내용</label>
                                <textarea
                                  value={quoteForm.description}
                                  onChange={(e) => setQuoteForm({...quoteForm, description: e.target.value})}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                  rows={2}
                                />
                              </div>
                              <div className="flex gap-2 justify-end">
                                <button
                                  onClick={saveProgressEdit}
                                  className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                                >
                                  저장
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingProgressId(null)
                                    setEditingProgressText('')
                                    setEditingQuoteInfo(false)
                                  }}
                                  className="px-3 py-1 text-sm bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                                >
                                  취소
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          // Edit text only
                          <div className="flex gap-2 items-start">
                            <input
                              type="text"
                              value={editingProgressText}
                              onChange={(e) => setEditingProgressText(e.target.value)}
                              className="flex-1 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                            <button
                              onClick={saveProgressEdit}
                              className="px-2 py-1 text-sm text-green-600 hover:text-green-800"
                            >
                              저장
                            </button>
                            <button
                              onClick={() => {
                                setEditingProgressId(null)
                                setEditingProgressText('')
                              }}
                              className="px-2 py-1 text-sm text-gray-600 hover:text-gray-800"
                            >
                              취소
                            </button>
                          </div>
                        )
                      ) : (
                        <div className="flex items-start justify-between">
                          <p className="text-gray-700 flex-1">{item.description}</p>
                          {item.user_id === userData?.id && (
                            <div className="flex gap-1 ml-2">
                              <button
                                onClick={() => handleEditProgress(item)}
                                className="p-1 text-gray-400 hover:text-gray-600"
                                title="수정"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deleteProgress(item.id)}
                                className="p-1 text-gray-400 hover:text-red-600"
                                title="삭제"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                      
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
                        const attachedFiles = task.files?.filter(file => 
                          file.entity_type === 'sourcing_progress' && file.entity_id === item.id
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
        </div>
      </div>
    </div>
  )
}