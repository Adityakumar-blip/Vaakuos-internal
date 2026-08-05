import * as React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowPathIcon as Loader2, ExclamationCircleIcon as AlertCircle } from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, ChevronDown, ArrowUp, ArrowDown, ChevronsUpDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTablePagination } from "@/components/ui/data-table-pagination";

export interface Column<T> {
  key?: string;
  accessorKey?: string;
  header: React.ReactNode | ((props: {
    table: {
      getIsAllPageRowsSelected: () => boolean;
      getIsSomePageRowsSelected: () => boolean;
      toggleAllPageRowsSelected: (value: boolean) => void;
    }
  }) => React.ReactNode);
  render?: (item: T) => React.ReactNode;
  cell?: (props: {
    row: {
      original: T;
      id: string;
      getIsSelected: () => boolean;
      toggleSelected: (value: boolean) => void;
      getValue: (key: string) => unknown;
    };
    table: {
      getIsAllPageRowsSelected: () => boolean;
      getIsSomePageRowsSelected: () => boolean;
      toggleAllPageRowsSelected: (value: boolean) => void;
    };
    getValue: (key: string) => unknown;
  }) => React.ReactNode;
  className?: string;
  headerClassName?: string;
  id?: string;
  /** Value to sort by — needed when the column renders something other than a plain field. */
  sortValue?: (item: T) => string | number | Date | null | undefined;
  // Compatibility with TanStack ColumnDef
  enableSorting?: boolean;
  enableHiding?: boolean;
  enableRowSelection?: boolean;
  meta?: Record<string, unknown>;
}


export interface BulkActionOption<T> {
  label: string;
  icon?: React.ReactNode;
  onClick?: (items: T[]) => void;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  options?: BulkActionOption<T>[];
  component?: React.ReactNode;
}

export interface BulkAction<T> {
  label: string;
  icon?: React.ReactNode;
  onClick?: (items: T[]) => void;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  shortcut?: string;
  options?: BulkActionOption<T>[];
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  isLoading?: boolean;
  error?: { data?: { message?: string }; message?: string } | any;
  selectable?: boolean;
  selectedItems?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  rowSelection?: Record<string, boolean>;
  onRowSelectionChange?: (selection: Record<string, boolean>) => void;
  getItemId?: (item: T) => string;
  emptyMessage?: React.ReactNode;
  emptyDescription?: React.ReactNode;
  loadingMessage?: string;
  onRetry?: () => void;
  onRowClick?: (item: T) => void;
  className?: string;
  rowClassName?: string | ((item: T) => string);
  bulkActions?: BulkAction<T>[];
  /** optional strip rendered inside the card, above the table (search, filters, etc.) */
  toolbar?: React.ReactNode;
  showPagination?: boolean;
  pageSize?: number;
  initialPageIndex?: number;
  onPageIndexChange?: (index: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  /**
   * Total number of records across all pages. Supply this for **server-side**
   * pagination: `data` is treated as the already-fetched current page (it is
   * not sliced locally) and the footer paginates against this total. When
   * omitted, pagination is client-side over the full `data` array.
   */
  totalItems?: number;
  /**
   * When true, the card grows with its rows but stops at the bottom of the
   * viewport, after which only the table body scrolls — the toolbar/selection
   * header stay pinned at the top and the pagination stays pinned at the
   * bottom. Few rows means a short card, not a tall empty one.
   */
  fillHeight?: boolean;
  /**
   * Supply both to sort server-side: the table stops sorting locally and only
   * reports the requested sort. Omit for built-in client-side sorting.
   */
  sort?: SortState | null;
  onSortChange?: (sort: SortState | null) => void;
}

export interface SortState {
  key: string;
  dir: "asc" | "desc";
}

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });

function compareValues(a: unknown, b: unknown) {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
  if (typeof a === "number" && typeof b === "number") return a - b;
  if (typeof a === "boolean" && typeof b === "boolean") return Number(a) - Number(b);
  // numeric collation also puts ISO dates and number-ish strings in the right order
  return collator.compare(String(a), String(b));
}

/**
 * Measures the distance to the bottom of the nearest scrollable ancestor (or the
 * viewport) — the caller applies it as a `max-height` cap, so the table stops at
 * the fold without stretching past its own content.
 *
 * This is measurement-based rather than flex/`h-full` because the app's content
 * scroll container is a Radix ScrollArea whose internal `display:table` wrapper
 * breaks CSS `height:100%` chains — flex stretching can't reach through it.
 */
