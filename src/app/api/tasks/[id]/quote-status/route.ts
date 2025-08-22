import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }
  
  const taskId = parseInt(params.id)
  const { quote_status, quote_notes } = await request.json()
  
  if (!quote_status) {
    return NextResponse.json({ error: 'Quote status is required' }, { status: 400 })
  }
  
  try {
    // Verify this is the assigned trade user or sales user who owns the request
    const { data: task, error: taskError } = await supabase
      .from('sourcing_tasks')
      .select(`
        id,
        trade_user_id,
        sourcing_request:sourcing_request_id (
          sales_user_id
        )
      `)
      .eq('id', taskId)
      .single()
    
    if (taskError || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }
    
    // Check authorization
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('department')
      .eq('id', user.id)
      .single()
    
    const isTradeUser = task.trade_user_id === user.id
    const isSalesUser = (task.sourcing_request as any)?.sales_user_id === user.id
    const isAdmin = userData?.department === 'admin'
    
    if (!isTradeUser && !isSalesUser && !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    
    // Update quote status
    const updateData: any = {
      quote_status,
      quote_notes
    }
    
    // Set timestamps based on status
    if (quote_status === 'sent' && !(task as any).quote_sent_at) {
      updateData.quote_sent_at = new Date().toISOString()
    } else if (['accepted', 'rejected', 'expired'].includes(quote_status)) {
      updateData.quote_response_at = new Date().toISOString()
    }
    
    const { data: updatedTask, error: updateError } = await supabase
      .from('sourcing_tasks')
      .update(updateData)
      .eq('id', taskId)
      .select()
      .single()
    
    if (updateError) throw updateError
    
    // Add progress entry for the status change
    const statusMessages = {
      sent: '견적서가 발송되었습니다.',
      accepted: '견적이 승인되었습니다.',
      rejected: '견적이 거절되었습니다.',
      expired: '견적이 만료되었습니다.'
    }
    
    const message = statusMessages[quote_status as keyof typeof statusMessages]
    if (message) {
      await supabase
        .from('sourcing_progress')
        .insert({
          sourcing_task_id: taskId,
          user_id: user.id,
          description: `${message}${quote_notes ? ` (참고: ${quote_notes})` : ''}`
        })
    }
    
    return NextResponse.json({ data: updatedTask })
  } catch (error: any) {
    console.error('Quote status update error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}