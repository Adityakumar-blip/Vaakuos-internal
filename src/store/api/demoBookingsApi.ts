import { apiSlice as api } from './apiSlice';
import { PaginatedResult, PageArgs, unwrapPaginated, buildPageQuery } from './paginated';

export type DemoBookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface DemoBooking {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    order_volume: string;
    selected_date: string;
    selected_time: string;
    status: DemoBookingStatus;
    metadata?: Record<string, unknown>;
    created_at: string;
    updated_at: string;
}

export interface DemoBookingsQueryParams extends PageArgs {
    status?: DemoBookingStatus;
}

export const demoBookingsApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getDemoBookings: builder.query<PaginatedResult<DemoBooking>, DemoBookingsQueryParams | void>({
            query: (args) => {
                const a = args || undefined;
                const qs = buildPageQuery(a, { status: a?.status });
                return `/demo-bookings?${qs}`;
            },
            transformResponse: unwrapPaginated<DemoBooking>,
            providesTags: (result) =>
                result?.data
                    ? [
                        ...result.data.map(({ id }) => ({ type: 'DemoBooking' as const, id })),
                        { type: 'DemoBooking', id: 'LIST' },
                    ]
                    : [{ type: 'DemoBooking', id: 'LIST' }],
        }),
        updateDemoBookingStatus: builder.mutation<DemoBooking, { id: string; status: DemoBookingStatus }>({
            query: ({ id, status }) => ({
                url: `/demo-bookings/${id}`,
                method: 'PATCH',
                body: { status },
            }),
            invalidatesTags: (_result, _error, { id }) => [
                { type: 'DemoBooking', id },
                { type: 'DemoBooking', id: 'LIST' },
            ],
        }),
    }),
});

export const { useGetDemoBookingsQuery, useUpdateDemoBookingStatusMutation } = demoBookingsApi;
