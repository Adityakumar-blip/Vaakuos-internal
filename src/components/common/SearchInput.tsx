import * as React from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export interface SearchInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  value: string;
  onValueChange: (value: string) => void;
  /** Class applied to the outer wrapper (controls width). Defaults to `max-w-xs`. */
  wrapperClassName?: string;
}

/**
 * Shared search field used across list/table pages. Renders a leading search
 * icon, the input, and a trailing clear (×) button when there is a value.
 */
export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ value, onValueChange, placeholder = "Search...", className, wrapperClassName, ...props }, ref) => {
    return (
      <div className={cn("relative w-full max-w-xs", wrapperClassName)}>
        <Search className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={ref}
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          placeholder={placeholder}
          className={cn("h-9 pl-9 pr-9", className)}
          {...props}
        />
        {value && (
          <button
            type="button"
            onClick={() => onValueChange("")}
            className="absolute right-2.5 top-1/2 z-10 -translate-y-1/2 rounded-sm text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  },
);
SearchInput.displayName = "SearchInput";
