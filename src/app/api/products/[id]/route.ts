import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productId = params.id
    
    // Fetch product with suppliers
    const { data: product, error: productError } = await supabase
      .from('products')
      .select(`
        id,
        name,
        cas_no,
        product_url,
        created_at
      `)
      .eq('id', productId)
      .single()
    
    if (productError) {
      if (productError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        )
      }
      throw productError
    }
    
    // Fetch suppliers for this product
    const { data: suppliers, error: suppliersError } = await supabase
      .from('suppliers')
      .select('*')
      .eq('product_id', productId)
      .order('name')
    
    if (suppliersError) {
      throw suppliersError
    }
    
    // Group suppliers by country
    const suppliersByCountry = suppliers?.reduce((acc, supplier) => {
      const country = supplier.country || 'Unknown'
      if (!acc[country]) {
        acc[country] = []
      }
      acc[country].push(supplier)
      return acc
    }, {} as Record<string, any[]>) || {}
    
    // Calculate statistics
    const stats = {
      total_suppliers: suppliers?.length || 0,
      manufacturers: suppliers?.filter(s => s.supplier_type === 'Manufacturer').length || 0,
      traders: suppliers?.filter(s => s.supplier_type === 'Trader').length || 0,
      countries: Object.keys(suppliersByCountry).length
    }
    
    return NextResponse.json({
      product,
      suppliers,
      suppliersByCountry,
      stats
    })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}