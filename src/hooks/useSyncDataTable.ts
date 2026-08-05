import { useEffect } from 'react';
import { useAppDispatch } from '@/store/store';
import { setPagination } from '@/store/slices/commonSlice';

interface PaginationData {
  total: number;
  currentPage: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/**
 * Custom hook to sync API pagination response with Redux state
 * @param paginationData - Pagination data from API response
 */
export const useSyncDataTable = (paginationData?: PaginationData) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (paginationData) {
      dispatch(setPagination(paginationData));
    }
  }, [paginationData, dispatch]);
};
