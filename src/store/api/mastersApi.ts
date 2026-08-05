import { apiSlice as api } from './apiSlice';

interface GetMastersParams {
  url: string;
  params?: string;
  skipToast?: boolean;
}

interface GetMasterByIdParams {
  url: string;
  id: string | number;
  skipToast?: boolean;
}

interface AddMasterParams {
  url: string;
  data: unknown;
  skipToast?: boolean;
}

interface UpdateMasterParams {
  url: string;
  id: string | number;
  data: unknown;
  skipToast?: boolean;
}

interface DeleteMasterParams {
  url: string;
  id: string | number | string[];
  skipToast?: boolean;
}

export const mastersApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Generic GET list endpoint
    getMasters: builder.query<unknown, GetMastersParams>({
      query: ({ url, params = '' }) => `${url}${params}`,
      providesTags: (result, error, { url }) => [{ type: 'Masters', id: url }],
    }),

    // Generic GET by ID endpoint
    getMasterById: builder.query<unknown, GetMasterByIdParams>({
      query: ({ url, id }) => `${url}/${id}`,
      providesTags: (result, error, { url, id }) => [
        { type: 'Masters', id: `${url}-${id}` },
      ],
    }),

    // Generic POST (create) endpoint
    addMaster: builder.mutation<unknown, AddMasterParams>({
      query: ({ url, data }) => ({
        url,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { url }) => [{ type: 'Masters', id: url }],
    }),

    // Generic PATCH/PUT (update) endpoint
    updateMaster: builder.mutation<unknown, UpdateMasterParams>({
      query: ({ url, id, data }) => ({
        url: `${url}/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { url, id }) => [
        { type: 'Masters', id: url },
        { type: 'Masters', id: `${url}-${id}` },
      ],
    }),

    // Generic DELETE endpoint (supports single or bulk delete)
    deleteMaster: builder.mutation<unknown, DeleteMasterParams>({
      query: ({ url, id }) => ({
        url: Array.isArray(id) ? url : `${url}/${id}`,
        method: 'DELETE',
        body: Array.isArray(id) ? { ids: id } : undefined,
      }),
      invalidatesTags: (result, error, { url }) => [{ type: 'Masters', id: url }],
    }),

    // Publish Master endpoint
    publishMaster: builder.mutation<unknown, { url: string; id: string }>({
      query: ({ url, id }) => ({
        url: `${url}/${id}/publish`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, { url }) => [{ type: 'Masters', id: url }],
    }),
  }),
});

export const {
  useGetMastersQuery,
  useLazyGetMastersQuery,
  useGetMasterByIdQuery,
  useLazyGetMasterByIdQuery,
  useAddMasterMutation,
  useUpdateMasterMutation,
  useDeleteMasterMutation,
  usePublishMasterMutation,
} = mastersApi;
