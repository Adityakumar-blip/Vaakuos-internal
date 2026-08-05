import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SearchParams {
  page: number;
  take: number;
  search?: string;
  filters?: Record<string, unknown>;
}

interface Pagination {
  total: number;
  currentPage: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

interface SelectedData {
  selectAll: boolean;
  selectedIds: string[];
  excludedIds: string[];
}

interface CommonState {
  searchParams: SearchParams;
  pagination: Pagination;
  loading: boolean;
  tableLoading: boolean;
  selectedData: SelectedData;
}

const initialState: CommonState = {
  searchParams: {
    page: 1,
    take: 10,
    search: '',
    filters: {},
  },
  pagination: {
    total: 0,
    currentPage: 1,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false,
  },
  loading: false,
  tableLoading: false,
  selectedData: {
    selectAll: false,
    selectedIds: [],
    excludedIds: [],
  },
};

const commonSlice = createSlice({
  name: 'common',
  initialState,
  reducers: {
    setSearchParams: (state, action: PayloadAction<Partial<SearchParams>>) => {
      state.searchParams = { ...state.searchParams, ...action.payload };
    },
    setPagination: (state, action: PayloadAction<Pagination>) => {
      state.pagination = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setTableLoading: (state, action: PayloadAction<boolean>) => {
      state.tableLoading = action.payload;
    },
    setSelectedData: (state, action: PayloadAction<Partial<SelectedData>>) => {
      state.selectedData = { ...state.selectedData, ...action.payload };
    },
    resetSelectedData: (state) => {
      state.selectedData = initialState.selectedData;
    },
    resetSearchParams: (state) => {
      state.searchParams = initialState.searchParams;
    },
  },
});

export const {
  setSearchParams,
  setPagination,
  setLoading,
  setTableLoading,
  setSelectedData,
  resetSelectedData,
  resetSearchParams,
} = commonSlice.actions;

export default commonSlice.reducer;
