import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST() {
  const supabase = await createClient()
  
  const { error } = await supabase.auth.signOut()
  
  if (error) {
    console.error('Supabase signout error:', error)
  }
  
  // Clear all auth-related cookies
  const cookieStore = await cookies()
  const allCookies = cookieStore.getAll()
  
  // Create response with cleared cookies
  const response = NextResponse.json({ success: true })
  
  // Clear all Supabase related cookies
  allCookies.forEach((cookie) => {
    if (cookie.name.includes('supabase') || cookie.name.includes('auth')) {
      response.cookies.set(cookie.name, '', {
        value: '',
        maxAge: 0,
        path: '/',
      })
    }
  })
  
  return response
}