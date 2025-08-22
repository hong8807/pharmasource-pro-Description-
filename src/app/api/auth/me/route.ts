import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('Auth API: Starting request')
    const supabase = createClient()
    console.log('Auth API: Supabase client created')
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log('Auth API: getUser result:', { user: !!user, error: authError?.message })
    
    if (authError || !user) {
      console.log('Auth API: No authenticated user')
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    
    console.log('Auth API: Fetching user data for ID:', user.id)
    // Get full user data including department
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()
    
    console.log('Auth API: User data result:', { userData, error: userError?.message })
    
    if (userError) {
      console.log('Auth API: User data error:', userError.message)
      return NextResponse.json({ error: userError.message }, { status: 400 })
    }
    
    console.log('Auth API: Success, returning user data')
    return NextResponse.json({
      user: userData,
      auth: user
    })
  } catch (error) {
    console.error('Auth API: Unexpected error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}