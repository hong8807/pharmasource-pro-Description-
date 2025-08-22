'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/AuthProvider'

export default function HomePage() {
  const router = useRouter()
  const { user, userData, loading: authLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  

  useEffect(() => {
    if (!authLoading && user && userData) {
      console.log('Authenticated user found, redirecting to dashboard:', userData.department)
      const dashboardPath = userData.department === 'sales' ? '/dashboard/sales' :
                           userData.department === 'trade' ? '/dashboard/trade' :
                           '/dashboard/admin'
      router.push(dashboardPath)
    } else if (!authLoading && !user) {
      console.log('No authenticated user, staying on login page')
    }
  }, [user, userData, router, authLoading])

  // 인증 상태 확인 중일 때 로딩 표시
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          <p className="mt-4 text-white">로딩 중...</p>
        </div>
      </div>
    )
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()

    try {
      console.log('로그인 시도:', email)
      
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      })

      console.log('Auth 응답:', { authData, authError })

      if (authError) {
        console.error('로그인 에러 상세:', authError)
        if (authError.message.includes('Invalid login credentials')) {
          throw new Error('이메일 또는 비밀번호가 올바르지 않습니다.')
        }
        throw authError
      }

      // auth.uid()를 사용하여 users 테이블 조회
      console.log('Users 테이블 조회, ID:', authData.user.id)
      
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('department')
        .eq('id', authData.user.id)
        .single()

      console.log('Users 테이블 응답:', { userData, userError })

      if (userError) {
        // users 테이블에 사용자가 없으면 생성
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email: authData.user.email || email,
            name: authData.user.email?.split('@')[0] || '사용자',
            department: 'sales', // 기본값
            role: 'user' // 기본값
          })
          .select()
          .single()
        
        if (createError) throw createError
        
        const dashboardPath = '/dashboard/sales'
        router.push(dashboardPath)
        router.refresh()
        return
      }

      const dashboardPath = userData.department === 'sales' ? '/dashboard/sales' :
                           userData.department === 'trade' ? '/dashboard/trade' :
                           userData.department === 'admin' ? '/dashboard/admin' :
                           '/dashboard'

      console.log('리다이렉션:', dashboardPath)
      router.push(dashboardPath)
      router.refresh()
    } catch (err: any) {
      console.error('로그인 에러:', err)
      setError(err.message || '로그인에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-32 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-32 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-purple-900/20 to-transparent"></div>

      {/* Content */}
      <div className="relative min-h-screen flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md">
          {/* Logo and Title */}
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold text-white mb-2 tracking-tight">
              PharmaSource
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400"> Pro</span>
            </h1>
            <p className="text-gray-300 text-lg">
              글로벌 의약품 원료 소싱 플랫폼
            </p>
          </div>

          {/* Login Card */}
          <div className="backdrop-blur-xl bg-white/10 rounded-2xl shadow-2xl border border-white/20 p-8">
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-200 mb-2">
                  이메일
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-xl transition duration-200"
                  placeholder="이메일을 입력하세요"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-200 mb-2">
                  비밀번호
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-xl transition duration-200"
                  placeholder="비밀번호를 입력하세요"
                />
              </div>

              {error && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full relative inline-flex items-center justify-center px-6 py-3 overflow-hidden font-medium text-white transition duration-300 ease-out rounded-lg shadow-xl group hover:ring-2 hover:ring-offset-2 hover:ring-purple-500"
              >
                <span className="absolute inset-0 w-full h-full bg-gradient-to-br from-purple-600 via-purple-700 to-pink-700"></span>
                <span className="absolute bottom-0 right-0 block w-64 h-64 mb-32 mr-4 transition duration-500 origin-bottom-left transform rotate-45 translate-x-24 bg-pink-500 rounded-full opacity-30 group-hover:rotate-90 ease"></span>
                <span className="relative">{loading ? '로그인 중...' : '로그인'}</span>
              </button>

              <div className="flex items-center justify-between text-sm">
                <Link href="/signup" className="text-purple-400 hover:text-purple-300 transition">
                  계정이 없으신가요?
                </Link>
                <a href="#" className="text-gray-400 hover:text-gray-300 transition">
                  비밀번호 찾기
                </a>
              </div>
            </form>
          </div>

          {/* Demo Account Info */}
          <div className="mt-8 text-center">
            <p className="text-gray-400 text-sm font-semibold mb-2">테스트 계정</p>
            <div className="space-y-1">
              <p className="text-gray-300 text-sm">영업부: hosj2002@naver.com / test1234</p>
              <p className="text-gray-300 text-sm">무역부: hosj2002@gmail.com / test1234</p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  )
}