'use client'

import { useState } from 'react'
import { X, Filter, ChevronDown, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FilterPanelProps {
  countries: string[]
  selectedCountry: string
  selectedSupplierType: 'all' | 'Manufacturer' | 'Trader'
  onCountryChange: (country: string) => void
  onSupplierTypeChange: (type: 'all' | 'Manufacturer' | 'Trader') => void
}

// 공급업체 유형 옵션
const supplierTypes = [
  { value: 'all', label: '전체', icon: '🌐' },
  { value: 'Manufacturer', label: '제조사', icon: '🏭' },
  { value: 'Trader', label: '무역업체', icon: '📦' }
] as const

export default function FilterPanel({
  countries,
  selectedCountry,
  selectedSupplierType,
  onCountryChange,
  onSupplierTypeChange
}: FilterPanelProps) {
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false)
  const [countrySearch, setCountrySearch] = useState('')
  
  // 국가 검색 필터링
  const filteredCountries = countries.filter(country =>
    country.toLowerCase().includes(countrySearch.toLowerCase())
  )

  // 활성 필터 개수 계산
  const activeFiltersCount = 
    (selectedCountry ? 1 : 0) + 
    (selectedSupplierType !== 'all' ? 1 : 0)

  return (
    <div className="relative">
      {/* 메인 필터 패널 */}
      <div className="relative bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        {/* 배경 장식 */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50/20 via-transparent to-primary-100/20 pointer-events-none" />
        
        {/* 헤더 */}
        <div className="relative px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Filter className="w-5 h-5 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">필터</h3>
              {activeFiltersCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-medium bg-primary-500 text-white rounded-full">
                  {activeFiltersCount}
                </span>
              )}
            </div>
            
            {/* 초기화 버튼 */}
            {activeFiltersCount > 0 && (
              <button
                onClick={() => {
                  onCountryChange('')
                  onSupplierTypeChange('all')
                }}
                className="group flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-primary-600 transition-colors"
              >
                <RotateCcw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" />
                초기화
              </button>
            )}
          </div>
        </div>

        {/* 필터 컨텐츠 */}
        <div className="relative p-6 space-y-6">
          {/* 공급업체 유형 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              공급업체 유형
            </label>
            <div className="grid grid-cols-3 gap-3">
              {supplierTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => onSupplierTypeChange(type.value as 'all' | 'Manufacturer' | 'Trader')}
                  className={cn(
                    "relative group p-3 rounded-xl border-2 transition-all duration-200",
                    "hover:shadow-md hover:-translate-y-0.5",
                    selectedSupplierType === type.value
                      ? "border-primary-500 bg-primary-50 shadow-sm"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  )}
                >
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-2xl">{type.icon}</span>
                    <span className={cn(
                      "text-sm font-medium",
                      selectedSupplierType === type.value
                        ? "text-primary-700"
                        : "text-gray-700"
                    )}>
                      {type.label}
                    </span>
                  </div>
                  
                  {/* 선택 인디케이터 */}
                  {selectedSupplierType === type.value && (
                    <div className="absolute inset-0 rounded-xl border-2 border-primary-500 pointer-events-none">
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary-500 rounded-full animate-pulse" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 국가 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              국가
            </label>
            
            {/* 커스텀 드롭다운 */}
            <div className="relative">
              <button
                onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                className={cn(
                  "w-full px-4 py-3 bg-white border-2 rounded-xl",
                  "flex items-center justify-between",
                  "transition-all duration-200",
                  "hover:border-gray-300 hover:shadow-sm",
                  "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
                  isCountryDropdownOpen
                    ? "border-primary-500 shadow-md"
                    : selectedCountry 
                      ? "border-primary-200 bg-primary-50/50"
                      : "border-gray-200"
                )}
              >
                <span className={cn(
                  "font-medium",
                  selectedCountry ? "text-gray-900" : "text-gray-500"
                )}>
                  {selectedCountry || "전체 국가"}
                </span>
                <ChevronDown className={cn(
                  "w-5 h-5 text-gray-400 transition-transform duration-200",
                  isCountryDropdownOpen && "rotate-180"
                )} />
              </button>

              {/* 드롭다운 메뉴 */}
              {isCountryDropdownOpen && (
                <div className="absolute z-20 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-xl overflow-hidden">
                  {/* 검색 입력 */}
                  <div className="p-3 border-b border-gray-100">
                    <input
                      type="text"
                      placeholder="국가 검색..."
                      value={countrySearch}
                      onChange={(e) => setCountrySearch(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>

                  {/* 국가 목록 */}
                  <div className="max-h-64 overflow-y-auto">
                    <button
                      onClick={() => {
                        onCountryChange('')
                        setIsCountryDropdownOpen(false)
                        setCountrySearch('')
                      }}
                      className={cn(
                        "w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors",
                        !selectedCountry && "bg-primary-50 text-primary-700 font-medium"
                      )}
                    >
                      전체 국가
                    </button>
                    
                    {filteredCountries.map((country) => (
                      <button
                        key={country}
                        onClick={() => {
                          onCountryChange(country)
                          setIsCountryDropdownOpen(false)
                          setCountrySearch('')
                        }}
                        className={cn(
                          "w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors",
                          "flex items-center justify-between",
                          selectedCountry === country && "bg-primary-50 text-primary-700 font-medium"
                        )}
                      >
                        <span>{country}</span>
                        {selectedCountry === country && (
                          <div className="w-2 h-2 bg-primary-500 rounded-full" />
                        )}
                      </button>
                    ))}
                    
                    {filteredCountries.length === 0 && (
                      <div className="px-4 py-8 text-center text-gray-500">
                        검색 결과가 없습니다
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 적용된 필터 태그 */}
          {activeFiltersCount > 0 && (
            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-gray-600">적용된 필터:</span>
                
                {selectedSupplierType !== 'all' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                    {supplierTypes.find(t => t.value === selectedSupplierType)?.icon}
                    {supplierTypes.find(t => t.value === selectedSupplierType)?.label}
                    <button
                      onClick={() => onSupplierTypeChange('all')}
                      className="ml-1 hover:text-primary-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                
                {selectedCountry && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                    🌍 {selectedCountry}
                    <button
                      onClick={() => onCountryChange('')}
                      className="ml-1 hover:text-primary-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 클릭 외부 영역 처리 */}
      {isCountryDropdownOpen && (
        <div 
          className="fixed inset-0 z-10" 
          onClick={() => {
            setIsCountryDropdownOpen(false)
            setCountrySearch('')
          }}
        />
      )}
    </div>
  )
}