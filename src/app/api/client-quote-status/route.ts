import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }
  
  // Check if user is from sales department
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('department')
    .eq('id', user.id)
    .single()
  
  if (userError || userData?.department !== 'sales') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  
  const body = await request.json()
  const { sourcing_request_id, ...updateData } = body
  
  try {
    // Check if status already exists
    const { data: existing } = await supabase
      .from('client_quote_status')
      .select('id')
      .eq('sourcing_request_id', sourcing_request_id)
      .single()
    
    let result
    
    if (existing) {
      // Update existing
      const { data, error } = await supabase
        .from('client_quote_status')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single()
      
      if (error) throw error
      result = data
    } else {
      // Create new
      const { data, error } = await supabase
        .from('client_quote_status')
        .insert({
          sourcing_request_id,
          sales_user_id: user.id,
          ...updateData
        })
        .select()
        .single()
      
      if (error) throw error
      result = data
    }
    
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Client quote status error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}