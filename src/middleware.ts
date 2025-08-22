import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  console.log('Middleware called for:', request.nextUrl.pathname)
  
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Protected routes
  const protectedPaths = ['/dashboard', '/sourcing', '/tasks', '/manual', '/admin']
  const isProtectedPath = protectedPaths.some(path => request.nextUrl.pathname.startsWith(path))

  if (isProtectedPath && !user) {
    // 현재 경로가 이미 루트 경로인 경우 무한 리다이렉트 방지
    if (request.nextUrl.pathname === '/') {
      return response
    }
    const url = new URL('/', request.url)
    url.searchParams.set('redirectTo', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // Auth routes (login, signup) - redirect to dashboard if already logged in
  const authPaths = ['/', '/login', '/signup']
  const isAuthPath = authPaths.some(path => request.nextUrl.pathname === path || (path !== '/' && request.nextUrl.pathname.startsWith(path)))

  if (isAuthPath && user) {
    // Get user's department from database
    const { data: userData } = await supabase
      .from('users')
      .select('department')
      .eq('id', user.id)
      .single()

    if (userData) {
      const dashboardPath = userData.department === 'sales' ? '/dashboard/sales' : 
                           userData.department === 'trade' ? '/dashboard/trade' : 
                           '/dashboard/admin'
      return NextResponse.redirect(new URL(dashboardPath, request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}