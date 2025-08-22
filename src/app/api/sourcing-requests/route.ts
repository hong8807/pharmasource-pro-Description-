import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  
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
  
  try {
    const body = await request.json()
    const { product_name, client_name, usage_amount, existing_manufacturer, requirements } = body
    
    if (!product_name || !client_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    
    // Create sourcing request
    const { data: requestData, error: requestError } = await supabase
      .from('sourcing_requests')
      .insert({
        sales_user_id: user.id,
        product_name,
        client_name,
        usage_amount,
        existing_manufacturer,
        requirements,
        status: 'pending'
      })
      .select()
      .single()
    
    if (requestError) throw requestError
    
    // Create corresponding task for trade department
    const { data: taskData, error: taskError } = await supabase
      .from('sourcing_tasks')
      .insert({
        sourcing_request_id: requestData.id,
        status: 'unassigned'
      })
      .select()
      .single()
    
    if (taskError) throw taskError
    
    return NextResponse.json({
      data: requestData,
      task: taskData
    })
  } catch (error: any) {
    console.error('Sourcing request error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const supabase = createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }
  
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit
    
    let query = supabase
      .from('sourcing_requests')
      .select(`
        *,
        sourcing_tasks (
          id,
          status,
          trade_user_id,
          assigned_at,
          completed_at
        )
      `, { count: 'exact' })
      .eq('sales_user_id', user.id)
      .order('created_at', { ascending: false })
    
    if (status) {
      query = query.eq('status', status)
    }
    
    query = query.range(offset, offset + limit - 1)
    
    const { data, error, count } = await query
    
    if (error) throw error
    
    return NextResponse.json({
      data,
      total: count,
      page,
      totalPages: Math.ceil((count || 0) / limit)
    })
  } catch (error: any) {
    console.error('Fetch sourcing requests error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}