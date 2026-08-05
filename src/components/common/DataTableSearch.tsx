import * as React from "react";
import { MagnifyingGlassIcon as Search, FunnelIcon as Filter, XMarkIcon as X } from "@heroicons/react/24/outline";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface DataTableSearchProps {
  onSearch: (value: string) => void;
  searchValue: string;
  placeholder?: string;
  filters?: React.ReactNode;
  activeFiltersCount?: number;
  onClearFilters?: () => void;
  className?: string;
}

export const DataTableSearch = ({
  onSearch,
  searchValue,
  placeholder = "Search...",
  filters,
  activeFiltersCount = 0,
  onClearFilters,
  className,
}: DataTableSearchProps) => {
  const inputRef = React.useRef<HTMLInputElement>(null);

  return (
    <div className={cn("flex items-center gap-2 w-full", className)}>
      <div className="relative flex-1 group">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
          <Search className="h-4 w-4" />
        </div>
        
        <Input
          ref={inputRef}
          value={searchValue}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "pl-10 h-11 bg-muted/20 border-border hover:bg-muted/30 focus-visible:ring-1 focus-visible:ring-primary/20 transition-all text-sm",
            filters ? "pr-32" : "pr-20"
          )}
        />

        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {searchValue && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onSearch("")}
              className="h-7 w-7 hover:bg-muted rounded-full transition-colors mr-1"
            >
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          )}

          {filters && (
            <>
              <div className="w-px h-4 bg-border/60 mx-1" />
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className={cn(
                      "h-8 px-2 gap-1.5 hover:bg-muted transition-all transition-colors",
                      activeFiltersCount > 0 && "text-primary font-medium bg-primary/5 hover:bg-primary/10"
                    )}
                  >
                    <Filter className="h-3.5 w-3.5" />
                    <span className="text-xs">Filter</span>
                    {activeFiltersCount > 0 && (
                      <span className="flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full bg-primary text-primary-foreground text-[9px]">
                        {activeFiltersCount}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="end">
                  <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
                    <h4 className="font-semibold text-sm">Filters</h4>
                    {activeFiltersCount > 0 && onClearFilters && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={onClearFilters}
                        className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
                      >
                        Reset all
                      </Button>
                    )}
                  </div>
                  <div className="p-4 space-y-4">
                    {filters}
                  </div>
                </PopoverContent>
              </Popover>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
