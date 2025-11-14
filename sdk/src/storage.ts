/**
 * Storage Management (Cookies & localStorage)
 */

import { STORAGE_KEYS } from './config';

export interface StorageData {
  sessionId: string | null;
  referralCode: string | null;
  firstVisit: string | null;
  lastVisit: string | null;
  consent: boolean;
}

export class Storage {
  private prefix: string;
  private useLocalStorage: boolean;
  private attributionDays: number;

  constructor(prefix: string, useLocalStorage: boolean, attributionDays: number) {
    this.prefix = prefix;
    this.useLocalStorage = useLocalStorage;
    this.attributionDays = attributionDays;
  }

  /**
   * Get prefixed key name
   */
  private getKey(key: string): string {
    return `${this.prefix}_${key}`;
  }

  /**
   * Set value in storage
   */
  set(key: string, value: string, expirationDays?: number): void {
    const fullKey = this.getKey(key);
    const days = expirationDays ?? this.attributionDays;

    if (this.useLocalStorage) {
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + days);

      const item = {
        value,
        expiry: expiry.getTime(),
      };

      try {
        localStorage.setItem(fullKey, JSON.stringify(item));
      } catch (e) {
        console.warn('[AffiliateSDK] localStorage not available:', e);
      }
    } else {
      this.setCookie(fullKey, value, days);
    }
  }

  /**
   * Get value from storage
   */
  get(key: string): string | null {
    const fullKey = this.getKey(key);

    if (this.useLocalStorage) {
      try {
        const item = localStorage.getItem(fullKey);
        if (!item) return null;

        const parsed = JSON.parse(item);
        const now = new Date().getTime();

        // Check if expired
        if (parsed.expiry && now > parsed.expiry) {
          localStorage.removeItem(fullKey);
          return null;
        }

        return parsed.value;
      } catch (e) {
        console.warn('[AffiliateSDK] Error reading localStorage:', e);
        return null;
      }
    } else {
      return this.getCookie(fullKey);
    }
  }

  /**
   * Remove value from storage
   */
  remove(key: string): void {
    const fullKey = this.getKey(key);

    if (this.useLocalStorage) {
      try {
        localStorage.removeItem(fullKey);
      } catch (e) {
        console.warn('[AffiliateSDK] Error removing from localStorage:', e);
      }
    } else {
      this.deleteCookie(fullKey);
    }
  }

  /**
   * Clear all SDK data
   */
  clearAll(): void {
    Object.values(STORAGE_KEYS).forEach((key: string) => {
      this.remove(key);
    });
  }

  /**
   * Get all stored data
   */
  getAll(): StorageData {
    return {
      sessionId: this.get(STORAGE_KEYS.SESSION_ID),
      referralCode: this.get(STORAGE_KEYS.REFERRAL_CODE),
      firstVisit: this.get(STORAGE_KEYS.FIRST_VISIT),
      lastVisit: this.get(STORAGE_KEYS.LAST_VISIT),
      consent: this.get(STORAGE_KEYS.CONSENT) === 'true',
    };
  }

  /**
   * Set cookie
   */
  private setCookie(name: string, value: string, days: number): void {
    const expires = new Date();
    expires.setDate(expires.getDate() + days);

    const cookie = `${name}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;

    try {
      document.cookie = cookie;
    } catch (e) {
      console.warn('[AffiliateSDK] Error setting cookie:', e);
    }
  }

  /**
   * Get cookie
   */
  private getCookie(name: string): string | null {
    try {
      const nameEQ = name + '=';
      const cookies = document.cookie.split(';');

      for (let i = 0; i < cookies.length; i++) {
        let cookie = cookies[i];
        while (cookie.charAt(0) === ' ') {
          cookie = cookie.substring(1);
        }
        if (cookie.indexOf(nameEQ) === 0) {
          return decodeURIComponent(cookie.substring(nameEQ.length));
        }
      }
      return null;
    } catch (e) {
      console.warn('[AffiliateSDK] Error reading cookie:', e);
      return null;
    }
  }

  /**
   * Delete cookie
   */
  private deleteCookie(name: string): void {
    try {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    } catch (e) {
      console.warn('[AffiliateSDK] Error deleting cookie:', e);
    }
  }
}

/**
 * Generate UUID v4
 */
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Get URL parameter
 */
export function getUrlParam(name: string): string | null {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
  } catch (e) {
    console.warn('[AffiliateSDK] Error reading URL params:', e);
    return null;
  }
}
