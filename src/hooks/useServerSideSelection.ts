import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { setSelectedData, resetSelectedData } from '@/store/slices/commonSlice';

interface UseServerSideSelectionReturn {
  selectedIds: string[];
  excludedIds: string[];
  selectAll: boolean;
  toggleRow: (id: string) => void;
  toggleSelectAll: (currentPageIds: string[]) => void;
  isRowSelected: (id: string) => boolean;
  getIsAllPageSelected: (currentPageIds: string[]) => boolean;
  clearSelection: () => void;
  getSelectionParams: () => {
    ids?: string[];
    selectAll?: boolean;
    excludedIds?: string[];
  };
}

/**
 * Custom hook for server-side row selection with "select all" support
 * Handles both normal selection and inverted selection (select all with exclusions)
 */
export const useServerSideSelection = (): UseServerSideSelectionReturn => {
  const dispatch = useAppDispatch();
  const { selectedData } = useAppSelector((state) => state.common);
  const { selectAll, selectedIds, excludedIds } = selectedData;

  /**
   * Toggle selection of a single row
   */
  const toggleRow = useCallback(
    (id: string) => {
      if (selectAll) {
        // In selectAll mode, toggle exclusion
        const newExcludedIds = excludedIds.includes(id)
          ? excludedIds.filter((excludedId) => excludedId !== id)
          : [...excludedIds, id];
        
        dispatch(setSelectedData({ excludedIds: newExcludedIds }));
      } else {
        // In normal mode, toggle selection
        const newSelectedIds = selectedIds.includes(id)
          ? selectedIds.filter((selectedId) => selectedId !== id)
          : [...selectedIds, id];
        
        dispatch(setSelectedData({ selectedIds: newSelectedIds }));
      }
    },
    [selectAll, selectedIds, excludedIds, dispatch]
  );

  /**
   * Toggle "select all" mode
   */
  const toggleSelectAll = useCallback(
    (currentPageIds: string[]) => {
      if (selectAll) {
        // Turning off selectAll - reset to empty selection
        dispatch(resetSelectedData());
      } else {
        // Check if all current page items are selected
        const allPageSelected = currentPageIds.every((id) => selectedIds.includes(id));
        
        if (allPageSelected && selectedIds.length === currentPageIds.length) {
          // If only current page is selected, enable selectAll mode
          dispatch(
            setSelectedData({
              selectAll: true,
              selectedIds: [],
              excludedIds: [],
            })
          );
        } else {
          // Select all items on current page
          dispatch(
            setSelectedData({
              selectedIds: currentPageIds,
              excludedIds: [],
            })
          );
        }
      }
    },
    [selectAll, selectedIds, dispatch]
  );

  /**
   * Check if a row is selected
   */
  const isRowSelected = useCallback(
    (id: string): boolean => {
      if (selectAll) {
        return !excludedIds.includes(id);
      }
      return selectedIds.includes(id);
    },
    [selectAll, selectedIds, excludedIds]
  );

  /**
   * Check if all rows on current page are selected
   */
  const getIsAllPageSelected = useCallback(
    (currentPageIds: string[]): boolean => {
      if (selectAll) {
        return currentPageIds.every((id) => !excludedIds.includes(id));
      }
      return currentPageIds.length > 0 && currentPageIds.every((id) => selectedIds.includes(id));
    },
    [selectAll, selectedIds, excludedIds]
  );

  /**
   * Clear all selections
   */
  const clearSelection = useCallback(() => {
    dispatch(resetSelectedData());
  }, [dispatch]);

  /**
   * Get selection parameters for API calls
   */
  const getSelectionParams = useCallback(() => {
    if (selectAll) {
      return {
        selectAll: true,
        excludedIds: excludedIds.length > 0 ? excludedIds : undefined,
      };
    }
    return {
      ids: selectedIds.length > 0 ? selectedIds : undefined,
    };
  }, [selectAll, selectedIds, excludedIds]);

  return {
    selectedIds,
    excludedIds,
    selectAll,
    toggleRow,
    toggleSelectAll,
    isRowSelected,
    getIsAllPageSelected,
    clearSelection,
    getSelectionParams,
  };
};
