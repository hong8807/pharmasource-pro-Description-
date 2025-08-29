'use client'

import { usePathname } from 'next/navigation'

interface LayoutWrapperProps {
  children: React.ReactNode
}

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname()
  const isLoginPage = pathname === '/'

  return (
    <main className={`min-h-screen ${isLoginPage ? '' : 'bg-gray-50 pt-14 sm:pt-16'}`}>
      {children}
    </main>
  )
}