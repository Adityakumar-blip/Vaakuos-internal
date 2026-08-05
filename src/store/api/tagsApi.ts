import { apiSlice } from './apiSlice';
import { unwrapList } from './unwrapList';

export interface Tag {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTagDto {
  name: string;
}

export const tagsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getTags: builder.query<Tag[], { search?: string }>({
      query: (params) => ({
        url: '/tags',
        method: 'GET',
        params, // Pass search param if exists
      }),
      transformResponse: unwrapList<Tag>,
      providesTags: (result) =>
        result
          ? [
            ...result.map(({ id }) => ({ type: 'Tag' as const, id })),
            { type: 'Tag', id: 'LIST' },
          ]
          : [{ type: 'Tag', id: 'LIST' }],
      keepUnusedDataFor: 300,
    }),

    createTag: builder.mutation<Tag, CreateTagDto>({
      query: (dto) => ({
        url: '/tags',
        method: 'POST',
        body: dto,
      }),
      invalidatesTags: [{ type: 'Tag', id: 'LIST' }],
      // Optimistic update
      async onQueryStarted(newTag, { dispatch, queryFulfilled }) {
        try {
          const { data: createdTag } = await queryFulfilled;
          dispatch(
            tagsApi.util.updateQueryData('getTags', {}, (draft) => {
              draft.unshift(createdTag);
            })
          );
        } catch {
          // If the mutation fails, the cache will be automatically reverted
        }
      },
    }),
    assignTag: builder.mutation<void, { contact_id: string; tag_id: string }>({
      query: (dto) => ({
        url: '/tags/assign',
        method: 'POST',
        body: dto,
      }),
      invalidatesTags: (result, error, { contact_id }) => [
        { type: 'Conversation', id: 'LIST' }, // Refresh inbox list as it has nested tags
      ],
    }),
    removeTag: builder.mutation<void, { contact_id: string; tag_id: string }>({
      query: (dto) => ({
        url: '/tags/remove',
        method: 'POST',
        body: dto,
      }),
      invalidatesTags: (result, error, { contact_id }) => [
        { type: 'Conversation', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetTagsQuery,
  useLazyGetTagsQuery,
  useCreateTagMutation,
  useAssignTagMutation,
  useRemoveTagMutation,
} = tagsApi;
