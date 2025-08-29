'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/AuthProvider'
import { ShimmerButton } from '@/components/ui/shimmer-button'
import { MagicCard } from '@/components/ui/magic-card'
import { FlickeringGrid } from '@/components/ui/flickering-grid'

export default function HomePage() {
  const router = useRouter()
  const { user, userData, loading: authLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)
  
  // 배경 이미지 슬라이드 데이터
  const backgroundSlides = useMemo(() => [
    {
      image: 'https://cdn.imweb.me/thumbnail/20250729/e73d7609ec784.jpg',
      title: 'Huxeed',
      subtitle: 'New Seeds for Human & Health',
      description: '글로벌 의약품 원료 소싱 자동화 플랫폼',
      textColor: 'white' // 어두운 이미지용
    },
    {
      image: 'https://cdn.imweb.me/thumbnail/20250729/b3c117410f0ce.jpg',
      title: 'Innovation',
      subtitle: 'Advanced Healthcare Solutions',
      description: '혁신적인 헬스케어 솔루션을 통한 미래 건강',
      textColor: 'dark' // 밝은 이미지용
    },
    {
      image: 'https://cdn.imweb.me/thumbnail/20250729/3f1a67d830a2b.jpg',
      title: 'Excellence',
      subtitle: 'Quality & Trust',
      description: '품질과 신뢰를 바탕으로 한 우수한 서비스',
      textColor: 'white' // 어두운 이미지용
    }
  ], [])

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

  // 배경 이미지 슬라이드 효과
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % backgroundSlides.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [backgroundSlides.length])

  // 현재 슬라이드의 텍스트 색상을 전역 상태로 관리
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const currentTextColor = backgroundSlides[currentSlide].textColor
      document.documentElement.setAttribute('data-slide-text-color', currentTextColor)
    }
  }, [currentSlide, backgroundSlides])

  // 인증 상태 확인 중일 때 로딩 표시
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden">
        {/* Background Images Slideshow */}
        <div className="absolute inset-0">
          {backgroundSlides.map((slide, index) => (
            <div
              key={index}
              className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${
                index === currentSlide ? 'opacity-100' : 'opacity-0'
              }`}
              style={{
                backgroundImage: `url(${slide.image})`,
              }}
            />
          ))}
          <div className="absolute inset-0 bg-black/60" />
        </div>
        <div className="relative text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-huxeed-green"></div>
          <p className="mt-4 text-white font-medium">로딩 중...</p>
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
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Images Slideshow */}
      <div className="absolute inset-0">
        {backgroundSlides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              backgroundImage: `url(${slide.image})`,
            }}
          />
        ))}
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-black/50" />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-black/20 to-transparent"></div>

      {/* Content Container - 완전 반응형 */}
      <div className="relative min-h-screen flex flex-col lg:flex-row items-center justify-center">
        
        {/* Hero Content - 적절한 크기 */}
        <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 md:px-8 lg:px-12 text-white w-full lg:w-auto">
          <div className="max-w-2xl mx-auto lg:mx-0">
            {/* Logo and Company Info */}
            <div className="mb-5 md:mb-6 text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start mb-3">
                <Image 
                  src="https://cdn.imweb.me/thumbnail/20250812/1d3b49c004b15.png"
                  alt="Huxeed Logo"
                  width={150}
                  height={48}
                  className="h-8 sm:h-10 w-auto mr-3"
                  style={{
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
                  }}
                  priority
                />
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-2 leading-tight text-white drop-shadow-lg">
                {backgroundSlides[currentSlide].title}
              </h1>
              <p className="text-sm sm:text-base md:text-lg mb-2 text-huxeed-green font-semibold drop-shadow-md">
                {backgroundSlides[currentSlide].subtitle}
              </p>
              <p className="text-xs sm:text-sm text-white drop-shadow-md">
                {backgroundSlides[currentSlide].description}
              </p>
            </div>

            {/* Features - 컴팩트한 크기 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-6 lg:mb-0">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-huxeed-green/30 rounded-full flex items-center justify-center border border-white/20">
                  <div className="w-2 h-2 bg-huxeed-green rounded-full"></div>
                </div>
                <span className="text-xs text-white font-medium drop-shadow-sm">글로벌 API 데이터베이스</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-huxeed-green/30 rounded-full flex items-center justify-center border border-white/20">
                  <div className="w-2 h-2 bg-huxeed-green rounded-full"></div>
                </div>
                <span className="text-xs text-white font-medium drop-shadow-sm">자동화된 소싱 시스템</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-huxeed-green/30 rounded-full flex items-center justify-center border border-white/20">
                  <div className="w-2 h-2 bg-huxeed-green rounded-full"></div>
                </div>
                <span className="text-xs text-white font-medium drop-shadow-sm">실시간 시장 분석</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-huxeed-green/30 rounded-full flex items-center justify-center border border-white/20">
                  <div className="w-2 h-2 bg-huxeed-green rounded-full"></div>
                </div>
                <span className="text-xs text-white font-medium drop-shadow-sm">품질 보증 시스템</span>
              </div>
            </div>
          </div>
        </div>

        {/* Login Form - 더 컴팩트한 크기 */}
        <div className="flex-shrink-0 w-full max-w-xs sm:max-w-sm lg:max-w-sm mx-auto lg:mx-0 px-4 lg:px-4 mt-8 lg:mt-0">
          <MagicCard className="relative bg-black/80 backdrop-blur-xl border border-white/20 shadow-2xl">
            {/* FlickeringGrid Background */}
            <div className="absolute inset-0 rounded-xl overflow-hidden">
              <FlickeringGrid
                className="size-full opacity-40"
                squareSize={2}
                gridGap={4}
                color="rgb(149, 193, 31)"
                maxOpacity={0.3}
                flickerChance={0.1}
              />
            </div>
            
            <div className="relative px-5 py-5 lg:px-6 lg:py-6">
              {/* Form Header */}
              <div className="text-center mb-5">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-2 drop-shadow-md">
                  PharmaSource Pro
                </h2>
                <p className="text-white/90 drop-shadow-sm text-xs sm:text-sm">
                  의약품 원료 소싱 플랫폼에 로그인하세요
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-white mb-2 drop-shadow-sm">
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
                    className="w-full px-4 py-3 rounded-lg border border-white/30 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-huxeed-green focus:border-huxeed-green transition duration-200 bg-white/95 text-sm"
                    placeholder="이메일을 입력하세요"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-white mb-2 drop-shadow-sm">
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
                    className="w-full px-4 py-3 rounded-lg border border-white/30 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-huxeed-green focus:border-huxeed-green transition duration-200 bg-white/95 text-sm"
                    placeholder="비밀번호를 입력하세요"
                  />
                </div>

                {error && (
                  <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                    <p className="text-sm text-red-600 font-medium">{error}</p>
                  </div>
                )}

                <ShimmerButton
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 text-white font-semibold rounded-lg text-sm"
                  background={`linear-gradient(135deg, #95c11f 0%, #7da319 100%)`}
                  shimmerColor="#ffffff"
                  shimmerDuration="2s"
                  borderRadius="8px"
                >
                  {loading ? '로그인 중...' : '로그인'}
                </ShimmerButton>

                <div className="flex items-center justify-between text-sm pt-1">
                  <Link href="/signup" className="text-huxeed-green hover:text-huxeed-green/80 transition font-medium drop-shadow-sm">
                    계정이 없으신가요?
                  </Link>
                  <a href="#" className="text-white/80 hover:text-white transition font-medium drop-shadow-sm">
                    비밀번호 찾기
                  </a>
                </div>
              </form>

              {/* Demo Account Info */}
              <div className="mt-4 text-center">
                <p className="text-xs font-semibold mb-1 text-white drop-shadow-sm">테스트 계정</p>
                <div className="space-y-0.5 text-xs text-white/80">
                  <p>영업부: hosj2002@naver.com / test1234</p>
                  <p>무역부: hosj2002@gmail.com / test1234</p>
                </div>
              </div>
            </div>
          </MagicCard>

          {/* Slide indicators */}
          <div className="flex justify-center mt-4 space-x-2">
            {backgroundSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentSlide
                    ? 'bg-huxeed-green w-6'
                    : 'bg-white/50 hover:bg-white/70'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}