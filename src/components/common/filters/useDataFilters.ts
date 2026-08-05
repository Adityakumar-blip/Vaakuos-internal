import * as React from "react";
import type { ActiveFilter, FilterField, OperatorId } from "./types";
import { OPERATORS } from "./operators";

export interface UseDataFiltersResult<TRow> {
  filters: ActiveFilter[];
  fieldMap: Record<string, FilterField<TRow>>;
  /** add or replace the filter for a field */
  setFilter: (fieldId: string, values: string[], operator?: OperatorId) => void;
  updateOperator: (fieldId: string, operator: OperatorId) => void;
  removeFilter: (fieldId: string) => void;
  clearAll: () => void;
  /** predicate for Array.prototype.filter */
  predicate: (row: TRow) => boolean;
  /** convenience: filter a dataset */
  apply: (rows: TRow[]) => TRow[];
  activeCount: number;
}

export function useDataFilters<TRow = any>(
  fields: FilterField<TRow>[],
  initial: ActiveFilter[] = []
): UseDataFiltersResult<TRow> {
  const [filters, setFilters] = React.useState<ActiveFilter[]>(initial);

  const fieldMap = React.useMemo(() => {
    const map: Record<string, FilterField<TRow>> = {};
    fields.forEach((f) => (map[f.id] = f));
    return map;
  }, [fields]);

  const setFilter = React.useCallback<UseDataFiltersResult<TRow>["setFilter"]>(
    (fieldId, values, operator) => {
      setFilters((prev) => {
        const existing = prev.find((f) => f.fieldId === fieldId);
        const field = fields.find((f) => f.id === fieldId);
        const op =
          operator ??
          existing?.operator ??
          field?.operators?.[0] ??
          "is";
        const next: ActiveFilter = { fieldId, operator: op, values };
        return existing
          ? prev.map((f) => (f.fieldId === fieldId ? next : f))
          : [...prev, next];
      });
    },
    [fields]
  );

  const updateOperator = React.useCallback((fieldId: string, operator: OperatorId) => {
    setFilters((prev) => prev.map((f) => (f.fieldId === fieldId ? { ...f, operator } : f)));
  }, []);

  const removeFilter = React.useCallback((fieldId: string) => {
    setFilters((prev) => prev.filter((f) => f.fieldId !== fieldId));
  }, []);

  const clearAll = React.useCallback(() => setFilters([]), []);

  const predicate = React.useCallback(
    (row: TRow) => {
      for (const filter of filters) {
        if (filter.values.length === 0) continue; // incomplete filter = no-op
        const field = fieldMap[filter.fieldId];
        if (!field) continue;
        const ok = field.test
          ? field.test(row, filter.operator, filter.values)
          : OPERATORS[filter.operator].test(
              field.accessor ? field.accessor(row) : (row as any)[field.id],
              filter.values
            );
        if (!ok) return false;
      }
      return true;
    },
    [filters, fieldMap]
  );

  const apply = React.useCallback((rows: TRow[]) => rows.filter(predicate), [predicate]);

  const activeCount = filters.filter((f) => f.values.length > 0).length;

  return {
    filters,
    fieldMap,
    setFilter,
    updateOperator,
    removeFilter,
    clearAll,
    predicate,
    apply,
    activeCount,
  };
}
