/**
 * Agency-specific type definitions
 */

export interface Agency {
  id: string;
  name: string;
  logo?: string;
  supportEmail?: string;
  defaultLanguage?: string;
  timezone?: string;
  creditBalance: number;
  status: 'active' | 'suspended';
  revenue?: number;
  pricingTier?: string;
  brandsCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface AgencyBrand {
  id: string;
  name: string;
  status: 'active' | 'paused';
  assignedCredits: number;
  messagesSent: number;
  createdAt: string;
}

export interface MasterTemplate {
  id: string;
  name: string;
  category: string;
  language: string;
  content: string;
  isLocked: boolean;
  usageCount: number;
  assignedBrands: string[];
  createdAt: string;
}

export interface AgencyReport {
  brandId: string;
  brandName: string;
  messagesSent: number;
  messagesDelivered: number;
  messagesFailed: number;
  revenue: number;
  period: {
    start: string;
    end: string;
  };
}

export interface WhiteLabelSettings {
  platformName: string;
  logo?: string;
  footerText?: string;
  emailSenderName?: string;
  customDomain?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

export interface AgencyTeamMember {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'account_manager';
  brandAccess: string[];
  lastLogin?: string;
  createdAt: string;
}

export interface CreditPurchase {
  id: string;
  amount: number;
  credits: number;
  status: 'completed' | 'pending' | 'failed';
  invoiceUrl?: string;
  createdAt: string;
}
