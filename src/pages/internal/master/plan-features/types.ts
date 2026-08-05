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
  created_at?: string;
  updated_at?: string;
}

export interface PlanFeatureFormData {
  name: string;
  code: string;
  description?: string;
  type: FeatureType;
  is_active: boolean;
}

export const FEATURE_TYPE_OPTIONS = [
  { value: FeatureType.BOOLEAN, label: 'Boolean' },
  { value: FeatureType.NUMBER, label: 'Number' },
  { value: FeatureType.STRING, label: 'String' },
  { value: FeatureType.JSON, label: 'JSON' },
] as const;
