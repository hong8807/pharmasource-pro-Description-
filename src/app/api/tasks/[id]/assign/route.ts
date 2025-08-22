import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }
  
  // Check if user is from trade department
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
    // Check if task is unassigned
    const { data: task, error: taskError } = await supabase
      .from('sourcing_tasks')
      .select('status')
      .eq('id', taskId)
      .single()
    
    if (taskError || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }
    
    if (task.status !== 'unassigned') {
      return NextResponse.json({ error: 'Task is already assigned' }, { status: 400 })
    }
    
    // Assign task to user
    const { data: updatedTask, error: updateError } = await supabase
      .from('sourcing_tasks')
      .update({
        trade_user_id: user.id,
        status: 'assigned',
        assigned_at: new Date().toISOString()
      })
      .eq('id', taskId)
      .select()
      .single()
    
    if (updateError) throw updateError
    
    // Also update the sourcing request status
    const { error: requestError } = await supabase
      .from('sourcing_requests')
      .update({ status: 'assigned' })
      .eq('id', updatedTask.sourcing_request_id)
    
    if (requestError) throw requestError
    
    return NextResponse.json({ data: updatedTask })
  } catch (error: any) {
    console.error('Task assignment error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}