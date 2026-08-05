import * as React from "react";
import { ListFilter, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { FilterValueMenu } from "./FilterValueMenu";
import { defaultOperatorFor } from "./operators";
import type { ActiveFilter, FilterField, OperatorId } from "./types";

interface AddFilterButtonProps {
  fields: FilterField[];
  active: ActiveFilter[];
  onSet: (fieldId: string, values: string[], operator?: OperatorId) => void;
  /** compact icon-only trigger (used when pills already present) */
  compact?: boolean;
}

export function AddFilterButton({ fields, active, onSet, compact }: AddFilterButtonProps) {
  const [open, setOpen] = React.useState(false);
  const [pickedId, setPickedId] = React.useState<string | null>(null);

  const picked = pickedId ? fields.find((f) => f.id === pickedId) ?? null : null;
  const activeMap = new Set(active.map((a) => a.fieldId));

  const reset = () => setPickedId(null);
  const close = () => {
    setOpen(false);
    setTimeout(reset, 150);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setTimeout(reset, 150);
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-9 gap-1.5 border-dashed text-sm font-normal text-muted-foreground",
            compact && "px-2"
          )}
        >
          <ListFilter className="h-3.5 w-3.5" />
          {!compact && "Filter"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn("p-0", picked?.type === "date" ? "w-auto" : "w-56")} align="start">
        {!picked ? (
          <Command>
            <CommandInput placeholder="Filter by…" className="h-9" />
            <CommandList>
              <CommandEmpty>No properties.</CommandEmpty>
              <CommandGroup>
                {fields.map((field) => {
                  const Icon = field.icon;
                  return (
                    <CommandItem
                      key={field.id}
                      onSelect={() => {
                        if (field.type === "boolean") {
                          // boolean has a single implicit "true" value
                          onSet(field.id, ["true"], defaultOperatorFor(field.type));
                          close();
                          return;
                        }
                        setPickedId(field.id);
                      }}
                      className="gap-2"
                    >
                      {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
                      <span>{field.label}</span>
                      {activeMap.has(field.id) && (
                        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                      )}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        ) : (
          <div>
            <button
              type="button"
              onClick={reset}
              className="flex w-full items-center gap-1.5 border-b px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              {picked.label}
            </button>
            <FilterValueMenu
              field={picked}
              selected={active.find((a) => a.fieldId === picked.id)?.values ?? []}
              onChange={(values) => onSet(picked.id, values, defaultOperatorFor(picked.type))}
              onClose={close}
            />
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
