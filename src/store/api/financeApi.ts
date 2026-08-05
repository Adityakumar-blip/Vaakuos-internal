import { apiSlice as api } from './apiSlice';

export interface FinanceStats {
    totalRevenue: {
        value: number;
        growth: number;
        currency: string;
    };
    activeSubscriptions: {
        value: number;
        growth: number;
    };
    pendingInvoices: {
        value: number;
        growth: number;
    };
    arpu: {
        value: number;
        growth: number;
    };
}

export const financeApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getFinanceStats: builder.query<FinanceStats, void>({
            query: () => '/finance/stats',
            providesTags: ['Finance'],
        }),
    }),
});

export const { useGetFinanceStatsQuery } = financeApi;
