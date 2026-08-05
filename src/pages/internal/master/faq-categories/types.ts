export interface FAQCategory {
  id: string;
  name: string;
  code: string;
  description?: string;
  is_active: boolean;
  order: number;
  created_at?: string;
  updated_at?: string;
}

export interface FAQCategoryFormData {
  name: string;
  code: string;
  description?: string;
  is_active: boolean;
  order: number;
}
