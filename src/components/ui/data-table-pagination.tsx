import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface DataTablePaginationProps {
  /** 0-based current page index */
  pageIndex: number;
  pageSize: number;
  totalItems: number;
  /** called with the new 0-based page index */
  onPageChange: (pageIndex: number) => void;
  /** when provided, renders a "rows per page" selector */
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  className?: string;
}

/** Build a windowed list of page numbers (1-based) with `...` gaps. */
function getPageNumbers(currentPage: number, totalPages: number): (number | "...")[] {
  const pages: (number | "...")[] = [];
  const maxVisible = 5;

  if (totalPages <= maxVisible) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
    return pages;
  }

  pages.push(1);
  if (currentPage > 3) pages.push("...");

  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  if (currentPage < totalPages - 2) pages.push("...");
  pages.push(totalPages);
  return pages;
}

/**
 * Reusable table pagination footer. Renders an entry-range summary on the left
 * and, on the right, a rounded "pill" containing the page controls: prev/next
 * arrows, windowed page numbers, a "rows per page" selector, and a "Go to page"
 * jump input. Page indexes are 0-based on the wire; the UI displays them 1-based.
 */
export function DataTablePagination({
  pageIndex,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  className,
}: DataTablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(pageIndex, totalPages - 1) + 1; // 1-based for display
  const from = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, totalItems);

  const [jumpValue, setJumpValue] = React.useState("");

  const goTo = (page1Based: number) => {
    const clamped = Math.min(Math.max(1, page1Based), totalPages);
    onPageChange(clamped - 1);
  };

  const commitJump = () => {
    const parsed = parseInt(jumpValue, 10);
    if (!Number.isNaN(parsed)) goTo(parsed);
    setJumpValue("");
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-t border-border/40 px-5 py-3.5 text-sm sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <span>Viewing</span>
        <span className="font-medium tabular-nums text-foreground">{from}–{to}</span>
        <span>of</span>
        <span className="font-medium tabular-nums text-foreground">{totalItems}</span>
        <span>results</span>
      </div>

      <div className="flex items-center gap-2">
        {/* Page controls */}
        <div className="flex h-9 shrink-0 items-center gap-0.5 rounded-xl border border-border/60 bg-background p-1">
          <button
            type="button"
            className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
            onClick={() => goTo(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {getPageNumbers(currentPage, totalPages).map((page, idx) =>
            page === "..." ? (
              <span
                key={`ellipsis-${idx}`}
                className="px-1 text-muted-foreground select-none"
              >
                …
              </span>
            ) : (
              <button
                key={page}
                type="button"
                className={cn(
                  "inline-flex h-7 min-w-7 items-center justify-center rounded-lg px-2 text-[13px] font-medium tabular-nums transition-colors",
                  page === currentPage
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
                onClick={() => goTo(page)}
                aria-current={page === currentPage ? "page" : undefined}
              >
                {page}
              </button>
            ),
          )}

          <button
            type="button"
            className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
            onClick={() => goTo(currentPage + 1)}
            disabled={currentPage === totalPages}
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Rows per page */}
        {onPageSizeChange && (
          <Select
            value={pageSize.toString()}
            onValueChange={(val) => onPageSizeChange(Number(val))}
          >
            <SelectTrigger className="h-9 w-auto shrink-0 gap-1.5 rounded-xl border-border/60 bg-background px-3 text-[13px] font-medium text-foreground">
              <SelectValue>{pageSize} / page</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((option) => (
                <SelectItem key={option} value={option.toString()}>
                  {option} / page
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Go to page */}
        {totalPages > 1 && (
          <div className="hidden shrink-0 items-center gap-1.5 whitespace-nowrap text-muted-foreground md:flex">
            <span>Go to</span>
            <input
              type="number"
              min={1}
              max={totalPages}
              value={jumpValue}
              onChange={(e) => setJumpValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitJump();
              }}
              onBlur={commitJump}
              placeholder={currentPage.toString()}
              className="h-9 w-12 shrink-0 rounded-xl border border-border/60 bg-background px-2 text-center text-[13px] font-medium tabular-nums text-foreground outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-primary focus:ring-2 focus:ring-primary/20 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              aria-label="Go to page"
            />
          </div>
        )}
      </div>
    </div>
  );
}
