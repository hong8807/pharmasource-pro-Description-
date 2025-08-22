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
    const search = searchParams.get('search') || ''
    const sortBy = searchParams.get('sortBy') || 'name'
    const sortOrder = searchParams.get('sortOrder') || 'asc'
    
    // Calculate offset for pagination
    const offset = (page - 1) * limit
    
    // Build query
    let query = supabase
      .from('products')
      .select(`
        id,
        name,
        cas_no,
        product_url,
        created_at,
        suppliers!inner(
          id,
          name,
          supplier_type,
          country
        )
      `, { count: 'exact' })
    
    // Apply search filter if provided
    if (search) {
      query = query.or(`name.ilike.%${search}%,cas_no.ilike.%${search}%`)
    }
    
    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })
    
    // Apply pagination
    query = query.range(offset, offset + limit - 1)
    
    const { data, error, count } = await query
    
    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch products' },
        { status: 500 }
      )
    }
    
    // Group suppliers by product
    const productsWithSuppliers = data?.map(product => {
      const suppliers = product.suppliers || []
      const supplierCountries = Array.from(new Set(suppliers.map(s => s.country).filter(Boolean)))
      const manufacturerCount = suppliers.filter(s => s.supplier_type === 'Manufacturer').length
      const traderCount = suppliers.filter(s => s.supplier_type === 'Trader').length
      
      return {
        id: product.id,
        name: product.name,
        cas_no: product.cas_no,
        product_url: product.product_url,
        created_at: product.created_at,
        supplier_count: suppliers.length,
        countries: supplierCountries,
        manufacturer_count: manufacturerCount,
        trader_count: traderCount
      }
    }) || []
    
    return NextResponse.json({
      data: productsWithSuppliers,
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