export type DealType = 'all' | 'Wynajem' | 'Sprzedaż';

export interface PropertyValidation {
  isFullyValid: boolean;
  score: number; // 0 - 100
  checks: {
    titleOk: boolean;
    priceOk: boolean;
    locationOk: boolean;
    areaAndRoomsOk: boolean;
    singleOfferDescriptionOk: boolean;
    directLinkOk: boolean;
    sourceOk: boolean;
  };
  warnings: string[];
}

export interface LiveVerificationInfo {
  isLive: boolean;
  status: number;
  finalUrl?: string;
  isArchived?: boolean;
  isTrap?: boolean;
  statusLabel: 'active' | 'archived' | 'dead_404' | 'trap_redirect' | 'blocked' | 'error';
  message: string;
  checkedAt?: string;
}

export interface Property {
  id?: string;
  title: string;
  location: string;
  dealType: 'Wynajem' | 'Sprzedaż' | string;
  propertyType: string;
  price: string;
  priceNumeric?: number;
  pricePerM2?: string;
  area: string;
  rooms: string;
  floor?: string;
  description: string;
  source: string;
  url: string;
  contact?: string;
  features?: string[];
  isDirectOffer?: boolean;
  hasPhoneNumber?: boolean;
  phoneNumber?: string;
  latitude?: number;
  longitude?: number;
  validation?: PropertyValidation;
  liveVerification?: LiveVerificationInfo;
}

export interface GroundingSource {
  title?: string;
  url?: string;
}

export interface VerificationSummary {
  totalChecked: number;
  validCount: number;
  accuracyPercentage: number;
  checksPassed: string[];
}

export interface SearchResponse {
  properties: Property[];
  groundingQueries?: string[];
  groundingSources?: GroundingSource[];
  isQuotaExceeded?: boolean;
  warning?: string;
  verificationSummary?: VerificationSummary;
}

export interface SearchHistoryItem {
  id: string;
  query: string;
  timestamp: number;
  count: number;
  dealTypeFilter?: string;
  properties: Property[];
}
