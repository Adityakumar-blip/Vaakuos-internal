export enum IntegrationType {
  PAYMENT = 'payment',
  MESSAGING = 'messaging',
  ANALYTICS = 'analytics',
  OTHER = 'other',
}

export interface Integration {
  id: string;
  name: string;
  code: string;
  description?: string;
  type: IntegrationType;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface IntegrationFormData {
  name: string;
  code: string;
  description?: string;
  type: IntegrationType;
  is_active: boolean;
}

export const INTEGRATION_TYPE_OPTIONS = [
  { value: IntegrationType.PAYMENT, label: 'Payment' },
  { value: IntegrationType.MESSAGING, label: 'Messaging' },
  { value: IntegrationType.ANALYTICS, label: 'Analytics' },
  { value: IntegrationType.OTHER, label: 'Other' },
] as const;
