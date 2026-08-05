import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/Icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface ChartCardProps {
  title: string;
  subtitle?: string;
  activeFilter?: string;
  filters?: string[];
  onFilterChange?: (filter: string) => void;
  children: React.ReactNode;
  height?: number | string;
  className?: string;
  footer?: React.ReactNode;
}

/**
 * A common card for data visualization to centralize layout and filtering UI
 */
export function ChartCard({
  title,
  subtitle,
  activeFilter,
  filters,
  onFilterChange,
  children,
  height = 400, // Reverted to reasonable default
  className,
  footer
}: ChartCardProps) {
  return (
    <Card 
      className={cn("flex flex-col border-none bg-card/50 backdrop-blur-sm shadow-xl overflow-hidden", className)}
      style={{ height }}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 shrink-0">
        <div className="space-y-1">
          <CardTitle className="text-lg font-normal tracking-tight">{title}</CardTitle>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        
        {filters && filters.length > 0 && (
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-2 bg-background/50 backdrop-blur-sm border-white/5 hover:border-white/10">
                  <Icons.Filter className="h-3.5 w-3.5" />
                  {activeFilter || filters[0]}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                {filters.map((f) => (
                  <DropdownMenuItem key={f} onClick={() => onFilterChange?.(f)}>
                    {f}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="flex-1 p-0 relative overflow-hidden min-h-0">
        {children}
      </CardContent>
      
      {/* {footer && (
        <div className="px-6 py-2 border-t border-white/5 bg-black/20 shrink-0">
          {footer}
        </div>
      )} */}
    </Card>
  );
}
