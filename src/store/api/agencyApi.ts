import { apiSlice as api } from './apiSlice';
import { Agency } from '@/types/agency.types';
import { unwrapList } from './unwrapList';

export interface GetAgenciesParams {
    search?: string;
}

export const agencyApi = api.injectEndpoints({
    endpoints: (builder) => ({
        // Get all agencies
        getAgencies: builder.query<Agency[], GetAgenciesParams | void>({
            query: (params) => {
                const queryParams = new URLSearchParams();
                if (params && params.search) queryParams.append('search', params.search);
                return `/agencies?${queryParams.toString()}`;
            },
            transformResponse: unwrapList<Agency>,
            providesTags: (result) =>
                result
                    ? [
                        { type: 'Agency', id: 'LIST' },
                        ...result.map(({ id }) => ({ type: 'Agency' as const, id })),
                    ]
                    : [{ type: 'Agency', id: 'LIST' }],
        }),

        // Get agency by ID
        getAgencyById: builder.query<Agency, string>({
            query: (id) => `/agencies/${id}`,
            providesTags: (result, error, id) => [{ type: 'Agency', id }],
        }),

        // Update agency
        updateAgency: builder.mutation<Agency, { id: string; data: Partial<Agency> }>({
            query: ({ id, data }) => ({
                url: `/agencies/${id}`,
                method: 'PATCH',
                body: data,
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'Agency', id: 'LIST' },
                { type: 'Agency', id },
            ],
        }),
    }),
});

export const {
    useGetAgenciesQuery,
    useLazyGetAgenciesQuery,
    useGetAgencyByIdQuery,
    useLazyGetAgencyByIdQuery,
    useUpdateAgencyMutation,
} = agencyApi;
