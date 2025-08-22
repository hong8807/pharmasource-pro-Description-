import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const country = searchParams.get('country') || ''
    const type = searchParams.get('type') || ''
    const search = searchParams.get('search') || ''
    
    // Calculate offset for pagination
    const offset = (page - 1) * limit
    
    // Build query
    let query = supabase
      .from('suppliers')
      .select(`
        id,
        name,
        supplier_type,
        country,
        address,
        telephone,
        email,
        website,
        supplier_url,
        product_id,
        products!inner(
          id,
          name,
          cas_no
        )
      `, { count: 'exact' })
    
    // Apply filters
    if (country) {
      query = query.eq('country', country)
    }
    
    if (type) {
      query = query.eq('supplier_type', type)
    }
    
    if (search) {
      query = query.or(`name.ilike.%${search}%,products.name.ilike.%${search}%`)
    }
    
    // Apply sorting and pagination
    query = query
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1)
    
    const { data, error, count } = await query
    
    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch suppliers' },
        { status: 500 }
      )
    }
    
    // Format response
    const suppliersWithProducts = data?.map(supplier => ({
      id: supplier.id,
      name: supplier.name,
      supplier_type: supplier.supplier_type,
      country: supplier.country,
      address: supplier.address,
      telephone: supplier.telephone,
      email: supplier.email,
      website: supplier.website,
      supplier_url: supplier.supplier_url,
      product: supplier.products
    })) || []
    
    return NextResponse.json({
      data: suppliersWithProducts,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}