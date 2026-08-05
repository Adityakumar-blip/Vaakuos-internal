import { apiSlice } from './apiSlice';
import { PaginatedResult, PageArgs, unwrapPaginated, buildPageQuery } from './paginated';

/**
 * API Keys API
 *
 * Wraps the backend `api-tokens` module:
 *   POST   /api-tokens/generate   → create a key (plain token returned once)
 *   GET    /api-tokens            → list keys for the current tenant (paginated)
 *   DELETE /api-tokens/:id        → revoke a key
 *
 * The base slice attaches the JWT automatically; the backend derives the
 * tenant from that token, so no tenant id is sent from the client.
 */

/** A key as returned by the list endpoint — the secret is never included. */
export interface ApiKey {
  id: string;
  name: string;
  scopes: string[];
  created_at: string;
  expires_at: string | null;
}

export interface ApiKeysQueryParams extends PageArgs {
  search?: string;
}

export interface CreateApiKeyDto {
  name: string;
  scopes?: string[];
}

/** Response from generate — `token` is the plaintext secret, shown once. */
export interface CreatedApiKey {
  id: string;
  name: string;
  token: string;
  created_at: string;
}

export const apiKeysApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getApiKeys: builder.query<PaginatedResult<ApiKey>, ApiKeysQueryParams | void>({
      query: (args) => {
        const a = args || undefined;
        const qs = buildPageQuery(a, { search: a?.search });
        return `/api-tokens?${qs}`;
      },
      transformResponse: unwrapPaginated<ApiKey>,
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ id }) => ({ type: 'ApiKey' as const, id })),
              { type: 'ApiKey' as const, id: 'LIST' },
            ]
          : [{ type: 'ApiKey' as const, id: 'LIST' }],
    }),

    createApiKey: builder.mutation<CreatedApiKey, CreateApiKeyDto>({
      query: (dto) => ({
        url: '/api-tokens/generate',
        method: 'POST',
        body: dto,
      }),
      invalidatesTags: [{ type: 'ApiKey', id: 'LIST' }],
    }),

    deleteApiKey: builder.mutation<{ count: number }, string>({
      query: (id) => ({
        url: `/api-tokens/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'ApiKey', id },
        { type: 'ApiKey', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetApiKeysQuery,
  useLazyGetApiKeysQuery,
  useCreateApiKeyMutation,
  useDeleteApiKeyMutation,
} = apiKeysApi;
