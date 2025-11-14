/**
 * SDK Configuration Types and Defaults
 */

export interface SDKConfig {
  /** API endpoint URL (e.g., 'http://localhost:8000/api/v1') */
  apiUrl: string;

  /** Merchant API key for authentication (optional for public tracking) */
  apiKey?: string;

  /** Attribution window in days (default: 30) */
  attributionWindow?: number;

  /** Wait for cookie consent before tracking (GDPR) */
  cookieConsent?: boolean;

  /** Enable debug logging */
  debug?: boolean;

  /** Custom cookie name prefix */
  cookiePrefix?: string;

  /** Use localStorage instead of cookies */
  useLocalStorage?: boolean;
}

export interface InternalConfig extends Required<SDKConfig> {}

export const DEFAULT_CONFIG: Omit<InternalConfig, 'apiUrl'> = {
  apiKey: '',
  attributionWindow: 30,
  cookieConsent: false,
  debug: false,
  cookiePrefix: '_aff',
  useLocalStorage: false,
};

/**
 * Storage keys
 */
export const STORAGE_KEYS = {
  SESSION_ID: 'session_id',
  REFERRAL_CODE: 'referral_code',
  FIRST_VISIT: 'first_visit',
  LAST_VISIT: 'last_visit',
  CONSENT: 'consent',
} as const;

/**
 * URL parameter names
 */
export const URL_PARAMS = {
  REFERRAL: 'ref',
  UTM_SOURCE: 'utm_source',
  UTM_MEDIUM: 'utm_medium',
  UTM_CAMPAIGN: 'utm_campaign',
} as const;
