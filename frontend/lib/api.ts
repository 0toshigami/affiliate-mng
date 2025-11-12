/**
 * API Client for Affiliate Management System
 */
import axios, { AxiosError, AxiosInstance } from "axios";
import {
  LoginRequest,
  RegisterRequest,
  TokenResponse,
  User,
  AffiliateProfile,
  AffiliateProgram,
  ProgramEnrollment,
  ReferralLink,
  ReferralLinkWithUrl,
  ReferralLinkStats,
} from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const API_V1 = `${API_URL}/api/v1`;

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_V1,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        // If 401 and not already retried, try to refresh token
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = this.getRefreshToken();
            if (refreshToken) {
              const { data } = await axios.post<TokenResponse>(
                `${API_V1}/auth/refresh`,
                { refresh_token: refreshToken }
              );

              this.setTokens(data.access_token, data.refresh_token);

              // Retry original request with new token
              originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, clear tokens and redirect to login
            this.clearTokens();
            if (typeof window !== "undefined") {
              window.location.href = "/login";
            }
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Token management
  private getAccessToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem("access_token");
    }
    return null;
  }

  private getRefreshToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem("refresh_token");
    }
    return null;
  }

  setTokens(accessToken: string, refreshToken: string): void {
    if (typeof window !== "undefined") {
      localStorage.setItem("access_token", accessToken);
      localStorage.setItem("refresh_token", refreshToken);
    }
  }

  clearTokens(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
    }
  }

  // Auth endpoints
  async register(data: RegisterRequest): Promise<User> {
    const response = await this.client.post<User>("/auth/register", data);
    return response.data;
  }

  async login(data: LoginRequest): Promise<TokenResponse> {
    const response = await this.client.post<TokenResponse>("/auth/login", data);
    this.setTokens(response.data.access_token, response.data.refresh_token);
    return response.data;
  }

  async logout(): Promise<void> {
    await this.client.post("/auth/logout");
    this.clearTokens();
  }

  // User endpoints
  async getCurrentUser(): Promise<User> {
    const response = await this.client.get<User>("/users/me");
    return response.data;
  }

  async updateCurrentUser(data: Partial<User>): Promise<User> {
    const response = await this.client.patch<User>("/users/me", data);
    return response.data;
  }

  async listUsers(params?: { skip?: number; limit?: number; role?: string }): Promise<User[]> {
    const response = await this.client.get<User[]>("/users", { params });
    return response.data;
  }

  // Affiliate endpoints
  async applyAsAffiliate(data: Partial<AffiliateProfile>): Promise<AffiliateProfile> {
    const response = await this.client.post<AffiliateProfile>("/affiliates/apply", data);
    return response.data;
  }

  async getMyAffiliateProfile(): Promise<AffiliateProfile> {
    const response = await this.client.get<AffiliateProfile>("/affiliates/me");
    return response.data;
  }

  async updateMyAffiliateProfile(data: Partial<AffiliateProfile>): Promise<AffiliateProfile> {
    const response = await this.client.patch<AffiliateProfile>("/affiliates/me", data);
    return response.data;
  }

  async listAffiliates(params?: { skip?: number; limit?: number; status?: string }): Promise<AffiliateProfile[]> {
    const response = await this.client.get<AffiliateProfile[]>("/affiliates", { params });
    return response.data;
  }

  async getAffiliate(id: string): Promise<AffiliateProfile> {
    const response = await this.client.get<AffiliateProfile>(`/affiliates/${id}`);
    return response.data;
  }

  async approveAffiliate(id: string, data?: { tier_id?: string }): Promise<AffiliateProfile> {
    const response = await this.client.post<AffiliateProfile>(`/affiliates/${id}/approve`, data || {});
    return response.data;
  }

  async rejectAffiliate(id: string, reason: string): Promise<AffiliateProfile> {
    const response = await this.client.post<AffiliateProfile>(`/affiliates/${id}/reject`, { rejection_reason: reason });
    return response.data;
  }

  // Program endpoints
  async listPrograms(params?: { skip?: number; limit?: number; status?: string }): Promise<AffiliateProgram[]> {
    const response = await this.client.get<AffiliateProgram[]>("/programs", { params });
    return response.data;
  }

  async getProgram(id: string): Promise<AffiliateProgram> {
    const response = await this.client.get<AffiliateProgram>(`/programs/${id}`);
    return response.data;
  }

  async createProgram(data: Partial<AffiliateProgram>): Promise<AffiliateProgram> {
    const response = await this.client.post<AffiliateProgram>("/programs", data);
    return response.data;
  }

  async updateProgram(id: string, data: Partial<AffiliateProgram>): Promise<AffiliateProgram> {
    const response = await this.client.patch<AffiliateProgram>(`/programs/${id}`, data);
    return response.data;
  }

  async deleteProgram(id: string): Promise<{ message: string }> {
    const response = await this.client.delete<{ message: string }>(`/programs/${id}`);
    return response.data;
  }

  // Enrollment endpoints
  async enrollInProgram(programId: string): Promise<ProgramEnrollment> {
    const response = await this.client.post<ProgramEnrollment>(`/programs/${programId}/enroll`);
    return response.data;
  }

  async getMyEnrollments(): Promise<ProgramEnrollment[]> {
    const response = await this.client.get<ProgramEnrollment[]>("/programs/enrollments/me");
    return response.data;
  }

  // Referral link endpoints
  async createReferralLink(data: {
    program_id: string;
    target_url: string;
    utm_params?: Record<string, string>;
    metadata?: Record<string, any>;
    expires_at?: string;
  }): Promise<ReferralLinkWithUrl> {
    const response = await this.client.post<ReferralLinkWithUrl>("/referrals/links", data);
    return response.data;
  }

  async listMyReferralLinks(params?: { skip?: number; limit?: number; status?: string }): Promise<ReferralLink[]> {
    const response = await this.client.get<ReferralLink[]>("/referrals/links", { params });
    return response.data;
  }

  async getReferralLink(id: string): Promise<ReferralLinkWithUrl> {
    const response = await this.client.get<ReferralLinkWithUrl>(`/referrals/links/${id}`);
    return response.data;
  }

  async updateReferralLink(id: string, data: Partial<ReferralLink>): Promise<ReferralLink> {
    const response = await this.client.patch<ReferralLink>(`/referrals/links/${id}`, data);
    return response.data;
  }

  async deleteReferralLink(id: string): Promise<{ message: string }> {
    const response = await this.client.delete<{ message: string }>(`/referrals/links/${id}`);
    return response.data;
  }

  async getReferralLinkStats(id: string): Promise<ReferralLinkStats> {
    const response = await this.client.get<ReferralLinkStats>(`/referrals/links/${id}/stats`);
    return response.data;
  }

  // Generic request methods
  async get<T>(url: string, config?: any): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async patch<T>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: any): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export error handler helper
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.detail || error.message;
  }
  return "An unexpected error occurred";
}
