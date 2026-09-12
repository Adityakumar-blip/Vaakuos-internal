export const INTEGRATION_CATEGORIES = [
  'ecommerce',
  'messaging',
  'social',
  'productivity',
  'automation',
  'developer',
  'other',
] as const;

export const INTEGRATION_STATUSES = [
  'operational',
  'degraded',
  'down',
  'maintenance',
] as const;

export const CONFIG_FIELD_TYPES = [
  'text',
  'password',
  'url',
  'number',
  'boolean',
] as const;

export type IntegrationCategory = (typeof INTEGRATION_CATEGORIES)[number];
export type IntegrationStatus = (typeof INTEGRATION_STATUSES)[number];
export type ConfigFieldType = (typeof CONFIG_FIELD_TYPES)[number];

/** One credential a tenant must supply before this provider can connect. */
export interface ConfigField {
  key: string;
  label: string;
  type: ConfigFieldType;
  required?: boolean;
  help?: string;
}

export interface IntegrationCatalogEntry {
  id: string;
  provider: string;
  name: string;
  description?: string | null;
  category: IntegrationCategory;
  icon_url?: string | null;
  docs_url?: string | null;
  status: IntegrationStatus;
  status_message?: string | null;
  is_enabled: boolean;
  config_fields: ConfigField[];
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export const CATEGORY_LABELS: Record<IntegrationCategory, string> = {
  ecommerce: 'E-commerce',
  messaging: 'Messaging',
  social: 'Social',
  productivity: 'Productivity',
  automation: 'Automation',
  developer: 'Developer',
  other: 'Other',
};

export const STATUS_LABELS: Record<IntegrationStatus, string> = {
  operational: 'Operational',
  degraded: 'Degraded',
  down: 'Down',
  maintenance: 'Maintenance',
};
