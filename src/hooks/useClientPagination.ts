import * as React from "react";

/**
 * Client-side pagination for a fully-loaded array. Returns the current page's
 * slice plus the state the shared `DataTablePagination` footer needs. Use this
 * for raw `<table>` lists that hold the whole dataset in memory (the shared
 * `DataTable` component already paginates internally — this is for tables built
 * by hand).
 */
export function useClientPagination<T>(items: T[], initialPageSize = 10) {
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSizeState] = React.useState(initialPageSize);

  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const clampedIndex = Math.min(Math.max(0, pageIndex), totalPages - 1);

  // Snap back into range when the data shrinks beneath the current page.
  React.useEffect(() => {
    if (pageIndex > totalPages - 1) setPageIndex(totalPages - 1);
  }, [pageIndex, totalPages]);

  const pageItems = React.useMemo(
    () => items.slice(clampedIndex * pageSize, clampedIndex * pageSize + pageSize),
    [items, clampedIndex, pageSize],
  );

  const setPageSize = React.useCallback((size: number) => {
    setPageSizeState(size);
    setPageIndex(0);
  }, []);

  return {
    pageIndex: clampedIndex,
    pageSize,
    totalItems,
    pageItems,
    setPageIndex,
    setPageSize,
  };
}
