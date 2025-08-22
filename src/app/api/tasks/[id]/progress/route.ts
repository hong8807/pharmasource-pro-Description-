import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }
  
  // Check if user is from trade department, sales department or admin
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('department')
    .eq('id', user.id)
    .single()
  
  if (userError || (!['trade', 'sales', 'admin'].includes(userData?.department))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  
  const taskId = parseInt(params.id)
  const { 
    description,
    manufacturer_name,
    quote_price,
    quote_currency,
    quote_lead_time,
    supplier_id,
    has_gmp,
    has_dmf,
    has_cep,
    has_iso,
    certificate_notes,
    supplier_name
  } = await request.json()
  
  if (!description || !description.trim()) {
    return NextResponse.json({ error: 'Description is required' }, { status: 400 })
  }
  
  try {
    // Verify user has access to this task
    const { data: task, error: taskError } = await supabase
      .from('sourcing_tasks')
      .select('trade_user_id, sourcing_request_id')
      .eq('id', taskId)
      .single()
    
    if (taskError || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }
    
    // Allow trade user assigned to task, admin, or sales users (for their own requests)
    if (userData?.department === 'sales') {
      // Check if this is the sales user's own request
      const { data: sourcingRequest } = await supabase
        .from('sourcing_requests')
        .select('sales_user_id')
        .eq('id', task.sourcing_request_id)
        .single()
      
      if (!sourcingRequest || sourcingRequest.sales_user_id !== user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
    } else if (task.trade_user_id !== user.id && userData?.department !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    
    // Add progress entry
    const progressData: any = {
      sourcing_task_id: taskId,
      user_id: user.id,
      description: description.trim()
    }
    
    // Add optional quote fields if provided
    if (manufacturer_name) {
      progressData.manufacturer_name = manufacturer_name
      // If supplier_name is not provided, use manufacturer_name
      progressData.supplier_name = supplier_name || manufacturer_name
    }
    if (quote_price !== undefined && quote_price !== null && quote_price !== '') {
      progressData.quote_price = parseFloat(quote_price)
    }
    if (quote_currency) progressData.quote_currency = quote_currency
    if (quote_lead_time) progressData.quote_lead_time = quote_lead_time
    if (supplier_id) progressData.supplier_id = parseInt(supplier_id)
    if (has_gmp !== undefined) progressData.has_gmp = has_gmp
    if (has_dmf !== undefined) progressData.has_dmf = has_dmf
    if (has_cep !== undefined) progressData.has_cep = has_cep
    if (has_iso !== undefined) progressData.has_iso = has_iso
    if (certificate_notes) progressData.certificate_notes = certificate_notes
    
    const { data: progress, error: progressError } = await supabase
      .from('sourcing_progress')
      .insert(progressData)
      .select()
      .single()
    
    if (progressError) {
      console.error('Database error:', progressError)
      console.error('Progress data:', progressData)
      throw progressError
    }
    
    return NextResponse.json(progress)
  } catch (error: any) {
    console.error('Progress creation error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}