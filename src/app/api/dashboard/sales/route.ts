import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
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
  
  try {
    // First get sourcing requests
    const { data: requests, error: requestsError } = await supabase
      .from('sourcing_requests')
      .select('*')
      .eq('sales_user_id', user.id)
    
    if (requestsError) throw requestsError
    
    // Then get tasks for these requests
    const requestIds = requests?.map(r => r.id) || []
    console.log('Request IDs:', requestIds)
    
    const { data: tasks, error: tasksError } = await supabase
      .from('sourcing_tasks')
      .select('*')
      .in('sourcing_request_id', requestIds)
    
    console.log('Tasks query result:', { tasks, tasksError })
    
    if (tasksError) throw tasksError
    
    // Map tasks to requests
    const tasksMap = new Map()
    tasks?.forEach(task => {
      console.log(`Mapping task ${task.id} to request ${task.sourcing_request_id}`)
      tasksMap.set(task.sourcing_request_id, task)
    })
    
    // Add tasks to requests
    const requestsWithTasks = requests?.map(req => ({
      ...req,
      sourcing_tasks: tasksMap.has(req.id) ? [tasksMap.get(req.id)] : []
    })) || []
    
    // Count by status
    const stats = {
      pending: 0,
      in_progress: 0,
      completed: 0,
      total: requests?.length || 0
    }
    
    console.log('Sales dashboard - requestsWithTasks:', JSON.stringify(requestsWithTasks, null, 2))
    
    requestsWithTasks.forEach(req => {
      // Check task status first, then fall back to request status
      const taskStatus = req.sourcing_tasks?.[0]?.status || req.status
      console.log(`Request ${req.id}: sourcing_tasks = ${JSON.stringify(req.sourcing_tasks)}, task status = ${taskStatus}, request status = ${req.status}`)
      
      if (taskStatus === 'pending' || taskStatus === 'unassigned' || taskStatus === 'assigned') {
        stats.pending++
      } else if (taskStatus === 'in_progress') {
        stats.in_progress++
      } else if (taskStatus === 'completed') {
        stats.completed++
      }
    })
    
    // Get recent completed sourcing requests
    const { data: recentCompleted, error: recentError } = await supabase
      .from('sourcing_requests')
      .select(`
        id,
        product_name,
        client_name,
        status,
        updated_at,
        sourcing_tasks (
          status,
          completed_at
        )
      `)
      .eq('sales_user_id', user.id)
      .order('updated_at', { ascending: false })
    
    // Filter for completed tasks
    const completedRequests = recentCompleted?.filter(req => 
      req.sourcing_tasks?.[0]?.status === 'completed'
    ).slice(0, 5).map(req => ({
      ...req,
      completed_at: req.sourcing_tasks?.[0]?.completed_at || req.updated_at
    }))
    
    if (recentError) throw recentError
    
    return NextResponse.json({
      stats,
      recentCompleted: completedRequests || []
    })
  } catch (error: any) {
    console.error('Dashboard error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}