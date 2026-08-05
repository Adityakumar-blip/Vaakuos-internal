import { apiSlice } from './apiSlice';
import { unwrapList } from './unwrapList';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface MetricDefinition {
    id: string;
    key: string;
    name: string;
    description?: string;
    category: string;
    default_widget_type: string;
    default_config?: Record<string, any>;
    is_system: boolean;
    is_active: boolean;
    hasCalculator?: boolean;
}

export interface MetricResult {
    value: string | number;
    trend?: {
        value: string;
        type: 'increase' | 'decrease' | 'neutral';
    };
    sparklineData?: { value: number }[];
    description?: string;
    extra?: Record<string, any>;
}

export interface DashboardWidget {
    id: string;
    tenant_id: string;
    user_id?: string;
    metric_key: string;
    title: string;
    widget_type: string;
    config?: Record<string, any>;
    position: number;
    col_span: number;
    is_visible: boolean;
    created_at: string;
    updated_at: string;
    metric?: MetricDefinition;
}

export interface OwnerOverview {
  totalAgencies: number;
  totalBrands: number;
  activeBrands: number;
  messagesToday: number;
  topAgencies: { id: string; name: string; brandCount: number }[];
}

export interface AgencyOverview {
  totalBrands: number;
  activeBrands: number;
  messagesLast30Days: number;
  brands: { id: string; name: string; status: string }[];
}

export interface WidgetDataResponse {
    widgetId: string;
    metricKey: string;
    title: string;
    widgetType: string;
    data: MetricResult;
}

export interface CreateWidgetDto {
    metricKey: string;
    title: string;
    widgetType?: string;
    config?: Record<string, any>;
    position?: number;
    colSpan?: number;
}

export interface UpdateWidgetDto {
    title?: string;
    widgetType?: string;
    config?: Record<string, any>;
    position?: number;
    colSpan?: number;
    isVisible?: boolean;
}

export interface ReorderWidgetsDto {
    widgets: { widgetId: string; position: number }[];
}

export interface DashboardLayout {
    section_order?: string[];
    preferences?: Record<string, any>;
}

// ─── API ─────────────────────────────────────────────────────────────────────

export const dashboardApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({

        // ── Widgets CRUD ──────────────────────────────────────────────────────

        getWidgets: builder.query<DashboardWidget[], void>({
            query: () => '/dashboard/widgets',
            transformResponse: unwrapList<DashboardWidget>,
            providesTags: (result) =>
                result
                    ? [
                        ...result.map(({ id }) => ({ type: 'Widget' as const, id })),
                        { type: 'Widget', id: 'DASHBOARD_LIST' },
                    ]
                    : [{ type: 'Widget', id: 'DASHBOARD_LIST' }],
        }),

        createWidget: builder.mutation<DashboardWidget, CreateWidgetDto>({
            query: (dto) => ({
                url: '/dashboard/widgets',
                method: 'POST',
                body: dto,
            }),
            invalidatesTags: [{ type: 'Widget', id: 'DASHBOARD_LIST' }],
        }),

        updateWidget: builder.mutation<DashboardWidget, { id: string; dto: UpdateWidgetDto }>({
            query: ({ id, dto }) => ({
                url: `/dashboard/widgets/${id}`,
                method: 'PATCH',
                body: dto,
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'Widget', id },
                { type: 'Widget', id: 'DASHBOARD_LIST' },
            ],
        }),

        deleteWidget: builder.mutation<void, string>({
            query: (id) => ({
                url: `/dashboard/widgets/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: [{ type: 'Widget', id: 'DASHBOARD_LIST' }],
        }),

        reorderWidgets: builder.mutation<void, ReorderWidgetsDto>({
            query: (dto) => ({
                url: '/dashboard/widgets/reorder',
                method: 'PATCH',
                body: dto,
            }),
            invalidatesTags: [{ type: 'Widget', id: 'DASHBOARD_LIST' }],
        }),

        // ── Data Computation ──────────────────────────────────────────────────

        getAllWidgetsData: builder.query<WidgetDataResponse[], void>({
            query: () => '/dashboard/data',
            providesTags: [{ type: 'Analytics', id: 'DASHBOARD_DATA' }],
        }),

        getWidgetData: builder.query<WidgetDataResponse, string>({
            query: (id) => `/dashboard/widgets/${id}/data`,
        }),

        // ── Cross-tenant overviews (owner / agency dashboards) ────────────────
        getOwnerOverview: builder.query<OwnerOverview, void>({
            query: () => '/dashboard/owner-overview',
            providesTags: [{ type: 'Analytics', id: 'OWNER_OVERVIEW' }],
        }),

        getAgencyOverview: builder.query<AgencyOverview, void>({
            query: () => '/dashboard/agency-overview',
            providesTags: [{ type: 'Analytics', id: 'AGENCY_OVERVIEW' }],
        }),

        // ── Metrics Catalog ───────────────────────────────────────────────────

        getAvailableMetrics: builder.query<MetricDefinition[], void>({
            query: () => '/dashboard/metrics/available',
            providesTags: [{ type: 'Analytics', id: 'METRICS_CATALOG' }],
        }),

        // ── Layout Preferences ────────────────────────────────────────────────

        getLayout: builder.query<DashboardLayout, void>({
            query: () => '/dashboard/layout',
        }),

        updateLayout: builder.mutation<DashboardLayout, Partial<DashboardLayout>>({
            query: (body) => ({
                url: '/dashboard/layout',
                method: 'PATCH',
                body,
            }),
        }),

        // ── Seed ──────────────────────────────────────────────────────────────

        seedDefaults: builder.mutation<void, void>({
            query: () => ({
                url: '/dashboard/seed',
                method: 'POST',
            }),
            invalidatesTags: [{ type: 'Widget', id: 'DASHBOARD_LIST' }],
        }),
    }),
});

export const {
    useGetWidgetsQuery,
    useCreateWidgetMutation,
    useUpdateWidgetMutation,
    useDeleteWidgetMutation,
    useReorderWidgetsMutation,
    useGetAllWidgetsDataQuery,
    useGetWidgetDataQuery,
    useGetOwnerOverviewQuery,
    useGetAgencyOverviewQuery,
    useGetAvailableMetricsQuery,
    useGetLayoutQuery,
    useUpdateLayoutMutation,
    useSeedDefaultsMutation,
} = dashboardApi;
