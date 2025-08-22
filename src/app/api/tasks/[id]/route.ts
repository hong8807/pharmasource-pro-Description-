import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }
  
  // Check if user is from trade department or admin
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('department')
    .eq('id', user.id)
    .single()
  
  if (userError || (userData?.department !== 'trade' && userData?.department !== 'admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  
  const taskId = parseInt(params.id)
  
  try {
    // Get task details with sourcing request and progress
    const { data: task, error: taskError } = await supabase
      .from('sourcing_tasks')
      .select(`
        id,
        status,
        assigned_at,
        trade_user_id,
        quote_status,
        quote_sent_at,
        quote_response_at,
        quote_notes,
        sourcing_request:sourcing_request_id (
          id,
          product_name,
          client_name,
          usage_amount,
          existing_manufacturer,
          requirements,
          created_at,
          sales_user:sales_user_id (
            name,
            email
          )
        )
      `)
      .eq('id', taskId)
      .single()
    
    if (taskError || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }
    
    // Check if user has access to this task
    console.log('Task access check:', {
      taskId: task.id,
      taskTradeUserId: task.trade_user_id,
      currentUserId: user.id,
      userDepartment: userData?.department,
      isMatch: task.trade_user_id === user.id,
      isAdmin: userData?.department === 'admin'
    })
    
    if (task.trade_user_id !== user.id && userData?.department !== 'admin') {
      console.log('Access denied for task')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    
    // Get progress entries
    const { data: progress, error: progressError } = await supabase
      .from('sourcing_progress')
      .select(`
        id,
        description,
        created_at,
        manufacturer_name,
        supplier_name,
        quote_price,
        quote_currency,
        quote_lead_time,
        supplier_id,
        has_gmp,
        has_dmf,
        has_cep,
        has_iso,
        certificate_notes,
        user_id,
        user:user_id (
          name
        )
      `)
      .eq('sourcing_task_id', taskId)
      .order('created_at', { ascending: true })
    
    if (progressError) throw progressError
    
    // Get files attached to progress entries
    let files: any[] = []
    if (progress && progress.length > 0) {
      const { data: progressFiles } = await supabase
        .from('files')
        .select('*')
        .eq('entity_type', 'sourcing_progress')
        .in('entity_id', progress.map(p => p.id))
      
      if (progressFiles) {
        files = [...files, ...progressFiles]
      }
    }
    
    // Get files attached to sourcing request
    const { data: requestFiles } = await supabase
      .from('files')
      .select('*')
      .eq('entity_type', 'sourcing_request')
      .eq('entity_id', (task.sourcing_request as any).id)
    
    if (requestFiles) {
      files = [...files, ...requestFiles]
    }
    
    // Transform the data
    const transformedTask = {
      id: task.id,
      status: task.status,
      assigned_at: task.assigned_at,
      trade_user_id: task.trade_user_id,
      quote_status: task.quote_status,
      quote_sent_at: task.quote_sent_at,
      quote_response_at: task.quote_response_at,
      quote_notes: task.quote_notes,
      sourcing_request: task.sourcing_request,
      progress: progress || [],
      files: files || []
    }
    
    return NextResponse.json(transformedTask)
  } catch (error: any) {
    console.error('Task detail fetch error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}