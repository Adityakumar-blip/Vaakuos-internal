/**
 * VaakuOS Owner (Super Admin) specific type definitions
 */

export interface GlobalStats {
  totalAgencies: number;
  totalBrands: number;
  messagesToday: number;
  revenueToday: number;
  revenueMTD: number;
  failedMessagesPercent: number;
  qualityAlerts: number;
}

export interface AgencyOverview {
  id: string;
  name: string;
  status: 'active' | 'suspended';
  creditBalance: number;
  revenueGenerated: number;
  pricingTier: string;
  brandsCount: number;
  createdAt: string;
}

/** Shape returned by `GET /brands` (BrandsService.findAll). */
export interface BrandOverview {
  id: string;
  name: string;
  slug: string | null;
  /** Subscription status: trialing | active | halted | cancelled | inactive | … */
  status: string;
  planName: string;
  agencyId: string | null;
  agencyName: string;
  whatsappNumber: string;
  messageVolume: number;
  blockRate: number;
  /** Subscription status as returned by /brands — not a brand lifecycle state. */
  status: string;
  planName?: string;
  planId?: string | null;
  planFeatures?: Record<string, string | number | boolean> | null;
  customLimits?: Record<string, string | number | boolean> | null;
  trialEndsAt?: string | null;
  currentPeriodEnd?: string | null;
  createdAt: string;
  creditsBalance: number;
}

export interface TemplateModerationItem {
  id: string;
  templateName: string;
  brandId: string;
  brandName: string;
  category: string;
  language: string;
  content: string;
  status: 'pending' | 'approved' | 'rejected';
  spamRiskFlag: boolean;
  submittedAt: string;
}

export interface CreditPricingSlab {
  id: string;
  name: string;
  minCredits: number;
  maxCredits: number;
  pricePerCredit: number;
  discountPercent: number;
}

export interface MonitoringAlert {
  id: string;
  type: 'message_spike' | 'high_optout' | 'blocked_number' | 'policy_violation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  brandId?: string;
  brandName?: string;
  agencyId?: string;
  agencyName?: string;
  message: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface ActivityLog {
  id: string;
  tenantId: string;
  userId?: string;
  userName?: string;
  module: string;
  action: string;
  level: 'info' | 'warning' | 'error';
  message: string;
  details?: Record<string, unknown>;
  resourceId?: string;
  resourceType?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  agencyIds?: string[];
  rolloutPercent?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CoreConfig {
  whatsappBSP: {
    provider: string;
    apiKey: string;
    webhookSecret: string;
  };
  retryPolicy: {
    maxRetries: number;
    retryDelay: number;
  };
  rateLimits: {
    messagesPerSecond: number;
    messagesPerMinute: number;
  };
  maintenanceMode: boolean;
}

export interface EmergencyAction {
  action: 'pause_all' | 'disable_template' | 'block_number' | 'force_logout';
  targetId?: string;
  reason: string;
  performedBy: string;
  performedAt: string;
}
