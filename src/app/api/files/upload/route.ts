import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }
  
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const entityType = formData.get('entity_type') as string
    const entityId = formData.get('entity_id') as string
    
    if (!file || !entityType || !entityId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    
    // Generate unique file name
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const storagePath = `${entityType}/${entityId}/${fileName}`
    
    // Upload to Supabase Storage
    const { data: storageData, error: storageError } = await supabase.storage
      .from('sourcing-files')
      .upload(storagePath, file)
    
    if (storageError) {
      throw storageError
    }
    
    // Save file metadata to database
    const { data: fileData, error: fileError } = await supabase
      .from('files')
      .insert({
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        storage_path: storagePath,
        uploaded_by: user.id,
        entity_type: entityType,
        entity_id: parseInt(entityId)
      })
      .select()
      .single()
    
    if (fileError) {
      // Clean up uploaded file if database insert fails
      await supabase.storage
        .from('sourcing-files')
        .remove([storagePath])
      throw fileError
    }
    
    return NextResponse.json({ data: fileData })
  } catch (error: any) {
    console.error('File upload error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}