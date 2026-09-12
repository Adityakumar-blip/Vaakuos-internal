import { apiSlice as api } from './apiSlice';
import { unwrapList } from './unwrapList';
import type { IntegrationCatalogEntry } from '@/pages/internal/master/integrations/types';

const URL = '/integration-catalog';

const LIST_TAG = { type: 'Integration' as const, id: 'CATALOG' };

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

    updateIntegrationCatalog: builder.mutation<
      IntegrationCatalogEntry,
      { id: string; data: Partial<IntegrationCatalogEntry> }
    >({
      query: ({ id, data }) => ({ url: `${URL}/${id}`, method: 'PUT', body: data }),
      invalidatesTags: [LIST_TAG],
    }),

    updateIntegrationStatus: builder.mutation<
      IntegrationCatalogEntry,
      { id: string; status: string; status_message?: string }
    >({
      query: ({ id, ...body }) => ({
        url: `${URL}/${id}/status`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: [LIST_TAG],
    }),

    toggleIntegration: builder.mutation<IntegrationCatalogEntry, string>({
      query: (id) => ({ url: `${URL}/${id}/toggle`, method: 'PATCH' }),
      invalidatesTags: [LIST_TAG],
    }),
  }),
});

export const {
  useGetIntegrationCatalogQuery,
  useUpdateIntegrationCatalogMutation,
  useUpdateIntegrationStatusMutation,
  useToggleIntegrationMutation,
} = integrationCatalogApi;
