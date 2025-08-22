export interface Product {
  id: number
  name: string
  cas_no: string | null
  product_url: string | null
  created_at: string
  supplier_count?: number
  countries?: string[]
  manufacturer_count?: number
  trader_count?: number
  suppliers?: Supplier[]
}

export interface Supplier {
  id: number
  product_id: number
  name: string
  supplier_type: 'Manufacturer' | 'Trader' | 'Unknown' | null
  country: string | null
  address: string | null
  telephone: string | null
  email: string | null
  website: string | null
  supplier_url: string | null
  created_at: string
  data_source?: string
  verified?: boolean
  product?: {
    id: number
    name: string
    cas_no: string | null
  }
}

export interface SearchResult {
  products: Product[]
  suppliers: Supplier[]
  total: number
  productCount?: number
  supplierCount?: number
}

export interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}