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

        // Issue a licence to a brand, or replace the one it has
        assignLicence: builder.mutation<
            unknown,
            {
                tenant_id: string;
                plan_id: string;
                custom_limits?: Record<string, number | boolean | string>;
                note?: string;
            }
        >({
            query: (body) => ({
                url: '/subscriptions/licences/assign',
                method: 'POST',
                body,
            }),
            invalidatesTags: [{ type: 'Brand', id: 'LIST' }],
        }),

        // Revoke a brand's licence. Keeps the record; the workspace goes read-only.
        revokeLicence: builder.mutation<unknown, { tenant_id: string; reason?: string }>({
            query: (body) => ({
                url: '/subscriptions/licences/revoke',
                method: 'POST',
                body,
            }),
            invalidatesTags: [{ type: 'Brand', id: 'LIST' }],
        }),

        // Get brand by ID
        getBrandById: builder.query<Brand, string>({
            query: (id) => `/brands/${id}`,
            providesTags: (result, error, id) => [{ type: 'Brand', id }],
        }),

        // Update brand
        updateBrand: builder.mutation<Brand, { id: string; data: Partial<Brand> }>({
            query: ({ id, data }) => ({
                url: `/brands/${id}`,
                method: 'PATCH',
                body: data,
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
    useUpdateBrandMutation,
    useAssignLicenceMutation,
    useRevokeLicenceMutation,
} = brandApi;
