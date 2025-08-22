import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// Response type for autocomplete
interface AutocompleteItem {
  id: number
  name: string
  cas_number?: string
  normalized_name: string
  similarity_score: number
  search_count?: number
  type: 'product' | 'cas' | 'supplier'
}

interface AutocompleteResponse {
  suggestions: AutocompleteItem[]
  query: string
  response_time: number
  total_count: number
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')?.trim() || ''
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 20)
    
    // Validate query length
    if (!query || query.length < 2) {
      return NextResponse.json({
        suggestions: [],
        query,
        response_time: Date.now() - startTime,
        total_count: 0
      } as AutocompleteResponse)
    }

    const supabase = createClient()
    const suggestions: AutocompleteItem[] = []
    
    // Normalize query for search
    const normalizedQuery = query.toLowerCase().trim()
    
    // 1. PostgreSQL Full-Text Search with pg_trgm similarity
    // Search products with normalized name and similarity scoring
    const { data: productResults, error: productError } = await supabase
      .rpc('search_products_autocomplete', {
        search_query: normalizedQuery,
        result_limit: Math.min(limit, 8)
      })
    
    if (productError) {
      console.error('Product autocomplete error:', productError)
    } else if (productResults) {
      suggestions.push(...productResults.map((item: any) => ({
        id: item.id,
        name: item.name,
        cas_number: item.cas_no,
        normalized_name: item.normalized_name,
        similarity_score: parseFloat(item.similarity_score || '0'),
        search_count: item.search_count || 0,
        type: 'product' as const
      })))
    }
    
    // 2. CAS number exact and similarity matching
    if (suggestions.length < limit) {
      const remainingLimit = limit - suggestions.length
      const { data: casResults, error: casError } = await supabase
        .from('products')
        .select('id, name, cas_no, normalized_name, search_count')
        .not('cas_no', 'is', null)
        .or(`cas_no.ilike.%${query}%,cas_no.eq.${query}`)
        .order('search_count', { ascending: false })
        .limit(Math.min(remainingLimit, 3))
      
      if (!casError && casResults) {
        suggestions.push(...casResults.map(item => ({
          id: item.id,
          name: item.name,
          cas_number: item.cas_no,
          normalized_name: item.normalized_name || item.name.toLowerCase(),
          similarity_score: item.cas_no === query ? 1.0 : 0.8,
          search_count: item.search_count || 0,
          type: 'cas' as const
        })))
      }
    }
    
    // 3. Update search statistics asynchronously (fire and forget)
    if (suggestions.length > 0) {
      // Don't await this to avoid slowing down the response
      const updateStats = async () => {
        try {
          await supabase.rpc('increment_search_count', { 
            search_term: query,
            product_ids: suggestions.map(s => s.id)
          })
        } catch (error) {
          console.log('Search stats update failed:', error)
        }
      }
      updateStats()
    }
    
    // Sort by relevance: exact matches first, then similarity score, then search count
    const sortedSuggestions = suggestions
      .sort((a, b) => {
        // Exact match gets highest priority
        const aExact = a.name.toLowerCase() === normalizedQuery || a.cas_number === query
        const bExact = b.name.toLowerCase() === normalizedQuery || b.cas_number === query
        
        if (aExact && !bExact) return -1
        if (!aExact && bExact) return 1
        
        // Then by similarity score
        if (Math.abs(a.similarity_score - b.similarity_score) > 0.1) {
          return b.similarity_score - a.similarity_score
        }
        
        // Finally by search popularity
        return (b.search_count || 0) - (a.search_count || 0)
      })
      .slice(0, limit)
    
    const responseTime = Date.now() - startTime
    
    // Set cache headers for performance
    const response = NextResponse.json({
      suggestions: sortedSuggestions,
      query,
      response_time: responseTime,
      total_count: sortedSuggestions.length
    } as AutocompleteResponse)
    
    // Cache for 5 minutes for popular queries
    response.headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=60')
    
    return response
    
  } catch (error) {
    console.error('Autocomplete API error:', error)
    
    return NextResponse.json({
      suggestions: [],
      query: '',
      response_time: Date.now() - startTime,
      total_count: 0,
      error: 'Autocomplete service temporarily unavailable'
    } as AutocompleteResponse & { error: string }, { status: 500 })
  }
}

// HEAD method for health checks
export async function HEAD() {
  return new Response(null, { 
    status: 200,
    headers: {
      'Cache-Control': 'no-cache'
    }
  })
}