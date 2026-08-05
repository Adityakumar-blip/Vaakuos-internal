import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AddFilterButton } from "./AddFilterButton";
import { FilterPill } from "./FilterPill";
import type { FilterField } from "./types";
import type { UseDataFiltersResult } from "./useDataFilters";

interface FilterBarProps<TRow> {
  fields: FilterField<TRow>[];
  controller: UseDataFiltersResult<TRow>;
  /** element rendered on the left of the controls row (e.g. a search input) */
  leading?: React.ReactNode;
  /**
   * "inline" (default): one wrapping row of search + pills + add button.
   * "attached": a two-row strip (search + add on top, pills below a divider)
   * designed to sit on top of a table card.
   */
  variant?: "inline" | "attached";
  className?: string;
}

/**
 * Linear-style filter bar: a "+ Filter" menu plus editable property/operator/value
 * pills. Fully declarative — pass `fields` and a `useDataFilters` controller.
 */
export function FilterBar<TRow>({
  fields,
  controller,
  leading,
  variant = "inline",
  className,
}: FilterBarProps<TRow>) {
  const { filters, fieldMap, setFilter, updateOperator, removeFilter, clearAll, activeCount } = controller;
  const hasFilters = filters.length > 0;

  const pills = filters.map((filter) => {
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
  });

  const clearButton = activeCount > 0 && (
    <Button
      variant="ghost"
      size="sm"
      onClick={clearAll}
      className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
    >
      Clear all
    </Button>
  );

  if (variant === "attached") {
    return (
      <div className={className}>
        <div className="flex items-center gap-2 px-3 py-2.5">
          {leading && <div className="flex-1 min-w-0">{leading}</div>}
          <AddFilterButton fields={fields} active={filters} onSet={setFilter} compact={false} />
        </div>
        {hasFilters && (
          <div className="flex flex-wrap items-center gap-2 border-t border-border/60 px-3 py-2">
            {pills}
            {clearButton}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {leading}
      {pills}
      <AddFilterButton fields={fields} active={filters} onSet={setFilter} compact={hasFilters} />
      {clearButton}
    </div>
  );
}
