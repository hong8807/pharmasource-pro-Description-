import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const supabase = createClient()
    
    // Supabase에서 로그아웃
    await supabase.auth.signOut()
    
    // 쿠키 삭제
    const response = NextResponse.json({ success: true })
    
    // Supabase 관련 쿠키들 삭제
    response.cookies.delete('supabase-auth-token')
    response.cookies.delete('sb-auth-token')
    response.cookies.delete('sb-refresh-token')
    
    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 })
  }
}