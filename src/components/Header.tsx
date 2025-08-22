'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { Home, FileSearch, Package, LayoutDashboard, LogOut, Plus, Menu, X } from 'lucide-react'
import { useState } from 'react'

function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, userData, signOut } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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

  return (
    <header className="bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                PharmaSource Pro
              </span>
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
                      className={`
                        flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                        ${isActive(item.href) 
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md' 
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                        }
                      `}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </Link>
                  )
                })}
                
                {userData.department === 'sales' && (
                  <Link
                    href="/sourcing/new"
                    className="ml-2 flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-md transition-all duration-200"
                  >
                    <Plus className="w-4 h-4" />
                    <span>새 의뢰</span>
                  </Link>
                )}
                
                <div className="ml-6 flex items-center space-x-4">
                  <div className="text-sm">
                    <p className="text-gray-900 font-medium">{userData.name}</p>
                    <p className="text-gray-500 text-xs">
                      {userData.department === 'sales' ? '영업부' : 
                       userData.department === 'trade' ? '무역부' : '관리자'}
                    </p>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                    aria-label="로그아웃"
                    title="로그아웃"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </>
            ) : null}
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100"
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
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
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
                className="flex items-center space-x-2 px-3 py-2 rounded-lg text-base font-medium bg-gradient-to-r from-purple-600 to-pink-600 text-white"
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