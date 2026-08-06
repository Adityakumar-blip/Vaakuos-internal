/**
 * Brand-specific type definitions
 */

export interface Brand {
  id: string;
  name: string;
  website?: string;
  industry?: string;
  timezone?: string;
  defaultLanguage?: string;
  logo?: string;
  agencyId?: string;
  status?: 'active' | 'paused';
  createdAt: string;
  updatedAt: string;
}

export interface WhatsAppConfig {
  businessNumber: string;
  wabaId: string;
  qualityRating: 'green' | 'yellow' | 'red';
  messagingTier: 'tier_1' | 'tier_2' | 'tier_3';
  webhookStatus: 'active' | 'inactive' | 'error';
}

export interface TemplateRequest {
  id: string;
  name: string;
  category: string;
  language: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreditBalance {
  balance: number;
  planName: string;
  usageBreakdown: {
    sent: number;
    delivered: number;
    failed: number;
  };
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'marketer';
  lastLogin?: string;
  createdAt: string;
}

export interface WebhookConfig {
  url: string;
  events: string[];
  retryEnabled: boolean;
  maxRetries: number;
}

export interface NotificationPreferences {
  lowCreditAlert: boolean;
  campaignFailureAlert: boolean;
  webhookFailureAlert: boolean;
  emailNotifications: boolean;
}
