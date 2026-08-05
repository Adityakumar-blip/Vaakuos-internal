import { apiSlice as api } from './apiSlice';
import { PaginatedResult, PageArgs, unwrapPaginated, buildPageQuery } from './paginated';

export interface Offer {
    id: string;
    tenant_id: string;
    name: string;
    description?: string;
    type: 'bogo' | 'discount' | 'free_shipping' | 'buy_x_get_y';
    status: 'active' | 'inactive' | 'scheduled';
    starts_at?: string;
    expires_at?: string;
    conditions?: any;
    benefit?: any;
    metadata?: any;
    created_at: string;
    updated_at: string;
}

export interface CreateOfferDto {
    name: string;
    description?: string;
    type: string;
    status?: string;
    starts_at?: string;
    expires_at?: string;
    conditions?: any;
    benefit?: any;
    metadata?: any;
}

export interface UpdateOfferDto extends Partial<CreateOfferDto> {}

export interface OffersQueryParams extends PageArgs {
    search?: string;
    status?: string;
}

export const offerApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getOffers: builder.query<PaginatedResult<Offer>, OffersQueryParams | void>({
            query: (args) => {
                const a = args || undefined;
                const qs = buildPageQuery(a, { search: a?.search, status: a?.status });
                return `/offers?${qs}`;
            },
            transformResponse: unwrapPaginated<Offer>,
            providesTags: (result) =>
                result?.data
                    ? [
                        ...result.data.map(({ id }) => ({ type: 'Offer' as const, id })),
                        { type: 'Offer' as const, id: 'LIST' },
                    ]
                    : [{ type: 'Offer' as const, id: 'LIST' }],
        }),
        getOffer: builder.query<Offer, string>({
            query: (id) => `/offers/${id}`,
            providesTags: (_result, _error, id) => [{ type: 'Offer', id }],
        }),
        createOffer: builder.mutation<Offer, CreateOfferDto>({
            query: (body) => ({
                url: '/offers',
                method: 'POST',
                body,
            }),
            invalidatesTags: [{ type: 'Offer', id: 'LIST' }],
        }),
        updateOffer: builder.mutation<Offer, { id: string; body: UpdateOfferDto }>({
            query: ({ id, body }) => ({
                url: `/offers/${id}`,
                method: 'PUT',
                body,
            }),
            invalidatesTags: (_result, _error, { id }) => [{ type: 'Offer', id }, { type: 'Offer', id: 'LIST' }],
        }),
        deleteOffer: builder.mutation<void, string>({
            query: (id) => ({
                url: `/offers/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: [{ type: 'Offer', id: 'LIST' }],
        }),
    }),
});

export const {
    useGetOffersQuery,
    useGetOfferQuery,
    useCreateOfferMutation,
    useUpdateOfferMutation,
    useDeleteOfferMutation,
} = offerApi;
