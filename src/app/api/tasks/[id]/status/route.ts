import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  
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
  const { status } = await request.json()
  
  const validStatuses = ['assigned', 'in_progress', 'completed']
  if (!status || !validStatuses.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }
  
  try {
    // Verify user has access to this task
    const { data: task, error: taskError } = await supabase
      .from('sourcing_tasks')
      .select('trade_user_id, sourcing_request_id, status')
      .eq('id', taskId)
      .single()
    
    if (taskError || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }
    
    if (task.trade_user_id !== user.id && userData?.department !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    
    // Update task status
    const updateData: any = { status }
    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString()
    }
    
    const { data: updatedTask, error: updateError } = await supabase
      .from('sourcing_tasks')
      .update(updateData)
      .eq('id', taskId)
      .select()
      .single()
    
    if (updateError) throw updateError
    
    // Update sourcing request status based on task status
    let requestStatus = 'assigned'
    if (status === 'in_progress') requestStatus = 'in_progress'
    if (status === 'completed') requestStatus = 'completed'
    
    const { error: requestError } = await supabase
      .from('sourcing_requests')
      .update({ status: requestStatus })
      .eq('id', task.sourcing_request_id)
    
    if (requestError) throw requestError
    
    // Add automatic progress entry for status changes
    const progressMap = {
      'in_progress': 'TASK 진행을 시작했습니다.',
      'completed': 'TASK를 완료했습니다.'
    }
    
    if (progressMap[status as keyof typeof progressMap]) {
      await supabase
        .from('sourcing_progress')
        .insert({
          sourcing_task_id: taskId,
          user_id: user.id,
          description: progressMap[status as keyof typeof progressMap]
        })
    }
    
    return NextResponse.json({ data: updatedTask })
  } catch (error: any) {
    console.error('Status update error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}