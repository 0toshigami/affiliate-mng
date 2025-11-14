/**
 * Affiliate Conversion Tracking SDK
 *
 * @example
 * ```html
 * <script src="https://cdn.example.com/affiliate-sdk.js"></script>
 * <script>
 *   AffiliateSDK.init({
 *     apiUrl: 'https://api.example.com/api/v1',
 *     debug: true
 *   });
 *
 *   // Track a conversion
 *   AffiliateSDK.trackConversion({
 *     type: 'SALE',
 *     value: 99.99,
 *     currency: 'USD',
 *     customerId: 'customer-123'
 *   });
 * </script>
 * ```
 */

import { SDKConfig, DEFAULT_CONFIG, InternalConfig } from './config';
import { ConversionTracker, TrackConversionOptions } from './tracker';

class AffiliateSDK {
  private static instance: ConversionTracker | null = null;
  private static config: InternalConfig | null = null;

  /**
   * Initialize the SDK
   */
  static init(config: SDKConfig): void {
    if (!config.apiUrl) {
      throw new Error('apiUrl is required in SDK configuration');
    }

    // Merge with defaults
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
    } as InternalConfig;

    // Create tracker instance
    this.instance = new ConversionTracker(this.config);

    // Auto-initialize if consent not required
    if (!this.config.cookieConsent) {
      this.instance.init();
    }

    // Expose to window for debugging
    if (this.config.debug) {
      (window as any).__AffiliateSDK__ = this.instance;
    }
  }

  /**
   * Track a conversion event
   */
  static async trackConversion(options: TrackConversionOptions): Promise<void> {
    if (!this.instance) {
      throw new Error('SDK not initialized. Call AffiliateSDK.init() first.');
    }
    return this.instance.trackConversion(options);
  }

  /**
   * Set cookie consent (for GDPR compliance)
   */
  static setConsent(granted: boolean): void {
    if (!this.instance) {
      throw new Error('SDK not initialized. Call AffiliateSDK.init() first.');
    }
    this.instance.setConsent(granted);
  }

  /**
   * Check if consent was granted
   */
  static hasConsent(): boolean {
    if (!this.instance) return false;
    return this.instance.hasConsent();
  }

  /**
   * Associate customer with current session
   */
  static identify(customerId: string): void {
    if (!this.instance) {
      throw new Error('SDK not initialized. Call AffiliateSDK.init() first.');
    }
    this.instance.identify(customerId);
  }

  /**
   * Get current session information
   */
  static getSessionInfo() {
    if (!this.instance) {
      throw new Error('SDK not initialized. Call AffiliateSDK.init() first.');
    }
    return this.instance.getSessionInfo();
  }

  /**
   * Clear all tracking data
   */
  static clear(): void {
    if (!this.instance) return;
    this.instance.clear();
  }

  /**
   * Get SDK version
   */
  static get version(): string {
    return '1.0.0';
  }
}

// Auto-initialize from data attributes if script tag has them
if (typeof window !== 'undefined') {
  const script = document.currentScript as HTMLScriptElement;
  if (script && script.dataset.apiUrl) {
    AffiliateSDK.init({
      apiUrl: script.dataset.apiUrl,
      apiKey: script.dataset.apiKey,
      debug: script.dataset.debug === 'true',
      cookieConsent: script.dataset.cookieConsent === 'true',
      attributionWindow: script.dataset.attributionWindow
        ? parseInt(script.dataset.attributionWindow, 10)
        : undefined,
    });
  }
}

// Export for module usage
export default AffiliateSDK;

// Export for UMD/browser global
if (typeof window !== 'undefined') {
  (window as any).AffiliateSDK = AffiliateSDK;
}

// Export types
export type { SDKConfig, TrackConversionOptions };