function useFillHeight(enabled: boolean) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [height, setHeight] = React.useState<number>();

  React.useLayoutEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    const el = ref.current;
    if (!el) return;

    const BOTTOM_GAP = 16; // breathing room below the table
    const MIN_HEIGHT = 220; // never cap tighter than this, however low the fold sits

    // Nearest ancestor that bounds/scrolls our height (Radix viewport, or any
    // overflow container). Falls back to the browser viewport.
    const resolveBoundary = (): { node: HTMLElement | null; bottom: number } => {
      let node = el.parentElement;
      while (node) {
        if (node.hasAttribute("data-radix-scroll-area-viewport")) {
          return { node, bottom: node.getBoundingClientRect().bottom };
        }
        const oy = window.getComputedStyle(node).overflowY;
        if ((oy === "auto" || oy === "scroll") && node.clientHeight > 0) {
          return { node, bottom: node.getBoundingClientRect().bottom };
        }
        node = node.parentElement;
      }
      return { node: null, bottom: window.innerHeight };
    };

    const recompute = () => {
      const top = el.getBoundingClientRect().top;
      const { bottom } = resolveBoundary();
      const next = Math.max(MIN_HEIGHT, Math.round(bottom - top - BOTTOM_GAP));
      setHeight((prev) => (prev === next ? prev : next));
    };

    recompute();

    const ro = new ResizeObserver(recompute);
    if (el.parentElement) ro.observe(el.parentElement);
    const { node: boundaryNode } = resolveBoundary();
    if (boundaryNode) ro.observe(boundaryNode);
    window.addEventListener("resize", recompute);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", recompute);
    };
  }, [enabled]);

  return { ref, height };
}

