/**
 * API Communication Layer
 */

export interface ConversionPayload {
  referral_link_code: string;
  visitor_session_id: string;
  conversion_type: 'SALE' | 'LEAD' | 'SIGNUP' | 'CUSTOM';
  conversion_value?: number;
  currency?: string;
  customer_id?: string;
  conversion_metadata?: Record<string, any>;
}

export interface ConversionResponse {
  id: string;
  status: string;
  message?: string;
}

export class API {
  private baseUrl: string;
  private apiKey: string;
  private debug: boolean;

  constructor(baseUrl: string, apiKey: string, debug: boolean) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.apiKey = apiKey;
    this.debug = debug;
  }

  /**
   * Send conversion event to backend
   */
  async trackConversion(payload: ConversionPayload): Promise<ConversionResponse> {
    const url = `${this.baseUrl}/conversions/track`;

    if (this.debug) {
      console.log('[AffiliateSDK] Tracking conversion:', payload);
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'X-API-Key': this.apiKey }),
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`API error (${response.status}): ${error}`);
      }

      const data = await response.json();

      if (this.debug) {
        console.log('[AffiliateSDK] Conversion tracked successfully:', data);
      }

      return data;
    } catch (error) {
      if (this.debug) {
        console.error('[AffiliateSDK] Failed to track conversion:', error);
      }
      throw error;
    }
  }

  /**
   * Verify referral link exists and is active
   */
  async verifyReferralLink(linkCode: string): Promise<boolean> {
    const url = `${this.baseUrl}/referrals/verify/${linkCode}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return response.ok;
    } catch (error) {
      if (this.debug) {
        console.warn('[AffiliateSDK] Failed to verify referral link:', error);
      }
      return false;
    }
  }
}
