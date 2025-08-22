// PharmaOffer 크롤러 타입 정의
export interface PharmaOfferProduct {
  name: string;
  company: string;
  location: string;
  price?: string;
  availability?: string;
  contact?: string;
  url: string;
  extractedAt: string;
}

export interface PharmaOfferSearchResult {
  query: string;
  products: PharmaOfferProduct[];
  totalFound: number;
  searchTime: number;
  success: boolean;
  error?: string;
}

export interface CrawlerConfig {
  headless: boolean;
  timeout: number;
  maxPages: number;
  delayBetweenActions: {
    min: number;
    max: number;
  };
  viewport: {
    width: number;
    height: number;
  };
  debugMode: boolean;
}

export interface BotAvoidanceConfig {
  userAgents: string[];
  randomizeViewport: boolean;
  enableStealth: boolean;
  humanTypingSpeed: {
    min: number;
    max: number;
  };
  scrollBehavior: {
    enabled: boolean;
    maxScrolls: number;
    pauseBetweenScrolls: {
      min: number;
      max: number;
    };
  };
}

export interface CrawlerStatus {
  isRunning: boolean;
  currentPage: number;
  totalPages: number;
  itemsFound: number;
  errors: string[];
  startTime: string;
  lastAction: string;
}

export interface DebugInfo {
  screenshots: string[];
  networkLogs: any[];
  consoleErrors: string[];
  pageUrl: string;
  timestamp: string;
}

// 통합 실시간 크롤링 결과 타입
export interface UnifiedProduct {
  name: string;
  company: string;
  location: string;
  price?: string;
  availability?: string;
  contact?: string;
  url: string;
  extractedAt: string;
  source: 'PharmaOffer' | 'PharmaCompass' | 'Database';
  additionalInfo?: {
    pharmaOffer?: any;
    pharmaCompass?: any;
    database?: any;
  };
}

export interface CrawlerSiteResult {
  site: string;
  products: UnifiedProduct[];
  success: boolean;
  error?: string;
  responseTime: number;
  timestamp: string;
}

export interface RealtimeSearchResult {
  query: string;
  sites: CrawlerSiteResult[];
  totalProducts: number;
  searchTime: number;
  success: boolean;
  error?: string;
  timestamp: string;
  cached?: boolean; // 캐시된 결과인지 여부
}