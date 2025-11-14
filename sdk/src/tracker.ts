/**
 * Conversion Tracker
 */

import { InternalConfig, URL_PARAMS, STORAGE_KEYS } from './config';
import { Storage, generateUUID, getUrlParam } from './storage';
import { API, ConversionPayload } from './api';

export interface TrackConversionOptions {
  /** Conversion type */
  type: 'SALE' | 'LEAD' | 'SIGNUP' | 'CUSTOM';

  /** Conversion value (e.g., order total) */
  value?: number;

  /** Currency code (ISO 4217, default: USD) */
  currency?: string;

  /** Customer ID for attribution */
  customerId?: string;

  /** Custom metadata */
  metadata?: Record<string, any>;
}

export class ConversionTracker {
  private config: InternalConfig;
  private storage: Storage;
  private api: API;
  private initialized: boolean = false;

  constructor(config: InternalConfig) {
    this.config = config;
    this.storage = new Storage(
      config.cookiePrefix,
      config.useLocalStorage,
      config.attributionWindow
    );
    this.api = new API(config.apiUrl, config.apiKey, config.debug);
  }

  /**
   * Initialize the tracker
   */
  init(): void {
    if (this.initialized) {
      this.log('SDK already initialized');
      return;
    }

    this.log('Initializing SDK...');

    // Check cookie consent if required
    if (this.config.cookieConsent && !this.hasConsent()) {
      this.log('Waiting for cookie consent...');
      return;
    }

    // Initialize session tracking
    this.initializeSession();

    // Detect referral from URL
    this.detectReferral();

    this.initialized = true;
    this.log('SDK initialized successfully');
  }

  /**
   * Initialize visitor session
   */
  private initializeSession(): void {
    const now = new Date().toISOString();
    let sessionId = this.storage.get(STORAGE_KEYS.SESSION_ID);

    if (!sessionId) {
      sessionId = generateUUID();
      this.storage.set(STORAGE_KEYS.SESSION_ID, sessionId);
      this.storage.set(STORAGE_KEYS.FIRST_VISIT, now);
      this.log('New session created:', sessionId);
    }

    this.storage.set(STORAGE_KEYS.LAST_VISIT, now);
  }

  /**
   * Detect referral code from URL
   */
  private detectReferral(): void {
    const referralCode = getUrlParam(URL_PARAMS.REFERRAL);

    if (referralCode) {
      const existingCode = this.storage.get(STORAGE_KEYS.REFERRAL_CODE);

      if (existingCode !== referralCode) {
        this.storage.set(STORAGE_KEYS.REFERRAL_CODE, referralCode);
        this.log('Referral code detected:', referralCode);

        // Trigger custom event
        this.dispatchEvent('referral_detected', { referralCode });
      }
    } else {
      this.log('No referral code in URL');
    }
  }

  /**
   * Track a conversion
   */
  async trackConversion(options: TrackConversionOptions): Promise<void> {
    if (!this.initialized) {
      throw new Error('SDK not initialized. Call init() first.');
    }

    const sessionId = this.storage.get(STORAGE_KEYS.SESSION_ID);
    const referralCode = this.storage.get(STORAGE_KEYS.REFERRAL_CODE);

    if (!sessionId) {
      throw new Error('No session ID found. Please ensure cookies/localStorage is enabled.');
    }

    if (!referralCode) {
      this.log('No referral code found. Conversion will not be attributed.');
      this.dispatchEvent('conversion_not_attributed', { reason: 'no_referral_code' });
      return;
    }

    const payload: ConversionPayload = {
      referral_link_code: referralCode,
      visitor_session_id: sessionId,
      conversion_type: options.type,
      conversion_value: options.value,
      currency: options.currency || 'USD',
      customer_id: options.customerId,
      conversion_metadata: options.metadata,
    };

    try {
      const response = await this.api.trackConversion(payload);

      this.log('Conversion tracked:', response);
      this.dispatchEvent('conversion_tracked', {
        conversionId: response.id,
        ...options
      });
    } catch (error) {
      this.log('Failed to track conversion:', error);
      this.dispatchEvent('conversion_error', { error });
      throw error;
    }
  }

  /**
   * Set cookie consent
   */
  setConsent(granted: boolean): void {
    this.storage.set(STORAGE_KEYS.CONSENT, granted ? 'true' : 'false', 365);

    if (granted && !this.initialized) {
      this.init();
    }
  }

  /**
   * Check if consent was granted
   */
  hasConsent(): boolean {
    return this.storage.get(STORAGE_KEYS.CONSENT) === 'true';
  }

  /**
   * Associate conversion with customer ID
   */
  identify(customerId: string): void {
    this.log('Customer identified:', customerId);
    this.dispatchEvent('customer_identified', { customerId });
  }

  /**
   * Get current session info
   */
  getSessionInfo(): {
    sessionId: string | null;
    referralCode: string | null;
    firstVisit: string | null;
    lastVisit: string | null;
  } {
    const data = this.storage.getAll();
    return {
      sessionId: data.sessionId,
      referralCode: data.referralCode,
      firstVisit: data.firstVisit,
      lastVisit: data.lastVisit,
    };
  }

  /**
   * Clear all tracking data
   */
  clear(): void {
    this.storage.clearAll();
    this.initialized = false;
    this.log('All tracking data cleared');
  }

  /**
   * Debug logging
   */
  private log(...args: any[]): void {
    if (this.config.debug) {
      console.log('[AffiliateSDK]', ...args);
    }
  }

  /**
   * Dispatch custom event
   */
  private dispatchEvent(eventName: string, detail: any): void {
    try {
      const event = new CustomEvent(`affiliateSDK:${eventName}`, { detail });
      window.dispatchEvent(event);
    } catch (e) {
      // Ignore if CustomEvent is not supported
    }
  }
}
