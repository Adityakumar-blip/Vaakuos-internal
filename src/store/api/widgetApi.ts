import { apiSlice } from './apiSlice';
import { unwrapList } from './unwrapList';

// Types for widget configuration
export interface WidgetConfig {
  id?: string;
  name: string;
  phoneNumber: string;
  defaultMessage: string;
  widgetTitle: string;
  widgetSubtitle: string;
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  iconColor: string;
  borderRadius: number;
  buttonSize: number;
  position: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  offsetX: number;
  offsetY: number;
  showOnMobile: boolean;
  showOnDesktop: boolean;
  showChatBubble: boolean;
  autoOpenDelay: number;
  pulseAnimation: boolean;
  enableTracking: boolean;
  trackClicks: boolean;
  trackImpressions: boolean;
  trackConversions: boolean;
  webhookUrl: string;
  collectName: boolean;
  collectEmail: boolean;
  collectPhone: boolean;
  collectCustomField: boolean;
  customFieldLabel: string;
  requireDataBeforeChat: boolean;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface WidgetAnalytics {
  widgetId: string;
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  clickThroughRate: number;
  conversionRate: number;
  dailyStats: {
    date: string;
    impressions: number;
    clicks: number;
    conversions: number;
  }[];
  topReferrers: {
    url: string;
    count: number;
  }[];
  deviceStats: {
    mobile: number;
    desktop: number;
  };
}

export interface WidgetEvent {
  id: string;
  widgetId: string;
  eventType: 'impression' | 'click' | 'cta_click' | 'conversion' | 'auto_open';
  timestamp: string;
  pageUrl: string;
  referrer: string;
  userAgent: string;
  screenWidth: number;
  screenHeight: number;
  formData?: Record<string, string>;
}

export interface CreateWidgetRequest {
  config: Omit<WidgetConfig, 'id' | 'createdAt' | 'updatedAt'>;
}

export interface UpdateWidgetRequest {
  id: string;
  config: Partial<WidgetConfig>;
}

export const widgetApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Get all widgets
    getWidgets: builder.query<WidgetConfig[], void>({
      query: () => '/widgets',
      transformResponse: unwrapList<WidgetConfig>,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Widget' as const, id })),
              { type: 'Widget', id: 'LIST' },
            ]
          : [{ type: 'Widget', id: 'LIST' }],
    }),

    // Get a single widget by ID
    getWidget: builder.query<WidgetConfig, string>({
      query: (id) => `/widgets/${id}`,
      providesTags: (result, error, id) => [{ type: 'Widget', id }],
    }),

    // Create a new widget
    createWidget: builder.mutation<WidgetConfig, CreateWidgetRequest>({
      query: (data) => ({
        url: '/widgets',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Widget', id: 'LIST' }],
    }),

    // Update an existing widget
    updateWidget: builder.mutation<WidgetConfig, UpdateWidgetRequest>({
      query: ({ id, config }) => ({
        url: `/widgets/${id}`,
        method: 'PATCH',
        body: config,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Widget', id },
        { type: 'Widget', id: 'LIST' },
      ],
    }),

    // Delete a widget
    deleteWidget: builder.mutation<void, string>({
      query: (id) => ({
        url: `/widgets/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Widget', id },
        { type: 'Widget', id: 'LIST' },
      ],
    }),

    // Get widget analytics
    getWidgetAnalytics: builder.query<WidgetAnalytics, { id: string; startDate?: string; endDate?: string }>({
      query: ({ id, startDate, endDate }) => ({
        url: `/widgets/${id}/analytics`,
        params: { startDate, endDate },
      }),
    }),

    // Get widget events
    getWidgetEvents: builder.query<{ events: WidgetEvent[]; total: number }, { id: string; page?: number; limit?: number }>({
      query: ({ id, page = 1, limit = 50 }) => ({
        url: `/widgets/${id}/events`,
        params: { page, limit },
      }),
    }),

    // Track a widget event (for public use)
    trackWidgetEvent: builder.mutation<void, { widgetId: string; event: Omit<WidgetEvent, 'id' | 'widgetId'> }>({
      query: ({ widgetId, event }) => ({
        url: `/widgets/${widgetId}/track`,
        method: 'POST',
        body: event,
      }),
    }),

    // Generate embed code for a widget
    getWidgetEmbedCode: builder.query<{ code: string; minifiedCode: string }, string>({
      query: (id) => `/widgets/${id}/embed`,
    }),

    // Toggle widget active status
    toggleWidgetStatus: builder.mutation<WidgetConfig, { id: string; isActive: boolean }>({
      query: ({ id, isActive }) => ({
        url: `/widgets/${id}/status`,
        method: 'PATCH',
        body: { isActive },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Widget', id },
        { type: 'Widget', id: 'LIST' },
      ],
    }),

    // Duplicate a widget
    duplicateWidget: builder.mutation<WidgetConfig, string>({
      query: (id) => ({
        url: `/widgets/${id}/duplicate`,
        method: 'POST',
      }),
      invalidatesTags: [{ type: 'Widget', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetWidgetsQuery,
  useGetWidgetQuery,
  useCreateWidgetMutation,
  useUpdateWidgetMutation,
  useDeleteWidgetMutation,
  useGetWidgetAnalyticsQuery,
  useGetWidgetEventsQuery,
  useTrackWidgetEventMutation,
  useGetWidgetEmbedCodeQuery,
  useToggleWidgetStatusMutation,
  useDuplicateWidgetMutation,
} = widgetApi;
