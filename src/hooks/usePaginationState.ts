import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

interface UsePaginationStateOptions {
  defaultPageSize?: number;
  defaultPageIndex?: number;
}

interface UsePaginationStateReturn {
  pageSize: number;
  pageIndex: number;
  setPageSize: (size: number) => void;
  setPageIndex: (index: number) => void;
}

/**
 * Custom hook to manage pagination state with URL persistence
 * 
 * @example
 * ```tsx
 * const { pageSize, pageIndex, setPageSize, setPageIndex } = usePaginationState({
 *   defaultPageSize: 10,
 *   defaultPageIndex: 0,
 * });
 * 
 * // Use with TableHeader
 * <TableHeaderComponent
 *   entriesPerPage={pageSize}
 *   onEntriesChange={setPageSize}
 * />
 * 
 * // Use with DataTable
 * <DataTable
 *   pageSize={pageSize}
 *   initialPageIndex={pageIndex}
 *   onPageIndexChange={setPageIndex}
 * />
 * ```
 */
export function usePaginationState({
  defaultPageSize = 10,
  defaultPageIndex = 0,
}: UsePaginationStateOptions = {}): UsePaginationStateReturn {
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize state from URL or defaults
  const [pageSize, setPageSizeState] = useState<number>(() => {
    const urlPageSize = searchParams.get('pageSize');
    return urlPageSize ? parseInt(urlPageSize, 10) : defaultPageSize;
  });

  const [pageIndex, setPageIndexState] = useState<number>(() => {
    const urlPage = searchParams.get('page');
    return urlPage ? parseInt(urlPage, 10) - 1 : defaultPageIndex; // Convert to 0-indexed
  });

  // Update URL when pageSize changes
  const setPageSize = useCallback((size: number) => {
    setPageSizeState(size);
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      newParams.set('pageSize', size.toString());
      // Reset to page 1 when page size changes
      newParams.set('page', '1');
      return newParams;
    }, { replace: true });
    // Reset page index when page size changes
    setPageIndexState(0);
  }, [setSearchParams]);

  // Update URL when pageIndex changes
  const setPageIndex = useCallback((index: number) => {
    setPageIndexState(index);
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      newParams.set('page', (index + 1).toString()); // Convert to 1-indexed for URL
      return newParams;
    }, { replace: true });
  }, [setSearchParams]);

  return {
    pageSize,
    pageIndex,
    setPageSize,
    setPageIndex,
  };
}
