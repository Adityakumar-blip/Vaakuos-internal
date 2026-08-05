import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FilterPill } from "./FilterPill";
import type { UseDataFiltersResult } from "./useDataFilters";

interface FilterPillsProps<TRow> {
  controller: UseDataFiltersResult<TRow>;
  className?: string;
}

/**
 * Renders only the active filter pills (+ "Clear all"). Returns null when there
 * are no filters — ideal for attaching to the top of a table card while the
 * search box and "+ Filter" button live elsewhere.
 */
export function FilterPills<TRow>({ controller, className }: FilterPillsProps<TRow>) {
  const { filters, fieldMap, setFilter, updateOperator, removeFilter, clearAll, activeCount } = controller;
  if (filters.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-2 px-3 py-2", className)}>
      {filters.map((filter) => {
        const field = fieldMap[filter.fieldId];
        if (!field) return null;
        return (
          <FilterPill
            key={filter.fieldId}
            field={field}
            filter={filter}
            onChangeValues={(values) => setFilter(filter.fieldId, values)}
            onChangeOperator={(operator) => updateOperator(filter.fieldId, operator)}
            onRemove={() => removeFilter(filter.fieldId)}
          />
        );
      })}
      {activeCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAll}
          className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          Clear all
        </Button>
      )}
    </div>
  );
}
