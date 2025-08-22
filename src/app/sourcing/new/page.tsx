'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { useEffect } from 'react'

export default function NewSourcingRequest() {
  const router = useRouter()
  const { userData, loading } = useAuth()
  
  const [formData, setFormData] = useState({
    product_name: '',
    client_name: '',
    usage_amount: '',
    existing_manufacturer: '',
    requirements: ''
  })
  const [files, setFiles] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && (!userData || userData.department !== 'sales')) {
      router.push('/login')
    }
  }, [userData, loading, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      // Create sourcing request
      const response = await fetch('/api/sourcing-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        throw new Error('소싱 의뢰 생성에 실패했습니다.')
      }

      const { data: request } = await response.json()

      // Upload files if any
      if (files.length > 0 && request) {
        for (const file of files) {
          const formData = new FormData()
          formData.append('file', file)
          formData.append('entity_type', 'sourcing_request')
          formData.append('entity_id', request.id.toString())

          const uploadResponse = await fetch('/api/files/upload', {
            method: 'POST',
            body: formData
          })

          if (!uploadResponse.ok) {
            console.error('File upload failed:', await uploadResponse.text())
          }
        }
      }

      router.push('/dashboard/sales')
    } catch (err: any) {
      setError(err.message || '소싱 의뢰 생성 중 오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
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
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6">새 소싱 의뢰</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="product_name" className="block text-sm font-medium text-gray-700">
                  성분명/제품명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="product_name"
                  id="product_name"
                  required
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={formData.product_name}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="client_name" className="block text-sm font-medium text-gray-700">
                  거래처명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="client_name"
                  id="client_name"
                  required
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={formData.client_name}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="usage_amount" className="block text-sm font-medium text-gray-700">
                  사용량
                </label>
                <input
                  type="text"
                  name="usage_amount"
                  id="usage_amount"
                  placeholder="예: 연간 100kg"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={formData.usage_amount}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="existing_manufacturer" className="block text-sm font-medium text-gray-700">
                  기존 제조원
                </label>
                <input
                  type="text"
                  name="existing_manufacturer"
                  id="existing_manufacturer"
                  placeholder="현재 사용 중인 제조원"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={formData.existing_manufacturer}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="requirements" className="block text-sm font-medium text-gray-700">
                  필요사항
                </label>
                <textarea
                  name="requirements"
                  id="requirements"
                  rows={4}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="특별 요구사항, 품질 규격, 인증 요구사항 등"
                  value={formData.requirements}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="files" className="block text-sm font-medium text-gray-700">
                  첨부파일
                </label>
                <input
                  type="file"
                  name="files"
                  id="files"
                  multiple
                  className="mt-1 block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-indigo-50 file:text-indigo-700
                    hover:file:bg-indigo-100"
                  onChange={handleFileChange}
                />
                <p className="mt-1 text-sm text-gray-500">
                  스펙, 견적서, 참고 문서 등을 첨부할 수 있습니다.
                </p>
              </div>

              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="text-sm text-red-800">{error}</div>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
                >
                  {submitting ? '제출 중...' : '소싱 의뢰'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}