export function DataTable<T>({
  data,
  columns,
  isLoading = false,
  error,
  selectable = false,
  selectedItems = [],
  onSelectionChange,
  rowSelection = {},
  onRowSelectionChange,
  getItemId = (item: T) => String((item as Record<string, unknown>)?.id ?? ""),
  emptyMessage = "No data found",
  emptyDescription = "Get started by adding your first item",
  loadingMessage = "Loading data...",
  onRetry,
  onRowClick,
  className,
  rowClassName,
  bulkActions = [],
  toolbar,
  showPagination = true,
  pageSize = 10,
  initialPageIndex = 0,
  onPageIndexChange,
  onPageSizeChange,
  pageSizeOptions,
  totalItems: totalItemsProp,
  fillHeight = true,
  sort: sortProp,
  onSortChange,
}: DataTableProps<T>) {
  const { ref: fillRef, height: fillHeightPx } = useFillHeight(fillHeight);
  // Pagination: controlled when `onPageIndexChange` is supplied, else internal.
  const [internalPageIndex, setInternalPageIndex] = React.useState(initialPageIndex);
  const requestedPageIndex = onPageIndexChange ? initialPageIndex : internalPageIndex;
  const setPageIndex = onPageIndexChange ?? setInternalPageIndex;

  // Sorting: controlled when `onSortChange` is supplied (server sorts), else internal.
  const [internalSort, setInternalSort] = React.useState<SortState | null>(null);
  const sort = onSortChange ? sortProp ?? null : internalSort;

  const columnSortKey = (c: Column<T>) => c.key || c.accessorKey || c.id || "";
  const isSortable = (c: Column<T>) =>
    c.enableSorting !== false &&
    !!columnSortKey(c) &&
    // an empty header has nowhere to hang the control (select / actions columns)
    !(typeof c.header === "string" && c.header.trim() === "") &&
    (!!c.sortValue || (!!data[0] && (c.key || c.accessorKey || "") in (data[0] as object)));

  const toggleSort = (key: string) => {
    const next: SortState | null =
      sort?.key !== key ? { key, dir: "asc" } : sort.dir === "asc" ? { key, dir: "desc" } : null;
    (onSortChange ?? setInternalSort)(next);
    setPageIndex(0); // re-sorted list makes the old page number meaningless
  };

  const sortedData = React.useMemo(() => {
    if (!sort || onSortChange) return data;
    const column = columns.find((c) => columnSortKey(c) === sort.key);
    if (!column) return data;
    const getValue =
      column.sortValue ??
      ((item: T) => (item as Record<string, unknown>)[column.key || column.accessorKey || ""]);
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...data].sort((a, b) => dir * compareValues(getValue(a), getValue(b)));
  }, [data, columns, sort, onSortChange]);

  // Server-side mode: `totalItemsProp` is supplied and `data` is the current
  // page already, so it must not be sliced locally.
  // ponytail: local sorting then only orders the fetched page — pass
  // `sort`/`onSortChange` and sort in the query once the API takes sort params.
  const isServerPaginated = totalItemsProp !== undefined;
  const totalItems = totalItemsProp ?? data.length;
  const totalPages = showPagination ? Math.max(1, Math.ceil(totalItems / pageSize)) : 1;
  const currentPageIndex = showPagination ? Math.min(Math.max(0, requestedPageIndex), totalPages - 1) : 0;
  const pageData = showPagination && !isServerPaginated
    ? sortedData.slice(currentPageIndex * pageSize, currentPageIndex * pageSize + pageSize)
    : sortedData;
  const toggleItem = (id: string) => {
    if (onRowSelectionChange) {
      const newSelection = { ...rowSelection };
      if (newSelection[id]) {
        delete newSelection[id];
      } else {
        newSelection[id] = true;
      }
      onRowSelectionChange(newSelection);
      return;
    }

    if (!onSelectionChange) return;
    const newSelection = selectedItems.includes(id)
      ? selectedItems.filter((i) => i !== id)
      : [...selectedItems, id];
    onSelectionChange(newSelection);
  };

  const isSelected = (id: string) => {
    if (onRowSelectionChange) {
      return !!rowSelection[id];
    }
    return selectedItems.includes(id);
  };

  // Select-all operates on the visible page; selections on other pages are kept.
  const pageIds = pageData.map(getItemId);
  const allPageSelected = pageData.length > 0 && pageIds.every((id) => isSelected(id));
  const somePageSelected = pageIds.some((id) => isSelected(id)) && !allPageSelected;

  const toggleAll = () => {
    if (onRowSelectionChange) {
      const newSelection = { ...rowSelection };
      if (allPageSelected) {
        pageIds.forEach((id) => delete newSelection[id]);
      } else {
        pageIds.forEach((id) => { newSelection[id] = true; });
      }
      onRowSelectionChange(newSelection);
      return;
    }

    if (!onSelectionChange) return;
    onSelectionChange(
      allPageSelected
        ? selectedItems.filter((id) => !pageIds.includes(id))
        : Array.from(new Set([...selectedItems, ...pageIds]))
    );
  };

  const selectionCount = onRowSelectionChange ? Object.keys(rowSelection).length : selectedItems.length;

  const getRowClassName = (item: T) => {
    if (typeof rowClassName === "function") {
      return rowClassName(item);
    }
    return rowClassName || "";
  };

  const renderOptions = (opts: BulkActionOption<T>[]) => {
    return opts.map((option) => {
      if (option.component) {
        return (
          <div key={option.label} className="p-2 min-w-[200px]">
            {option.component}
          </div>
        );
      }
      if (option.options && option.options.length > 0) {
        return (
          <DropdownMenuSub key={option.label}>
            <DropdownMenuSubTrigger className="cursor-pointer">
              {option.icon && <span className="mr-2 inline-flex items-center opacity-70">{option.icon}</span>}
              {option.label}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {renderOptions(option.options)}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        );
      }
      return (
        <DropdownMenuItem
          key={option.label}
          onClick={() => {
            const selectedData = data.filter((item) => isSelected(getItemId(item)));
            if (option.onClick) option.onClick(selectedData);
          }}
          className={cn(
            "cursor-pointer",
            option.variant === "destructive" && "text-destructive focus:text-destructive focus:bg-destructive/10"
          )}
        >
          {option.icon && <span className="mr-2 inline-flex items-center opacity-70">{option.icon}</span>}
          {option.label}
        </DropdownMenuItem>
      );
    });
  };

  return (
    <Card
      ref={fillRef}
      style={fillHeight && fillHeightPx ? { maxHeight: fillHeightPx } : undefined}
      className={cn("overflow-hidden flex flex-col rounded-2xl border-border/50 shadow-sm", fillHeight && "min-h-0", className)}
    >
      {/* Toolbar (search / filters) */}
      {toolbar && (
        <div className="border-b border-border/60">
          {toolbar}
        </div>
      )}

      {/* Selection / Bulk Actions Header */}
      {selectionCount > 0 && bulkActions.length > 0 && (
        <div className="bg-primary/5 border-b border-border/60 px-3 py-2.5 flex items-center justify-between animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-primary">
              {selectionCount} selected
            </span>
            <div className="h-4 w-px bg-border mx-2" />
            <div className="flex items-center gap-2">
              {/* Primary Action (first in array) */}
              {bulkActions.length > 0 && (
                bulkActions[0].options ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant={bulkActions[0].variant || "default"} className="h-8 gap-1">
                        {bulkActions[0].icon && <span className="mr-2">{bulkActions[0].icon}</span>}
                        {bulkActions[0].label}
                        <ChevronDown size={14} className="ml-1 opacity-70" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {renderOptions(bulkActions[0].options)}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button
                    key={bulkActions[0].label}
                    size="sm"
                    variant={bulkActions[0].variant || "default"}
                    onClick={() => {
                      const selectedData = data.filter((item) => isSelected(getItemId(item)));
                      if (bulkActions[0].onClick) bulkActions[0].onClick(selectedData);
                    }}
                    className="h-8"
                  >
                    {bulkActions[0].icon && <span className="mr-2">{bulkActions[0].icon}</span>}
                    {bulkActions[0].label}
                  </Button>
                )
              )}

              {/* More Actions Dropdown */}
              {bulkActions.length > 1 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="outline" className="h-8 gap-1">
                      <MoreHorizontal size={14} />
                      More
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {bulkActions.slice(1).map((action) => {
                      if (action.options && action.options.length > 0) {
                        return (
                          <DropdownMenuSub key={action.label}>
                            <DropdownMenuSubTrigger className="cursor-pointer">
                              {action.icon && <span className="mr-2 inline-flex items-center opacity-70">{action.icon}</span>}
                              {action.label}
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent>
                              {renderOptions(action.options)}
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>
                        );
                      }
                      return (
                        <DropdownMenuItem
                          key={action.label}
                          onClick={() => {
                            const selectedData = data.filter((item) => isSelected(getItemId(item)));
                            if (action.onClick) action.onClick(selectedData);
                          }}
                          className={cn("cursor-pointer", action.variant === 'destructive' && "text-destructive focus:text-destructive focus:bg-destructive/10")}
                        >
                          {action.icon && <span className="mr-2 inline-flex items-center opacity-70">{action.icon}</span>}
                          {action.label}
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>
      )}

      <div className={cn(fillHeight ? "flex-1 min-h-0 overflow-auto" : "overflow-x-auto")}>
        <table className="w-full border-separate border-spacing-0">
          {/* Opaque, not blurred: backdrop-filter escapes the Card's rounded
              overflow clip in Chrome and squares off the top corners. */}
          <thead className="sticky top-0 z-10 bg-muted">
            <tr>
              {(selectable || onRowSelectionChange) && !columns.find(c => c.id === 'select') && (
                <th className="border-b border-border/50 pl-5 pr-3 py-4 text-left w-12">
                  <Checkbox
                    checked={allPageSelected}
                    onCheckedChange={toggleAll}
                    disabled={data.length === 0}
                    aria-label="Select all"
                  />
                </th>
              )}
              {columns.map((column: Column<T>) => (
                <th
                  key={column.id || column.key || column.accessorKey}
                  className={cn(
                    "border-b border-border/50 px-4 py-4 text-left text-[13px] font-medium text-muted-foreground first:pl-5 last:pr-5",
                    column.headerClassName
                  )}
                >
                  {(() => {
                    const content = typeof column.header === "function" ? column.header({
                      table: {
                        getIsAllPageRowsSelected: () => allPageSelected,
                        getIsSomePageRowsSelected: () => somePageSelected,
                        toggleAllPageRowsSelected: (value: boolean) => toggleAll()
                      }
                    }) : column.header;

                    if (!isSortable(column)) return content;

                    const key = columnSortKey(column);
                    const active = sort?.key === key ? sort.dir : null;
                    const SortIcon = active === "asc" ? ArrowUp : active === "desc" ? ArrowDown : ChevronsUpDown;
                    return (
                      <button
                        type="button"
                        onClick={() => toggleSort(key)}
                        aria-label={`Sort by ${typeof column.header === "string" ? column.header : key}`}
                        className={cn(
                          "group/sort -ml-1 inline-flex items-center gap-1 rounded px-1 py-0.5 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                          active && "text-foreground"
                        )}
                      >
                        {content}
                        <SortIcon
                          className={cn(
                            "h-3.5 w-3.5 shrink-0 transition-opacity",
                            active ? "opacity-100" : "opacity-0 group-hover/sort:opacity-60"
                          )}
                        />
                      </button>
                    );
                  })()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, rowIdx) => (
                <tr key={`skeleton-${rowIdx}`}>
                  {(selectable || onRowSelectionChange) && !columns.find(c => c.id === 'select') && (
                    <td className="border-b border-border/40 pl-5 pr-3 py-[18px]">
                      <Skeleton className="h-4 w-4 rounded" />
                    </td>
                  )}
                  {columns.map((column: Column<T>, colIdx) => (
                    <td
                      key={column.id || column.key || column.accessorKey}
                      className="border-b border-border/40 px-4 py-[18px] first:pl-5 last:pr-5"
                    >
                      <Skeleton
                        className={cn("h-4", colIdx === 0 ? "w-32" : "w-20")}
                      />
                    </td>
                  ))}
                </tr>
              ))
            ) : error ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable || onRowSelectionChange ? 1 : 0)}
                  className="p-8 text-center"
                >
                  <div className="flex flex-col items-center gap-3 text-destructive">
                    <AlertCircle className="h-8 w-8" />
                    <div>
                      <p className="font-medium">Failed to load data</p>
                      <p className="text-sm text-muted-foreground">
                        {error?.data?.message || error?.message || "An error occurred while fetching data"}
                      </p>
                    </div>
                    {onRetry && (
                      <Button variant="outline" size="sm" onClick={onRetry}>
                        Retry
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable || onRowSelectionChange ? 1 : 0)}
                  className="p-8 text-center"
                >
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <AlertCircle className="h-8 w-8" />
                    <p className="font-medium">{emptyMessage}</p>
                    <p className="text-sm">{emptyDescription}</p>
                  </div>
                </td>
              </tr>
            ) : (
              pageData.map((item) => {
                const itemId = getItemId(item);
                return (
                  <tr
                    key={itemId}
                    className={cn(
                      "group transition-colors hover:bg-muted/40",
                      isSelected(itemId) && "bg-primary/[0.04]",
                      onRowClick && "cursor-pointer",
                      getRowClassName(item)
                    )}
                    onClick={() => onRowClick?.(item)}
                  >
                    {(selectable || onRowSelectionChange) && !columns.find(c => c.id === 'select') && (
                      <td className="border-b border-border/40 pl-5 pr-3 py-[18px] group-last:border-0" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={isSelected(itemId)}
                          onCheckedChange={() => toggleItem(itemId)}
                          aria-label={`Select ${itemId}`}
                        />
                      </td>
                    )}
                    {columns.map((column: Column<T>) => (
                      <td
                        key={column.id || column.key || column.accessorKey}
                        className={cn("border-b border-border/40 px-4 py-4 whitespace-nowrap text-sm first:pl-5 last:pr-5 group-last:border-0", column.className)}
                      >
                        {column.render
                          ? column.render(item)
                          : column.cell
                            ? column.cell({
                              row: {
                                original: item,
                                id: itemId,
                                getIsSelected: () => isSelected(itemId),
                                toggleSelected: (value: boolean) => toggleItem(itemId),
                                getValue: (key: string) => (item as Record<string, unknown>)[key]
                              },
                              table: {
                                getIsAllPageRowsSelected: () => allPageSelected,
                                getIsSomePageRowsSelected: () => somePageSelected,
                                toggleAllPageRowsSelected: (value: boolean) => toggleAll()
                              },
                              getValue: (key: string) => (item as Record<string, unknown>)[key]
                            })
                            : (item as Record<string, unknown>)[column.key || column.accessorKey || ""] as React.ReactNode}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {showPagination && !isLoading && !error && totalItems > 0 && (
        <DataTablePagination
          pageIndex={currentPageIndex}
          pageSize={pageSize}
          totalItems={totalItems}
          onPageChange={setPageIndex}
          onPageSizeChange={onPageSizeChange}
          pageSizeOptions={pageSizeOptions}
          className={fillHeight ? "shrink-0" : undefined}
        />
      )}
    </Card>
  );
}
