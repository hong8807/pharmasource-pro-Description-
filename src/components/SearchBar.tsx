'use client'

import { useState, useEffect } from 'react'

interface SearchBarProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  onSearch: () => void
  loading: boolean
  searchType?: 'all' | 'product' | 'cas' | 'supplier'
  onSearchTypeChange?: (type: 'all' | 'product' | 'cas' | 'supplier') => void
}

interface Suggestion {
  type: string
  value: string
  label: string
}

export default function SearchBar({ 
  searchTerm, 
  onSearchChange, 
  onSearch, 
  loading,
  searchType = 'all',
  onSearchTypeChange 
}: SearchBarProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchTerm.length < 2) {
        setSuggestions([])
        return
      }

      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(searchTerm)}&type=${searchType}`)
        const data = await response.json()
        setSuggestions(data.suggestions || [])
      } catch (error) {
        console.error('Failed to fetch suggestions:', error)
      }
    }

    const debounceTimer = setTimeout(fetchSuggestions, 300)
    return () => clearTimeout(debounceTimer)
  }, [searchTerm, searchType])

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        onSearchChange(suggestions[selectedIndex].value)
        setShowSuggestions(false)
      } else {
        onSearch()
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => Math.max(prev - 1, -1))
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  const handleSuggestionClick = (suggestion: Suggestion) => {
    onSearchChange(suggestion.value)
    setShowSuggestions(false)
    onSearch()
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex flex-col gap-4">
        <div className="flex gap-2">
          <button
            onClick={() => onSearchTypeChange?.('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              searchType === 'all' 
                ? 'bg-primary-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            전체
          </button>
          <button
            onClick={() => onSearchTypeChange?.('product')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              searchType === 'product' 
                ? 'bg-primary-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            제품명
          </button>
          <button
            onClick={() => onSearchTypeChange?.('cas')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              searchType === 'cas' 
                ? 'bg-primary-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            CAS 번호
          </button>
          <button
            onClick={() => onSearchTypeChange?.('supplier')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              searchType === 'supplier' 
                ? 'bg-primary-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            공급업체
          </button>
        </div>
        
        <div className="relative flex gap-4">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                onSearchChange(e.target.value)
                setShowSuggestions(true)
                setSelectedIndex(-1)
              }}
              onKeyDown={handleKeyPress}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder={
                searchType === 'all' ? "제품명, CAS 번호 또는 공급업체명으로 검색..." :
                searchType === 'product' ? "제품명으로 검색..." :
                searchType === 'cas' ? "CAS 번호로 검색..." :
                "공급업체명으로 검색..."
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className={`px-4 py-3 cursor-pointer transition-colors ${
                      index === selectedIndex ? 'bg-purple-50 border-l-4 border-purple-500' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-sm font-medium text-gray-900">
                      {suggestion.value}
                    </div>
                    <div className="text-xs text-gray-600 mt-0.5">
                      {suggestion.type === 'product' && '제품명'}
                      {suggestion.type === 'cas' && 'CAS 번호'}
                      {suggestion.type === 'supplier' && '공급업체'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <button
            onClick={onSearch}
            disabled={loading}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '검색 중...' : '검색'}
          </button>
        </div>
      </div>
    </div>
  )
}