import { apiSlice } from './apiSlice';
import { PaginatedResult, PageArgs, unwrapPaginated, buildPageQuery } from './paginated';

export interface TicketsQueryParams extends PageArgs {
    q?: string;
    status?: string;
    priority?: string;
    created?: string;
}

export interface Ticket {
    id: string;
    ticket_no: string;
    tenant_id: string;
    conversation_id?: string;
    contact_id?: string;
    created_by: string;
    assigned_to?: string;
    subject: string;
    description?: string;
    status: 'open' | 'in_progress' | 'resolved' | 'closed';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    category: string;
    custom_category?: string;
    created_at: string;
    updated_at: string;
    creator?: {
        id: string;
        name: string;
        email: string;
    };
    assignee?: {
        id: string;
        name: string;
        email: string;
    };
}

export const ticketsApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getTickets: builder.query<PaginatedResult<Ticket>, TicketsQueryParams | void>({
            query: (args) => {
                const a = args || undefined;
                const qs = buildPageQuery(a, {
                    q: a?.q,
                    status: a?.status,
                    priority: a?.priority,
                    created: a?.created,
                });
                return `/tickets?${qs}`;
            },
            transformResponse: unwrapPaginated<Ticket>,
            providesTags: (result) =>
                result?.data
                    ? [
                        ...result.data.map(({ id }) => ({ type: 'Ticket' as const, id })),
                        { type: 'Ticket', id: 'LIST' },
                    ]
                    : [{ type: 'Ticket', id: 'LIST' }],
        }),
        getTicket: builder.query<Ticket, string>({
            query: (id) => `/tickets/${id}`,
            providesTags: (result, error, id) => [{ type: 'Ticket', id }],
        }),
        createTicket: builder.mutation<Ticket, Partial<Ticket>>({
            query: (body) => ({
                url: '/tickets',
                method: 'POST',
                body,
            }),
            invalidatesTags: [{ type: 'Ticket', id: 'LIST' }],
        }),
        updateTicket: builder.mutation<Ticket, { id: string } & Partial<Ticket>>({
            query: ({ id, ...body }) => ({
                url: `/tickets/${id}`,
                method: 'PUT',
                body,
            }),
            invalidatesTags: (result, error, { id }) => [{ type: 'Ticket', id }, { type: 'Ticket', id: 'LIST' }],
        }),
        deleteTicket: builder.mutation<{ success: boolean }, string>({
            query: (id) => ({
                url: `/tickets/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: [{ type: 'Ticket', id: 'LIST' }],
        }),
    }),
});

export const {
    useGetTicketsQuery,
    useGetTicketQuery,
    useCreateTicketMutation,
    useUpdateTicketMutation,
    useDeleteTicketMutation,
} = ticketsApi;
