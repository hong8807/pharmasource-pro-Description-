'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { Home, FileSearch, Package, LayoutDashboard, LogOut, Plus, Menu, X } from 'lucide-react'
import { useState, useEffect } from 'react'
import { BrandButton } from '@/components/ui/BrandButton'
import { BorderBeam } from '@/components/ui/border-beam'
import { cn } from '@/lib/utils'

function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, userData, signOut } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [slideTextColor, setSlideTextColor] = useState('white')
  
  // 로그인 페이지(홈페이지)인지 확인
  const isLoginPage = pathname === '/'

  // 스크롤 상태 감지
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // 슬라이드 텍스트 색상 감지
  useEffect(() => {
    const checkSlideColor = () => {
      const slideColor = document.documentElement.getAttribute('data-slide-text-color') || 'white'
      setSlideTextColor(slideColor)
    }

    checkSlideColor()
    const observer = new MutationObserver(checkSlideColor)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-slide-text-color']
    })

    return () => observer.disconnect()
  }, [])

  const handleSignOut = async () => {
    try {
      // API 라우트를 통한 로그아웃 시도
      const response = await fetch('/api/auth/signout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        // API 로그아웃 실패 시 클라이언트 로그아웃 시도
        await signOut()
      }
      
      // 로컬 스토리지 완전 정리
      if (typeof window !== 'undefined') {
        localStorage.clear()
        sessionStorage.clear()
      }
      
      // 페이지를 완전히 새로고침하여 상태를 초기화
      window.location.href = '/'
    } catch (error) {
      console.error('로그아웃 오류:', error)
      // 오류 발생 시에도 홈으로 이동
      window.location.href = '/'
    }
  }

  const navigation = [
    {
      name: '대시보드',
      href: userData?.department === 'sales' ? '/dashboard/sales' : 
            userData?.department === 'trade' ? '/dashboard/trade' : 
            '/dashboard/admin',
      icon: LayoutDashboard,
      show: true
    },
    {
      name: '소싱 의뢰',
      href: '/sourcing',
      icon: FileSearch,
      show: userData?.department === 'sales' || userData?.department === 'admin'
    },
    {
      name: '통합 검색',
      href: '/search',
      icon: Package,
      show: true
    },
    {
      name: 'TASK',
      href: '/tasks',
      icon: FileSearch,
      show: userData?.department === 'trade' || userData?.department === 'admin'
    },
  ]

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  // 로그인 페이지에서는 헤더 내용을 숨김
  if (isLoginPage) {
    return null
  }

  return (
    <header className={cn(
      "sticky top-0 z-50 transition-all duration-300",
      isScrolled 
        ? "bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200/50" 
        : "bg-white/90 backdrop-blur-sm shadow-md"
    )}>
      <div className="container-custom">
        <div className="flex items-center justify-between h-14 sm:h-16 py-2">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-[var(--color-primary)] flex items-center justify-center shadow-lg">
                  <Package className="w-4 h-4 sm:w-6 sm:h-6 text-white drop-shadow-md" />
                </div>
                <span className="text-lg sm:text-xl md:text-2xl font-[var(--font-weight-extrabold)] text-gray-800 bg-gradient-to-r from-huxeed-green via-gray-800 to-huxeed-green bg-clip-text text-transparent animate-pulse">
                  PharmaSource Pro
                </span>
              </div>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {user && userData ? (
              <>
                {navigation.filter(item => item.show).map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 md:px-4 py-1 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300",
                        isActive(item.href) 
                          ? "bg-huxeed-green text-white shadow-md" 
                          : "text-gray-700 hover:text-huxeed-green hover:bg-green-50"
                      )}
                    >
                      <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">{item.name}</span>
                    </Link>
                  )
                })}
                
                {userData.department === 'sales' && (
                  <BrandButton 
                    variant="primary" 
                    size="sm" 
                    shimmer={true}
                    className="ml-2"
                    onClick={() => router.push('/sourcing/new')}
                  >
                    <Plus className="w-4 h-4" />
                    <span>새 의뢰</span>
                  </BrandButton>
                )}
                
                <div className="ml-2 sm:ml-4 md:ml-6 flex items-center space-x-2 sm:space-x-4">
                  <div className="text-xs sm:text-sm">
                    <p className="font-medium text-gray-800">
                      {userData.name}
                    </p>
                    <p className="text-xs text-huxeed-green font-medium hidden sm:block">
                      {userData.department === 'sales' ? '영업부' : 
                       userData.department === 'trade' ? '무역부' : '관리자'}
                    </p>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="p-1 sm:p-2 rounded-lg transition-colors text-gray-600 hover:text-red-600 hover:bg-red-50"
                    aria-label="로그아웃"
                    title="로그아웃"
                  >
                    <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              </>
            ) : null}
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg transition-colors text-gray-600 hover:text-huxeed-green hover:bg-green-50"
              aria-label={mobileMenuOpen ? "메뉴 닫기" : "메뉴 열기"}
              title={mobileMenuOpen ? "메뉴 닫기" : "메뉴 열기"}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && user && userData && (
        <div className="md:hidden border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navigation.filter(item => item.show).map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`
                    flex items-center space-x-2 px-3 py-2 rounded-lg text-base font-medium
                    ${isActive(item.href) 
                      ? 'bg-gradient-to-r from-huxeed-green to-green-600 text-white' 
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
            
            {userData.department === 'sales' && (
              <Link
                href="/sourcing/new"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg text-base font-medium bg-gradient-to-r from-huxeed-green to-green-600 text-white"
              >
                <Plus className="w-5 h-5" />
                <span>새 의뢰</span>
              </Link>
            )}
            
            <div className="pt-4 mt-4 border-t border-gray-200">
              <div className="px-3 py-2">
                <p className="text-gray-900 font-medium">{userData.name}</p>
                <p className="text-gray-500 text-sm">
                  {userData.department === 'sales' ? '영업부' : 
                   userData.department === 'trade' ? '무역부' : '관리자'}
                </p>
              </div>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-base font-medium text-red-600 hover:bg-red-50"
              >
                <LogOut className="w-5 h-5" />
                <span>로그아웃</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

export { Header }
export default Header