import { apiSlice as api } from './apiSlice';
import { PaginatedResult, PageArgs, unwrapPaginated, buildPageQuery } from './paginated';

export type ContactQueryStatus = 'new' | 'in_progress' | 'closed';

export interface ContactQuery {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    company?: string;
    intent?: string;
    message: string;
    status: ContactQueryStatus;
    metadata?: Record<string, unknown>;
    created_at: string;
    updated_at: string;
}

export interface ContactQueriesQueryParams extends PageArgs {
    status?: ContactQueryStatus;
    search?: string;
}

export const contactQueriesApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getContactQueries: builder.query<PaginatedResult<ContactQuery>, ContactQueriesQueryParams | void>({
            query: (args) => {
                const a = args || undefined;
                const qs = buildPageQuery(a, { status: a?.status, search: a?.search });
                return `/contact-queries?${qs}`;
            },
            transformResponse: unwrapPaginated<ContactQuery>,
            providesTags: (result) =>
                result?.data
                    ? [
                        ...result.data.map(({ id }) => ({ type: 'ContactQuery' as const, id })),
                        { type: 'ContactQuery', id: 'LIST' },
                    ]
                    : [{ type: 'ContactQuery', id: 'LIST' }],
        }),
        updateContactQueryStatus: builder.mutation<ContactQuery, { id: string; status: ContactQueryStatus }>({
            query: ({ id, status }) => ({
                url: `/contact-queries/${id}`,
                method: 'PATCH',
                body: { status },
            }),
            invalidatesTags: (_result, _error, { id }) => [
                { type: 'ContactQuery', id },
                { type: 'ContactQuery', id: 'LIST' },
            ],
        }),
    }),
});

export const { useGetContactQueriesQuery, useUpdateContactQueryStatusMutation } = contactQueriesApi;
