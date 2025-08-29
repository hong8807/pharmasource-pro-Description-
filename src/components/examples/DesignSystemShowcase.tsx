'use client'

import React from 'react'
import { BrandButton } from '@/components/ui/BrandButton'
import { BrandCard } from '@/components/ui/BrandCard'
import { Package, FileSearch, LayoutDashboard, Plus } from 'lucide-react'

export default function DesignSystemShowcase() {
  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      {/* Hero Section - 회사 웹사이트 스타일 */}
      <section 
        className="hero-section"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1559757148-5c350d0d3c56?ixlib=rb-4.0.3&auto=format&fit=crop&w=2069&q=80')`
        }}
      >
        <div className="hero-overlay" />
        <div className="hero-content">
          <h1 className="heading-xl text-[var(--color-text-light)] mb-6">
            PharmaSource Pro
          </h1>
          <hr className="hero-divider" />
          <p className="body-text text-white/90 mb-8 max-w-2xl">
            글로벌 의약품 원료 소싱을 위한 통합 플랫폼으로,
            13,000개 제품과 66,000개 공급업체 정보를 제공합니다.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <BrandButton variant="primary" size="lg" shimmer={true}>
              <Package className="w-5 h-5" />
              통합 검색 시작
            </BrandButton>
            <BrandButton variant="secondary" size="lg">
              <FileSearch className="w-5 h-5" />
              소싱 의뢰하기
            </BrandButton>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="heading-lg text-[var(--color-text-primary)] mb-4">
              디자인 시스템 쇼케이스
            </h2>
            <p className="body-text text-[var(--color-text-muted)] max-w-2xl mx-auto">
              회사 웹사이트의 디자인 시스템이 적용된 컴포넌트들을 확인해보세요.
            </p>
          </div>

          {/* 버튼 시스템 */}
          <div className="mb-16">
            <h3 className="text-2xl font-bold text-[var(--color-text-primary)] mb-8">버튼 시스템</h3>
            
            <div className="grid-responsive mb-8">
              <BrandCard padding="lg">
                <h4 className="text-lg font-semibold mb-4 text-[var(--color-text-primary)]">Primary 버튼</h4>
                <div className="space-y-4">
                  <BrandButton variant="primary" size="lg">
                    <Plus className="w-4 h-4" />
                    대형 버튼
                  </BrandButton>
                  <BrandButton variant="primary" size="md">
                    <FileSearch className="w-4 h-4" />
                    중간 버튼
                  </BrandButton>
                  <BrandButton variant="primary" size="sm">
                    <LayoutDashboard className="w-4 h-4" />
                    소형 버튼
                  </BrandButton>
                </div>
              </BrandCard>

              <BrandCard padding="lg">
                <h4 className="text-lg font-semibold mb-4 text-[var(--color-text-primary)]">Shimmer 효과</h4>
                <div className="space-y-4">
                  <BrandButton variant="primary" size="lg" shimmer={true}>
                    <Package className="w-4 h-4" />
                    Shimmer 버튼
                  </BrandButton>
                  <BrandButton variant="primary" size="md" shimmer={true}>
                    소싱 의뢰 생성
                  </BrandButton>
                </div>
              </BrandCard>

              <BrandCard padding="lg">
                <h4 className="text-lg font-semibold mb-4 text-[var(--color-text-primary)]">Secondary 버튼</h4>
                <div className="space-y-4">
                  <BrandButton variant="secondary" size="lg">
                    더보기 +
                  </BrandButton>
                  <BrandButton variant="secondary" size="md">
                    필터 설정
                  </BrandButton>
                  <BrandButton variant="secondary" size="sm">
                    옵션
                  </BrandButton>
                </div>
              </BrandCard>

              <BrandCard padding="lg">
                <h4 className="text-lg font-semibold mb-4 text-[var(--color-text-primary)]">Ghost 버튼</h4>
                <div className="space-y-4">
                  <BrandButton variant="ghost" size="lg">
                    텍스트 버튼
                  </BrandButton>
                  <BrandButton variant="ghost" size="md">
                    <FileSearch className="w-4 h-4" />
                    아이콘 버튼
                  </BrandButton>
                </div>
              </BrandCard>
            </div>
          </div>

          {/* 카드 시스템 */}
          <div className="mb-16">
            <h3 className="text-2xl font-bold text-[var(--color-text-primary)] mb-8">카드 시스템</h3>
            
            <div className="grid-responsive">
              <BrandCard variant="default" padding="md">
                <h4 className="text-lg font-semibold mb-2 text-[var(--color-text-primary)]">기본 카드</h4>
                <p className="body-text text-[var(--color-text-muted)]">
                  기본 그림자와 호버 효과가 있는 표준 카드입니다.
                </p>
              </BrandCard>

              <BrandCard variant="elevated" padding="md">
                <h4 className="text-lg font-semibold mb-2 text-[var(--color-text-primary)]">강조 카드</h4>
                <p className="body-text text-[var(--color-text-muted)]">
                  더 강한 그림자로 중요한 내용을 강조하는 카드입니다.
                </p>
              </BrandCard>

              <BrandCard variant="outlined" padding="md">
                <h4 className="text-lg font-semibold mb-2 text-[var(--color-text-primary)]">아웃라인 카드</h4>
                <p className="body-text text-[var(--color-text-muted)]">
                  명확한 테두리로 구분되는 아웃라인 스타일 카드입니다.
                </p>
              </BrandCard>
            </div>
          </div>

          {/* 색상 팔레트 */}
          <div className="mb-16">
            <h3 className="text-2xl font-bold text-[var(--color-text-primary)] mb-8">브랜드 색상 팔레트</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto rounded-xl bg-[var(--color-primary)] mb-3 shadow-lg"></div>
                <h5 className="text-sm font-medium text-[var(--color-text-primary)]">Primary</h5>
                <p className="text-xs text-[var(--color-text-muted)]">#95c11f</p>
              </div>
              
              <div className="text-center">
                <div className="w-20 h-20 mx-auto rounded-xl bg-[var(--color-primary-dark)] mb-3 shadow-lg"></div>
                <h5 className="text-sm font-medium text-[var(--color-text-primary)]">Primary Dark</h5>
                <p className="text-xs text-[var(--color-text-muted)]">#7da419</p>
              </div>
              
              <div className="text-center">
                <div className="w-20 h-20 mx-auto rounded-xl bg-[var(--color-bg-beige)] border border-[var(--color-border-medium)] mb-3"></div>
                <h5 className="text-sm font-medium text-[var(--color-text-primary)]">Beige</h5>
                <p className="text-xs text-[var(--color-text-muted)]">#f3f1ed</p>
              </div>
              
              <div className="text-center">
                <div className="w-20 h-20 mx-auto rounded-xl bg-[var(--color-text-brown)] mb-3 shadow-lg"></div>
                <h5 className="text-sm font-medium text-[var(--color-text-primary)]">Brown</h5>
                <p className="text-xs text-[var(--color-text-muted)]">#85714d</p>
              </div>
              
              <div className="text-center">
                <div className="w-20 h-20 mx-auto rounded-xl bg-[var(--color-border-light)] border border-[var(--color-border-medium)] mb-3"></div>
                <h5 className="text-sm font-medium text-[var(--color-text-primary)]">Border Light</h5>
                <p className="text-xs text-[var(--color-text-muted)]">#eeeeee</p>
              </div>
              
              <div className="text-center">
                <div className="w-20 h-20 mx-auto rounded-xl bg-[var(--color-text-muted)] mb-3 shadow-lg"></div>
                <h5 className="text-sm font-medium text-[var(--color-text-primary)]">Text Muted</h5>
                <p className="text-xs text-[var(--color-text-muted)]">#8a8d8f</p>
              </div>
            </div>
          </div>

          {/* 타이포그래피 */}
          <div className="mb-16">
            <h3 className="text-2xl font-bold text-[var(--color-text-primary)] mb-8">타이포그래피</h3>
            
            <BrandCard padding="lg">
              <div className="space-y-6">
                <div>
                  <h1 className="heading-xl text-[var(--color-text-primary)]">Heading XL - 메인 제목</h1>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">font-size: 48px (lg), font-weight: 800</p>
                </div>
                
                <div>
                  <h2 className="heading-lg text-[var(--color-text-primary)]">Heading LG - 섹션 제목</h2>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">font-size: 30px (lg), font-weight: 700</p>
                </div>
                
                <div>
                  <h3 className="text-xl font-bold text-[var(--color-text-primary)]">Heading MD - 하위 제목</h3>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">font-size: 20px, font-weight: 700</p>
                </div>
                
                <div>
                  <p className="body-text">
                    본문 텍스트입니다. Inter와 Pretendard 폰트를 사용하며, 
                    줄 간격은 1.7로 설정되어 가독성이 최적화되어 있습니다. 
                    이 텍스트는 14px (모바일)에서 16px (데스크톱)로 반응형으로 조정됩니다.
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">font-size: 14px → 16px (responsive), line-height: 1.7</p>
                </div>
                
                <div>
                  <p className="text-[var(--color-text-muted)]">
                    보조 텍스트는 회색 계열을 사용하여 위계질서를 명확하게 표현합니다.
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">color: #8a8d8f</p>
                </div>
                
                <div>
                  <p className="text-[var(--color-primary)] font-medium">
                    브랜드 색상 텍스트는 중요한 정보나 링크에 사용됩니다.
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">color: #95c11f</p>
                </div>
              </div>
            </BrandCard>
          </div>

          {/* 레이아웃 예시 */}
          <div className="mb-16">
            <h3 className="text-2xl font-bold text-[var(--color-text-primary)] mb-8">반응형 그리드 레이아웃</h3>
            
            <div className="grid-responsive">
              <BrandCard padding="md">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-[var(--color-primary)] flex items-center justify-center">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-[var(--color-text-primary)]">제품 관리</h4>
                    <p className="text-sm text-[var(--color-text-muted)]">13,000개 제품</p>
                  </div>
                </div>
                <p className="body-text text-[var(--color-text-muted)]">
                  글로벌 의약품 원료 정보를 체계적으로 관리합니다.
                </p>
              </BrandCard>

              <BrandCard padding="md">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-[var(--color-text-brown)] flex items-center justify-center">
                    <FileSearch className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-[var(--color-text-primary)]">공급업체 네트워크</h4>
                    <p className="text-sm text-[var(--color-text-muted)]">66,000개 업체</p>
                  </div>
                </div>
                <p className="body-text text-[var(--color-text-muted)]">
                  검증된 글로벌 공급업체 네트워크를 활용하세요.
                </p>
              </BrandCard>

              <BrandCard padding="md">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-[var(--color-success)] flex items-center justify-center">
                    <LayoutDashboard className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-[var(--color-text-primary)]">통합 대시보드</h4>
                    <p className="text-sm text-[var(--color-text-muted)]">실시간 모니터링</p>
                  </div>
                </div>
                <p className="body-text text-[var(--color-text-muted)]">
                  소싱 프로세스를 한눈에 파악하고 관리하세요.
                </p>
              </BrandCard>
            </div>
          </div>

          {/* 상태 색상 */}
          <div className="mb-16">
            <h3 className="text-2xl font-bold text-[var(--color-text-primary)] mb-8">상태 표시 색상</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <BrandCard padding="md" hover={false}>
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto rounded-full bg-[var(--color-success)] flex items-center justify-center mb-3">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h4 className="font-medium text-[var(--color-text-primary)]">성공</h4>
                  <p className="text-xs text-[var(--color-text-muted)]">#22c55e</p>
                </div>
              </BrandCard>

              <BrandCard padding="md" hover={false}>
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto rounded-full bg-[var(--color-warning)] flex items-center justify-center mb-3">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <h4 className="font-medium text-[var(--color-text-primary)]">경고</h4>
                  <p className="text-xs text-[var(--color-text-muted)]">#f59e0b</p>
                </div>
              </BrandCard>

              <BrandCard padding="md" hover={false}>
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto rounded-full bg-[var(--color-error)] flex items-center justify-center mb-3">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <h4 className="font-medium text-[var(--color-text-primary)]">오류</h4>
                  <p className="text-xs text-[var(--color-text-muted)]">#ef4444</p>
                </div>
              </BrandCard>

              <BrandCard padding="md" hover={false}>
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto rounded-full bg-[var(--color-info)] flex items-center justify-center mb-3">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h4 className="font-medium text-[var(--color-text-primary)]">정보</h4>
                  <p className="text-xs text-[var(--color-text-muted)]">#3b82f6</p>
                </div>
              </BrandCard>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <footer 
        className="footer-section"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1507003211169-0a1dd7893047?ixlib=rb-4.0.3&auto=format&fit=crop&w=2069&q=80')`
        }}
      >
        <div className="footer-overlay" />
        <div className="footer-content">
          <div className="container-custom">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-[var(--color-primary)] flex items-center justify-center">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-2xl font-bold text-[var(--color-text-light)]">
                    PharmaSource Pro
                  </span>
                </div>
                <p className="text-[var(--color-text-muted)] text-sm leading-relaxed">
                  글로벌 의약품 원료 소싱 자동화 플랫폼
                </p>
              </div>
              
              <div>
                <h4 className="text-lg font-semibold text-[var(--color-text-light)] mb-4">회사 정보</h4>
                <div className="space-y-2 text-sm text-[var(--color-text-muted)]">
                  <p>대표이사: 홍성준</p>
                  <p>주소: 서울특별시 강남구</p>
                  <p>사업자등록번호: 123-45-67890</p>
                </div>
              </div>
              
              <div>
                <h4 className="text-lg font-semibold text-[var(--color-text-light)] mb-4">연락처</h4>
                <div className="space-y-2 text-sm text-[var(--color-text-muted)]">
                  <p>이메일: contact@pharmasource.pro</p>
                  <p>전화: 02-1234-5678</p>
                  <p>팩스: 02-1234-5679</p>
                </div>
              </div>
            </div>
            
            <div className="border-t border-white/20 pt-6">
              <p className="text-center text-sm text-[var(--color-text-muted)]">
                © 2025 PharmaSource Pro. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}