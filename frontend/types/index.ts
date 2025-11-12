/**
 * TypeScript Types for Affiliate Management System
 */

export enum UserRole {
  ADMIN = "admin",
  AFFILIATE = "affiliate",
  CUSTOMER = "customer",
}

export enum UserStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  SUSPENDED = "suspended",
}

export enum ApprovalStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
}

export enum ProgramType {
  SAAS = "saas",
  LEAD_GEN = "lead_gen",
  CONTENT_MEDIA = "content_media",
}

export enum ProgramStatus {
  ACTIVE = "active",
  PAUSED = "paused",
  ARCHIVED = "archived",
}

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  status: UserStatus;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role?: UserRole;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface AffiliateProfile {
  id: string;
  user_id: string;
  affiliate_code: string;
  tier_id?: string;
  company_name?: string;
  website_url?: string;
  social_media?: Record<string, string>;
  approval_status: ApprovalStatus;
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface AffiliateProgram {
  id: string;
  name: string;
  slug: string;
  description?: string;
  program_type: ProgramType;
  status: ProgramStatus;
  start_date?: string;
  end_date?: string;
  terms_and_conditions?: string;
  commission_config: Record<string, any>;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export enum EnrollmentStatus {
  PENDING = "pending",
  ACTIVE = "active",
  PAUSED = "paused",
  TERMINATED = "terminated",
}

export enum ReferralLinkStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
}

export interface ProgramEnrollment {
  id: string;
  affiliate_id: string;
  program_id: string;
  status: EnrollmentStatus;
  custom_commission_config?: Record<string, any>;
  enrolled_at: string;
  terminated_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ReferralLink {
  id: string;
  enrollment_id: string;
  affiliate_id: string;
  program_id: string;
  link_code: string;
  target_url: string;
  utm_params?: Record<string, string>;
  metadata?: Record<string, any>;
  clicks_count: number;
  conversions_count: number;
  status: ReferralLinkStatus;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ReferralLinkWithUrl extends ReferralLink {
  full_url: string;
}

export interface ReferralLinkStats {
  link_code: string;
  total_clicks: number;
  unique_visitors: number;
  conversions: number;
  conversion_rate: number;
  last_click_at?: string;
}

export interface ApiError {
  detail: string;
}
