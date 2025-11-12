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

// Phase 3: Commission System Types

export enum ConversionType {
  SIGNUP = "signup",
  TRIAL_START = "trial_start",
  SUBSCRIPTION = "subscription",
  PURCHASE = "purchase",
  LEAD = "lead",
}

export enum ConversionStatus {
  PENDING = "pending",
  VALIDATED = "validated",
  REJECTED = "rejected",
}

export enum CommissionStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
  PAID = "paid",
}

export enum PayoutStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  PAID = "paid",
  CANCELLED = "cancelled",
}

export interface Conversion {
  id: string;
  referral_link_id: string;
  affiliate_id: string;
  program_id: string;
  conversion_type: ConversionType;
  status: ConversionStatus;
  conversion_value: number;
  visitor_session_id: string;
  customer_id?: string;
  metadata?: Record<string, any>;
  validated_at?: string;
  rejected_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Commission {
  id: string;
  conversion_id: string;
  affiliate_id: string;
  program_id: string;
  tier_id?: string;
  base_amount: number;
  tier_multiplier: number;
  final_amount: number;
  status: CommissionStatus;
  approved_by?: string;
  approved_at?: string;
  payout_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Payout {
  id: string;
  affiliate_id: string;
  total_amount: number;
  commissions_count: number;
  status: PayoutStatus;
  start_date: string;
  end_date: string;
  payment_method?: string;
  payment_reference?: string;
  processed_at?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CommissionStats {
  total_pending: number;
  total_approved: number;
  total_paid: number;
  count_pending: number;
  count_approved: number;
  count_paid: number;
}

export interface PayoutStats {
  total_pending: number;
  total_processing: number;
  total_paid: number;
  count_pending: number;
  count_processing: number;
  count_paid: number;
}
