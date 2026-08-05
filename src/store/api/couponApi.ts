import { apiSlice as api } from './apiSlice';
import { PaginatedResult, PageArgs, unwrapPaginated, buildPageQuery } from './paginated';

export interface Coupon {
    id: string;
    tenant_id: string;
    code: string;
    description?: string;
    type: 'fixed_amount' | 'percentage';
    value: number;
    min_purchase_amount?: number;
    max_discount_amount?: number;
    starts_at?: string;
    expires_at?: string;
    usage_limit?: number;
    usage_count: number;
    is_active: boolean;
    metadata?: any;
    created_at: string;
    updated_at: string;
}

export interface CreateCouponDto {
    code: string;
    description?: string;
    type: string;
    value: number;
    min_purchase_amount?: number;
    max_discount_amount?: number;
    starts_at?: string;
    expires_at?: string;
    usage_limit?: number;
    is_active?: boolean;
    metadata?: any;
}

export interface UpdateCouponDto extends Partial<CreateCouponDto> {}

export interface CouponsQueryParams extends PageArgs {
    search?: string;
    status?: string;
}

export const couponApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getCoupons: builder.query<PaginatedResult<Coupon>, CouponsQueryParams | void>({
            query: (args) => {
                const a = args || undefined;
                const qs = buildPageQuery(a, { search: a?.search, status: a?.status });
                return `/coupons?${qs}`;
            },
            transformResponse: unwrapPaginated<Coupon>,
            providesTags: (result) =>
                result?.data
                    ? [
                        ...result.data.map(({ id }) => ({ type: 'Coupon' as const, id })),
                        { type: 'Coupon' as const, id: 'LIST' },
                    ]
                    : [{ type: 'Coupon' as const, id: 'LIST' }],
        }),
        getCoupon: builder.query<Coupon, string>({
            query: (id) => `/coupons/${id}`,
            providesTags: (_result, _error, id) => [{ type: 'Coupon', id }],
        }),
        getCouponByCode: builder.query<Coupon, string>({
            query: (code) => `/coupons/code/${code}`,
        }),
        createCoupon: builder.mutation<Coupon, CreateCouponDto>({
            query: (body) => ({
                url: '/coupons',
                method: 'POST',
                body,
            }),
            invalidatesTags: [{ type: 'Coupon', id: 'LIST' }],
        }),
        updateCoupon: builder.mutation<Coupon, { id: string; body: UpdateCouponDto }>({
            query: ({ id, body }) => ({
                url: `/coupons/${id}`,
                method: 'PUT',
                body,
            }),
            invalidatesTags: (_result, _error, { id }) => [{ type: 'Coupon', id }, { type: 'Coupon', id: 'LIST' }],
        }),
        deleteCoupon: builder.mutation<void, string>({
            query: (id) => ({
                url: `/coupons/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: [{ type: 'Coupon', id: 'LIST' }],
        }),
        incrementCouponUsage: builder.mutation<void, string>({
            query: (id) => ({
                url: `/coupons/${id}/usage`,
                method: 'POST',
            }),
            invalidatesTags: (_result, _error, id) => [{ type: 'Coupon', id }],
        }),
    }),
});

export const {
    useGetCouponsQuery,
    useGetCouponQuery,
    useGetCouponByCodeQuery,
    useLazyGetCouponByCodeQuery,
    useCreateCouponMutation,
    useUpdateCouponMutation,
    useDeleteCouponMutation,
    useIncrementCouponUsageMutation,
} = couponApi;
