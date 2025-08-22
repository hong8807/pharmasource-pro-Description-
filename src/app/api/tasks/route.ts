import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
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
  
  try {
    // Get unassigned tasks with debug logging
    console.log('Fetching unassigned tasks for user:', user.email)
    
    // First, let's check if there are any sourcing_tasks at all
    const { data: allTasks, error: allTasksError } = await supabase
      .from('sourcing_tasks')
      .select('*')
    
    console.log('All tasks in DB:', allTasks)
    
    const { data: unassignedTasks, error: unassignedError } = await supabase
      .from('sourcing_tasks')
      .select(`
        id,
        status,
        assigned_at,
        sourcing_request:sourcing_request_id (
          id,
          product_name,
          client_name,
          usage_amount,
          requirements,
          created_at,
          sales_user:sales_user_id (
            name,
            email
          )
        )
      `)
      .eq('status', 'unassigned')
      .order('created_at', { ascending: true })
    
    console.log('Unassigned tasks query result:', { data: unassignedTasks, error: unassignedError })
    
    if (unassignedError) throw unassignedError
    
    // Get my tasks (including completed)
    const { data: myTasks, error: myTasksError } = await supabase
      .from('sourcing_tasks')
      .select(`
        id,
        status,
        assigned_at,
        completed_at,
        sourcing_request:sourcing_requests!inner (
          id,
          product_name,
          client_name,
          usage_amount,
          requirements,
          created_at,
          sales_user:users!sourcing_requests_sales_user_id_fkey (
            name,
            email
          )
        )
      `)
      .eq('trade_user_id', user.id)
      .order('assigned_at', { ascending: false })
    
    if (myTasksError) throw myTasksError
    
    // Transform the data structure
    const transformTasks = (tasks: any[]) => {
      return tasks.map(task => ({
        id: task.id,
        status: task.status,
        assigned_at: task.assigned_at,
        completed_at: task.completed_at,
        sourcing_request: {
          id: task.sourcing_request.id,
          product_name: task.sourcing_request.product_name,
          client_name: task.sourcing_request.client_name,
          usage_amount: task.sourcing_request.usage_amount,
          requirements: task.sourcing_request.requirements,
          created_at: task.sourcing_request.created_at,
          sales_user: task.sourcing_request.sales_user
        }
      }))
    }
    
    return NextResponse.json({
      unassigned: transformTasks(unassignedTasks || []),
      myTasks: transformTasks(myTasks || [])
    })
  } catch (error: any) {
    console.error('Tasks fetch error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}