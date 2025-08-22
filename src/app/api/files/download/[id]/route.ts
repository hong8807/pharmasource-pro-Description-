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
    
    // Download file from storage
    const { data, error } = await supabase.storage
      .from('sourcing-files')
      .download(fileData.storage_path)
    
    if (error) {
      console.error('Storage download error:', error)
      return NextResponse.json({ error: 'Failed to download file' }, { status: 500 })
    }
    
    // Return file with appropriate headers
    const headers = new Headers()
    headers.set('Content-Type', fileData.file_type || 'application/octet-stream')
    
    // Encode filename for Unicode support
    const encodedFilename = encodeURIComponent(fileData.file_name)
    headers.set('Content-Disposition', `attachment; filename*=UTF-8''${encodedFilename}`)
    
    return new NextResponse(data, { headers })
  } catch (error: any) {
    console.error('File download error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}