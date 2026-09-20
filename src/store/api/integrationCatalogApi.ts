import { apiSlice as api } from './apiSlice';
import { unwrapList } from './unwrapList';
import type {
  IntegrationCatalogEntry,
  IntegrationStatus,
  PluginIncident,
  PluginUsageStats,
} from '@/pages/internal/master/integrations/types';

const URL = '/integration-catalog';

const LIST_TAG = { type: 'Integration' as const, id: 'CATALOG' };

const unwrapRecord = <T>(response: unknown): T => {
  if (response && typeof response === 'object' && 'data' in response) {
    return (response as { data: T }).data;
  }
  return response as T;
};

export const integrationCatalogApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getIntegrationCatalog: builder.query<
      IntegrationCatalogEntry[],
      { category?: string; status?: string; search?: string } | void
    >({
      query: (filters) => {
        const params = new URLSearchParams(
          Object.entries(filters ?? {}).filter(([, v]) => v) as [string, string][],
        ).toString();
        return params ? `${URL}?${params}` : URL;
      },
      transformResponse: (response) =>
        unwrapList<IntegrationCatalogEntry>(response),
      providesTags: [LIST_TAG],
    }),

    createIntegrationCatalog: builder.mutation<
      IntegrationCatalogEntry,
      Partial<IntegrationCatalogEntry> & { provider: string; name: string }
    >({
      query: (body) => ({ url: URL, method: 'POST', body }),
      invalidatesTags: [LIST_TAG],
    }),

    updateIntegrationCatalog: builder.mutation<
      IntegrationCatalogEntry,
      { id: string; data: Partial<IntegrationCatalogEntry> }
    >({
      query: ({ id, data }) => ({ url: `${URL}/${id}`, method: 'PUT', body: data }),
      invalidatesTags: [LIST_TAG],
    }),

    updateIntegrationStatus: builder.mutation<
      IntegrationCatalogEntry,
      { id: string; status: IntegrationStatus; status_message?: string }
    >({
      query: ({ id, ...body }) => ({
        url: `${URL}/${id}/status`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        LIST_TAG,
        { type: 'Integration', id: `${id}-incidents` },
      ],
    }),

    toggleIntegration: builder.mutation<IntegrationCatalogEntry, string>({
      query: (id) => ({ url: `${URL}/${id}/toggle`, method: 'PATCH' }),
      invalidatesTags: [LIST_TAG],
    }),

    getIntegrationStats: builder.query<PluginUsageStats, string>({
      query: (id) => `${URL}/${id}/stats`,
      transformResponse: (response) => unwrapRecord<PluginUsageStats>(response),
      extraOptions: { maxRetries: 0 },
      providesTags: (result, error, id) => [{ type: 'Integration', id: `${id}-stats` }],
    }),

    getIntegrationIncidents: builder.query<PluginIncident[], string>({
      query: (id) => `${URL}/${id}/incidents`,
      transformResponse: (response) => unwrapList<PluginIncident>(response),
      extraOptions: { maxRetries: 0 },
      providesTags: (result, error, id) => [{ type: 'Integration', id: `${id}-incidents` }],
    }),
  }),
});

export const {
  useGetIntegrationCatalogQuery,
  useCreateIntegrationCatalogMutation,
  useUpdateIntegrationCatalogMutation,
  useUpdateIntegrationStatusMutation,
  useToggleIntegrationMutation,
  useGetIntegrationStatsQuery,
  useGetIntegrationIncidentsQuery,
} = integrationCatalogApi;
