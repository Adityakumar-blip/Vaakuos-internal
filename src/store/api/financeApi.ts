import { apiSlice as api } from './apiSlice';
import { unwrapPaginated, buildPageQuery, type PaginatedResult, type PageArgs } from './paginated';

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

/** Billing rollup for one brand. All amounts are major units (rupees). */
export interface BrandBilling {
    brandId: string;
    brandName: string;
    agencyId: string | null;
    agencyName: string;
    planName: string;
    subscriptionStatus: string;
    invoiceCount: number;
    billed: number;
    collected: number;
    outstanding: number;
    lastInvoiceAt: string | null;
}

export interface BrandBillingResponse {
    brands: BrandBilling[];
    totals: { billed: number; collected: number; outstanding: number; brands: number };
    currency: string;
}

export interface OwnerInvoice {
    id: string;
    invoice_number: string;
    amount: number;
    currency: string;
    status: string;
    due_date: string | null;
    paid_at: string | null;
    pdf_url: string | null;
    created_at: string;
    brand_id: string;
    brand_name: string | null;
    plan_name: string | null;
}

export interface GetOwnerInvoicesParams extends PageArgs {
    brandId?: string;
    status?: string;
    search?: string;
}

export const financeApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getFinanceStats: builder.query<FinanceStats, void>({
            query: () => '/finance/owner/stats',
            providesTags: ['Finance'],
        }),
        getBrandBilling: builder.query<BrandBillingResponse, { search?: string } | void>({
            query: (params) =>
                `/finance/owner/brands${params?.search ? `?search=${encodeURIComponent(params.search)}` : ''}`,
            providesTags: ['Finance'],
        }),
        getOwnerInvoices: builder.query<PaginatedResult<OwnerInvoice>, GetOwnerInvoicesParams>({
            query: ({ brandId, status, search, ...page }) =>
                `/finance/owner/invoices?${buildPageQuery(page, { brandId, status, search })}`,
            transformResponse: unwrapPaginated<OwnerInvoice>,
            providesTags: ['Finance'],
        }),
    }),
});

export const {
    useGetFinanceStatsQuery,
    useGetBrandBillingQuery,
    useGetOwnerInvoicesQuery,
} = financeApi;
