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
  
  const progressId = parseInt(params.id)
  const updates = await request.json()
  
  try {
    // Verify ownership
    const { data: existingProgress, error: fetchError } = await supabase
      .from('sourcing_progress')
      .select('user_id')
      .eq('id', progressId)
      .single()
    
    if (fetchError || !existingProgress) {
      return NextResponse.json({ error: 'Progress not found' }, { status: 404 })
    }
    
    if (existingProgress.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    
    // Prepare update data
    const updateData: any = {}
    
    // Always update description if provided
    if (updates.description !== undefined) {
      updateData.description = updates.description
    }
    
    // Update quote fields if provided
    if (updates.manufacturer_name !== undefined) updateData.manufacturer_name = updates.manufacturer_name
    if (updates.supplier_name !== undefined) updateData.supplier_name = updates.supplier_name
    if (updates.quote_currency !== undefined) updateData.quote_currency = updates.quote_currency
    if (updates.quote_lead_time !== undefined) updateData.quote_lead_time = updates.quote_lead_time
    if (updates.has_gmp !== undefined) updateData.has_gmp = updates.has_gmp
    if (updates.has_dmf !== undefined) updateData.has_dmf = updates.has_dmf
    if (updates.has_cep !== undefined) updateData.has_cep = updates.has_cep
    if (updates.has_iso !== undefined) updateData.has_iso = updates.has_iso
    if (updates.certificate_notes !== undefined) updateData.certificate_notes = updates.certificate_notes
    
    // Handle quote_price conversion
    if (updates.quote_price !== undefined) {
      if (updates.quote_price === null || updates.quote_price === '') {
        updateData.quote_price = null
      } else {
        updateData.quote_price = parseFloat(updates.quote_price)
      }
    }
    
    // Update progress
    const { data, error } = await supabase
      .from('sourcing_progress')
      .update(updateData)
      .eq('id', progressId)
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Progress update error:', error)
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
  
  const progressId = parseInt(params.id)
  
  console.log('Delete request for progress ID:', progressId)
  console.log('Current user ID:', user.id)
  
  try {
    // Verify ownership
    const { data: existingProgress, error: fetchError } = await supabase
      .from('sourcing_progress')
      .select('user_id')
      .eq('id', progressId)
      .single()
    
    console.log('Existing progress:', existingProgress)
    console.log('Fetch error:', fetchError)
    
    if (fetchError || !existingProgress) {
      return NextResponse.json({ error: 'Progress not found' }, { status: 404 })
    }
    
    console.log('Progress user_id:', existingProgress.user_id)
    console.log('Current user_id:', user.id)
    console.log('Are they equal?', existingProgress.user_id === user.id)
    
    if (existingProgress.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    
    // Delete associated files first
    const { data: files, error: filesError } = await supabase
      .from('files')
      .select('storage_path')
      .eq('entity_type', 'sourcing_progress')
      .eq('entity_id', progressId)
    
    if (!filesError && files && files.length > 0) {
      // Delete files from storage
      const filePaths = files.map(f => f.storage_path)
      await supabase.storage
        .from('sourcing-files')
        .remove(filePaths)
      
      // Delete file records
      await supabase
        .from('files')
        .delete()
        .eq('entity_type', 'sourcing_progress')
        .eq('entity_id', progressId)
    }
    
    // Delete progress
    const { error } = await supabase
      .from('sourcing_progress')
      .delete()
      .eq('id', progressId)
    
    if (error) throw error
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Progress delete error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}