import * as React from "react";
import { X } from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FilterValueMenu } from "./FilterValueMenu";
import { OPERATORS, DEFAULT_OPERATORS } from "./operators";
import { resolveOptions, type ActiveFilter, type FilterField, type OperatorId } from "./types";

interface FilterPillProps {
  field: FilterField;
  filter: ActiveFilter;
  onChangeValues: (values: string[]) => void;
  onChangeOperator: (operator: OperatorId) => void;
  onRemove: () => void;
}

const segment = "px-2 py-1 text-xs transition-colors hover:bg-muted";

export function FilterPill({ field, filter, onChangeValues, onChangeOperator, onRemove }: FilterPillProps) {
  const [valuesOpen, setValuesOpen] = React.useState(false);
  const Icon = field.icon;
  const operatorIds = field.operators ?? DEFAULT_OPERATORS[field.type];

  const valueLabel = React.useMemo(() => {
    if (filter.values.length === 0) return "…";
    if (field.type === "text") return `"${filter.values[0]}"`;
    if (field.type === "date") {
      const [from, to] = filter.values;
      if (from && to) return `${format(parseISO(from), "MMM d")} – ${format(parseISO(to), "MMM d")}`;
      if (from) return `After ${format(parseISO(from), "MMM d")}`;
      if (to) return `Before ${format(parseISO(to), "MMM d")}`;
      return "…";
    }
    const options = resolveOptions(field);
    const labelOf = (v: string) => options.find((o) => o.value === v)?.label ?? v;
    if (filter.values.length === 1) return labelOf(filter.values[0]);
    if (filter.values.length === 2) return filter.values.map(labelOf).join(", ");
    return `${filter.values.length} selected`;
  }, [field, filter.values]);

  return (
    <div className="flex items-center overflow-hidden rounded-md border bg-card text-sm shadow-sm">
      {/* property */}
      <span className="flex items-center gap-1.5 border-r px-2 py-1 text-xs font-medium">
        {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
        {field.label}
      </span>

      {/* operator */}
      {operatorIds.length > 1 ? (
        <DropdownMenu>
          <DropdownMenuTrigger className={cn(segment, "border-r text-muted-foreground outline-none")}>
            {OPERATORS[filter.operator].label}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[8rem]">
            {operatorIds.map((id) => (
              <DropdownMenuItem
                key={id}
                onClick={() => onChangeOperator(id)}
                className={cn("text-xs", id === filter.operator && "font-medium text-primary")}
              >
                {OPERATORS[id].label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <span className={cn(segment, "border-r text-muted-foreground")}>
          {OPERATORS[filter.operator].label}
        </span>
      )}

      {/* value(s) */}
      <Popover open={valuesOpen} onOpenChange={setValuesOpen}>
        <PopoverTrigger className={cn(segment, "border-r font-medium outline-none")}>
          {valueLabel}
        </PopoverTrigger>
        <PopoverContent className={cn("p-0", field.type === "date" ? "w-auto" : "w-56")} align="start">
          <FilterValueMenu
            field={field}
            selected={filter.values}
            onChange={onChangeValues}
            onClose={() => setValuesOpen(false)}
          />
        </PopoverContent>
      </Popover>

      {/* remove */}
      <button
        type="button"
        onClick={onRemove}
        className="px-1.5 py-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label={`Remove ${field.label} filter`}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
