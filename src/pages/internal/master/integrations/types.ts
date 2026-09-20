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

/** How far this provider is actually implemented in the VaakuOS product. */
export type PluginImplementation = 'wired' | 'in_progress' | 'frontend_only';

/** One credential a tenant must supply before this provider can connect. */
export interface ConfigField {
  key: string;
  label: string;
  type: ConfigFieldType;
  required?: boolean;
  help?: string;
}

export interface PluginUsageStats {
  connected_tenants: number;
  disconnected_tenants?: number;
  error_count_24h: number;
  last_error?: string | null;
  last_error_at?: string | null;
  last_checked_at?: string | null;
  last_sync_at?: string | null;
}

export interface PluginIncident {
  id: string;
  status: IntegrationStatus;
  message: string;
  started_at: string;
  resolved_at?: string | null;
  created_at?: string;
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
  /** Present when the catalog list/detail returns usage. */
  connected_tenants?: number;
  error_count_24h?: number;
  last_error?: string | null;
  last_error_at?: string | null;
  last_checked_at?: string | null;
  last_sync_at?: string | null;
}

export interface PlatformPluginDef {
  provider: string;
  name: string;
  description: string;
  category: IntegrationCategory;
  implementation: PluginImplementation;
}

export interface ManagedPlugin {
  provider: string;
  name: string;
  description: string;
  category: IntegrationCategory;
  implementation: PluginImplementation;
  /** Missing until the provider is seeded into the catalog. */
  catalog: IntegrationCatalogEntry | null;
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

export const IMPLEMENTATION_LABELS: Record<PluginImplementation, string> = {
  wired: 'Live in product',
  in_progress: 'In progress',
  frontend_only: 'App-declared only',
};
