import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Product = {
  id: number
  name: string
  cas_no: string | null
  product_url: string | null
  created_at: string
}

export type Supplier = {
  id: number
  product_id: number
  name: string
  supplier_type: 'Manufacturer' | 'Trader' | null
  country: string | null
  address: string | null
  telephone: string | null
  email: string | null
  website: string | null
  supplier_url: string | null
  created_at: string
}

export type ProductWithSuppliers = Product & {
  suppliers: Supplier[]
}