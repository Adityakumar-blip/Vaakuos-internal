import * as React from "react";

export type FilterFieldType = "select" | "multiselect" | "text" | "date" | "boolean";

export type OperatorId =
  | "is"
  | "isNot"
  | "isAnyOf"
  | "isNoneOf"
  | "contains"
  | "notContains"
  | "before"
  | "after"
  | "between";

export interface FilterOption {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
  /** color swatch dot, e.g. "bg-emerald-500" */
  dot?: string;
}

export interface FilterField<TRow = any> {
  /** stable unique id, also used as the active-filter key (one filter per field) */
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  /** "date" renders a range calendar — values are ["yyyy-MM-dd" from, "yyyy-MM-dd" to], either may be "" */
  type: FilterFieldType;
  /** options for select / multiselect — array or a resolver (e.g. derived from data) */
  options?: FilterOption[] | (() => FilterOption[]);
  /** override the default operators offered for this field's type */
  operators?: OperatorId[];
  /** show a search box in the value picker (good for long lists) */
  searchable?: boolean;
  /** read the comparable value off a row for client-side filtering */
  accessor?: (row: TRow) => unknown;
  /**
   * Full escape hatch: decide membership yourself. When provided, this overrides
   * operator-based testing entirely — lets you inject *any* custom predicate
   * (relative dates, computed fields, ranges, etc.).
   */
  test?: (row: TRow, operator: OperatorId, values: string[]) => boolean;
}

export interface ActiveFilter {
  /** equals the field id — one active filter per field */
  fieldId: string;
  operator: OperatorId;
  values: string[];
}

export function resolveOptions(field: FilterField): FilterOption[] {
  if (!field.options) return [];
  return typeof field.options === "function" ? field.options() : field.options;
}
