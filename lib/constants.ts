/**
 * Application-wide constants.
 * Centralized configuration to avoid hardcoded values.
 */

// ==========================================
// INVENTORY SETTINGS
// ==========================================

/** Default threshold for low stock warning */
export const DEFAULT_LOW_STOCK_THRESHOLD = 5;

/** Minimum quantity that can be ordered */
export const MIN_ORDER_QUANTITY = 1;

/** Maximum quantity per order item */
export const MAX_ORDER_QUANTITY = 100;

// ==========================================
// ORDER STATUS CONFIGURATION
// ==========================================

export const ORDER_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export const ORDER_STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  completed: 'bg-blue-100 text-blue-800',
  cancelled: 'bg-gray-100 text-gray-800',
} as const;

// ==========================================
// PRODUCT CATEGORIES
// ==========================================

export const PRODUCT_CATEGORIES = {
  DOORS: 'doors',
  WINDOWS: 'windows',
  SLIDING_SYSTEMS: 'sliding-systems',
} as const;

// ==========================================
// PROJECT TYPES FOR QUOTES
// ==========================================

export const PROJECT_TYPES = {
  RESIDENTIAL: 'residential',
  COMMERCIAL: 'commercial',
  RENOVATION: 'renovation',
} as const;

// ==========================================
// PAGINATION DEFAULTS
// ==========================================

export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;

// ==========================================
// SUPPORTED LANGUAGES
// ==========================================

export const SUPPORTED_LANGUAGES = ['ar', 'fr'] as const;
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

export const DEFAULT_LANGUAGE: SupportedLanguage = 'fr';

export const RTL_LANGUAGES: SupportedLanguage[] = ['ar'];

// ==========================================
// COMPANY INFORMATION
// ==========================================

export const COMPANY_INFO = {
  name: 'DoorWin Pro',
  email: 'contact@doorwinpro.com',
  phone: '+213 555 123 456',
  address: '123 Avenue des Portes, Alger, Algérie',
  workingHours: {
    weekdays: '08:00 - 18:00',
    saturday: '09:00 - 14:00',
    sunday: 'Fermé / مغلق',
  },
  socialMedia: {
    facebook: 'https://facebook.com/doorwinpro',
    instagram: 'https://instagram.com/doorwinpro',
    linkedin: 'https://linkedin.com/company/doorwinpro',
  },
} as const;

// ==========================================
// VALIDATION RULES
// ==========================================

export const VALIDATION = {
  product: {
    nameMinLength: 3,
    nameMaxLength: 100,
    descriptionMinLength: 10,
    descriptionMaxLength: 2000,
    minPrice: 0,
    maxPrice: 10000000,
  },
  order: {
    minItems: 1,
    maxItems: 50,
  },
  customer: {
    nameMinLength: 2,
    nameMaxLength: 50,
    phonePattern: /^[+]?[\d\s-]{8,20}$/,
    emailPattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
} as const;

// ==========================================
// API ENDPOINTS (for future use)
// ==========================================

export const API_ENDPOINTS = {
  products: '/api/products',
  categories: '/api/categories',
  orders: '/api/orders',
  customers: '/api/customers',
  quotes: '/api/quotes',
  dashboard: '/api/dashboard',
} as const;
