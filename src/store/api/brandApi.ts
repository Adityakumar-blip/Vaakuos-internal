import { apiSlice as api } from './apiSlice';
import { unwrapList } from './unwrapList';
import { Brand } from '@/types/brand.types';
import { BrandOverview } from '@/types/owner.types';

export interface GetBrandsParams {
    search?: string;
    agencyId?: string;
}

export const brandApi = api.injectEndpoints({
    endpoints: (builder) => ({
        // Get all brands
        getBrands: builder.query<BrandOverview[], GetBrandsParams | void>({
            query: (params) => {
                const queryParams = new URLSearchParams();
                if (params) {
                    if (params.search) queryParams.append('search', params.search);
                    if (params.agencyId) queryParams.append('agencyId', params.agencyId);
                }
                const queryString = queryParams.toString();
                return `/brands${queryString ? `?${queryString}` : ''}`;
            },
            transformResponse: unwrapList<BrandOverview>,
            providesTags: (result) =>
                result
                    ? [
                        { type: 'Brand', id: 'LIST' },
                        ...result.map(({ id }) => ({ type: 'Brand' as const, id })),
                    ]
                    : [{ type: 'Brand', id: 'LIST' }],
        }),

        // Get brand by ID
        getBrandById: builder.query<Brand, string>({
            query: (id) => `/brands/${id}`,
            providesTags: (result, error, id) => [{ type: 'Brand', id }],
        }),

        // Only the status is writable — the backend exposes no general brand update.
        updateBrandStatus: builder.mutation<Brand, { id: string; status: string }>({
            query: ({ id, status }) => ({
                url: `/brands/${id}/status`,
                method: 'PATCH',
                body: { status },
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'Brand', id: 'LIST' },
                { type: 'Brand', id },
            ],
        }),
    }),
});

export const {
    useGetBrandsQuery,
    useLazyGetBrandsQuery,
    useGetBrandByIdQuery,
    useLazyGetBrandByIdQuery,
    useUpdateBrandStatusMutation,
} = brandApi;
