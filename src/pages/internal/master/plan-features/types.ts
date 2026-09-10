export enum FeatureType {
  BOOLEAN = 'boolean',
  NUMBER = 'number',
  STRING = 'string',
  JSON = 'json',
}

export interface PlanFeature {
  id: string;
  name: string;
  code: string;
  description?: string;
  type: FeatureType;
  is_active: boolean;
  /** Module this feature belongs to. Null means account-wide. */
  module_key?: string | null;
  /** For counted number features: the model whose rows are the usage count. */
  count_model?: string | null;
  /** Free/expired-tier value. Null leaves the feature out of the defaults. */
  default_value?: number | boolean | string | null;
  created_at?: string;
  updated_at?: string;
}

export interface PlanFeatureFormData {
  name: string;
  code: string;
  description?: string;
  type: FeatureType;
  is_active: boolean;
  module_key?: string | null;
  count_model?: string | null;
  default_value?: number | boolean | string | null;
}

/** Prefix that marks a feature as the on/off gate for a whole module. */
export const MODULE_PREFIX = 'module.';

/**
 * Models a counted limit may count rows in. Must stay in step with COUNT_MODELS
 * in the backend's entitlements.ts — the API rejects anything outside it.
 */
export const COUNT_MODEL_OPTIONS = [
  'contacts',
  'users',
  'campaigns',
  'templates',
  'flows',
  'tickets',
  'whatsapp_catalogs',
  'whatsapp_catalog_products',
  'integrations',
  'phone_numbers',
] as const;

export const FEATURE_TYPE_OPTIONS = [
  { value: FeatureType.BOOLEAN, label: 'Boolean' },
  { value: FeatureType.NUMBER, label: 'Number' },
  { value: FeatureType.STRING, label: 'String' },
  { value: FeatureType.JSON, label: 'JSON' },
] as const;
