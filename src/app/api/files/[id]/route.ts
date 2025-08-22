import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }
  
  try {
    // Get file metadata
    const { data: fileData, error: fileError } = await supabase
      .from('files')
      .select('*')
      .eq('id', params.id)
      .single()
    
    if (fileError || !fileData) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }
    
    // Check if user has permission to delete this file
    // Only the uploader or admin can delete
    const { data: userData } = await supabase
      .from('users')
      .select('department')
      .eq('id', user.id)
      .single()
    
    if (fileData.uploaded_by !== user.id && userData?.department !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    
    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('sourcing-files')
      .remove([fileData.storage_path])
    
    if (storageError) {
      console.error('Storage deletion error:', storageError)
    }
    
    // Delete from database
    const { error: dbError } = await supabase
      .from('files')
      .delete()
      .eq('id', params.id)
    
    if (dbError) throw dbError
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('File deletion error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}