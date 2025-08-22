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
  
  const requestId = parseInt(params.id)
  
  try {
    // Get sourcing request with task and progress
    const { data: sourcingRequest, error: requestError } = await supabase
      .from('sourcing_requests')
      .select(`
        *,
        sales_user:sales_user_id (
          id,
          name,
          email,
          department
        ),
        sourcing_tasks (
          id,
          status,
          assigned_at,
          completed_at,
          trade_user:trade_user_id (
            id,
            name,
            email,
            department
          )
        )
      `)
      .eq('id', requestId)
      .eq('sales_user_id', user.id)
      .single()
    
    if (requestError || !sourcingRequest) {
      return NextResponse.json({ error: 'Sourcing request not found' }, { status: 404 })
    }
    
    // Get progress if task exists
    let progress: any[] = []
    let files: any[] = []
    if (sourcingRequest.sourcing_tasks?.[0]) {
      const taskId = sourcingRequest.sourcing_tasks[0].id
      
      const { data: progressData, error: progressError } = await supabase
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
          has_gmp,
          has_dmf,
          has_cep,
          has_iso,
          certificate_notes,
          user:user_id (
            name
          )
        `)
        .eq('sourcing_task_id', taskId)
        .order('created_at', { ascending: true })
      
      if (!progressError && progressData) {
        progress = progressData
        
        // Get files attached to progress entries
        const progressIds = progressData.map(p => p.id)
        if (progressIds.length > 0) {
          const { data: filesData } = await supabase
            .from('files')
            .select('*')
            .eq('entity_type', 'sourcing_progress')
            .in('entity_id', progressIds)
          
          if (filesData) {
            files = filesData
          }
        }
      }
    }
    
    // Get files attached to sourcing request
    const { data: requestFiles } = await supabase
      .from('files')
      .select('*')
      .eq('entity_type', 'sourcing_request')
      .eq('entity_id', requestId)
    
    if (requestFiles) {
      files = [...files, ...requestFiles]
    }
    
    // Get client quote status if exists
    const { data: clientQuoteStatus } = await supabase
      .from('client_quote_status')
      .select('*')
      .eq('sourcing_request_id', requestId)
      .single()
    
    return NextResponse.json({
      ...sourcingRequest,
      progress,
      files,
      client_quote_status: clientQuoteStatus
    })
  } catch (error: any) {
    console.error('Sourcing request detail error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }
  
  const requestId = parseInt(params.id)
  const updates = await request.json()
  
  try {
    // Verify ownership
    const { data: existingRequest, error: fetchError } = await supabase
      .from('sourcing_requests')
      .select('sales_user_id')
      .eq('id', requestId)
      .single()
    
    if (fetchError || !existingRequest) {
      return NextResponse.json({ error: 'Sourcing request not found' }, { status: 404 })
    }
    
    if (existingRequest.sales_user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    
    // Update request
    const { data, error } = await supabase
      .from('sourcing_requests')
      .update({
        product_name: updates.product_name,
        client_name: updates.client_name,
        usage_amount: updates.usage_amount,
        existing_manufacturer: updates.existing_manufacturer,
        requirements: updates.requirements,
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId)
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Update error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }
  
  const requestId = parseInt(params.id)
  console.log('DELETE 요청 시작:', { requestId, userId: user.id })
  
  try {
    // RLS 무한 재귀를 피하기 위해 함수 사용
    const { data, error } = await supabase
      .rpc('delete_sourcing_request', { p_request_id: requestId })
    
    if (error) {
      console.error('Delete function error:', error)
      throw error
    }
    
    if (!data) {
      return NextResponse.json({ error: 'Unauthorized or request not found' }, { status: 403 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}