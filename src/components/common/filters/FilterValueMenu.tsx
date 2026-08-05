import * as React from "react";
import { Check } from "lucide-react";
import { format, parseISO } from "date-fns";
import type { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { resolveOptions, type FilterField } from "./types";

interface FilterValueMenuProps {
  field: FilterField;
  selected: string[];
  onChange: (values: string[]) => void;
  /** close the surrounding popover (used for single-select / text apply) */
  onClose?: () => void;
}

const toISO = (date?: Date) => (date ? format(date, "yyyy-MM-dd") : "");

/** The value-selection step — adapts to the field type (options, text, etc.). */
export function FilterValueMenu({ field, selected, onChange, onClose }: FilterValueMenuProps) {
  const multi = field.type === "multiselect";

  if (field.type === "text") {
    return (
      <form
        className="p-2"
        onSubmit={(e) => {
          e.preventDefault();
          onClose?.();
        }}
      >
        <Input
          autoFocus
          defaultValue={selected[0] ?? ""}
          placeholder={`${field.label}…`}
          className="h-8"
          onChange={(e) => onChange(e.target.value ? [e.target.value] : [])}
        />
      </form>
    );
  }

  if (field.type === "date") {
    const [from, to] = selected;
    const range: DateRange | undefined = from || to
      ? { from: from ? parseISO(from) : undefined, to: to ? parseISO(to) : undefined }
      : undefined;

    return (
      <Calendar
        mode="range"
        defaultMonth={range?.from}
        selected={range}
        onSelect={(next) => onChange(next?.from || next?.to ? [toISO(next?.from), toISO(next?.to)] : [])}
        numberOfMonths={2}
        initialFocus
      />
    );
  }

  const options = resolveOptions(field);
  const selectedSet = new Set(selected);

  const toggle = (value: string) => {
    if (multi) {
      const next = new Set(selectedSet);
      next.has(value) ? next.delete(value) : next.add(value);
      onChange(Array.from(next));
    } else {
      onChange(selectedSet.has(value) ? [] : [value]);
      onClose?.();
    }
  };

  return (
    <Command>
      {(field.searchable ?? options.length > 8) && (
        <CommandInput placeholder={`Filter ${field.label.toLowerCase()}…`} className="h-9" />
      )}
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>
        <CommandGroup>
          {options.map((option) => {
            const isSelected = selectedSet.has(option.value);
            const OptIcon = option.icon;
            return (
              <CommandItem key={option.value} onSelect={() => toggle(option.value)} className="gap-2">
                <div
                  className={cn(
                    "flex h-4 w-4 items-center justify-center border transition-colors",
                    multi ? "rounded-[4px]" : "rounded-full",
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground/30 [&_svg]:invisible"
                  )}
                >
                  <Check className="h-3 w-3" />
                </div>
                {option.dot && <span className={cn("h-2 w-2 shrink-0 rounded-full", option.dot)} />}
                {OptIcon && <OptIcon className="h-3.5 w-3.5 text-muted-foreground" />}
                <span className="truncate">{option.label}</span>
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </Command>
  );
}
