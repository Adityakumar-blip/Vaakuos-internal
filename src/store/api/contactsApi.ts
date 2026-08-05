import { apiSlice } from './apiSlice';
import { PaginatedResult, PageArgs, unwrapPaginated, buildPageQuery } from './paginated';

/**
 * Contact Interface
 * Represents a contact entity from the backend
 * Note: tenant_id is handled automatically by the backend through authentication
 */
export interface Contact {
  id: string;
  name: string;
  phone_number?: string;
  email?: string;
  tags?: string[];
  properties?: Record<string, any>;
  profile?: Record<string, any>;
  status?: 'active' | 'inactive';
  is_opted_out?: boolean;
  lastContact?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Create Contact DTO
 * Data Transfer Object for creating a new contact
 * Note: tenant_id is handled automatically by the backend through authentication
 */
export interface CreateContactDto {
  name: string;
  phone_number?: string;
  email?: string;
  tags?: string[];
  properties?: Record<string, any>;
  status?: 'active' | 'inactive';
}

/**
 * Update Contact DTO
 * Data Transfer Object for updating an existing contact
 */
export interface UpdateContactDto {
  name?: string;
  phone_number?: string;
  email?: string;
  tags?: string[];
  status?: 'active' | 'inactive';
  is_opted_out?: boolean;
}

/**
 * Update Properties DTO
 * For updating custom properties of a contact
 */
export interface UpdatePropertiesDto {
  properties: Record<string, any>;
}

export interface ContactsQueryParams extends PageArgs {
  q?: string;
  status?: string;
  created?: string;
}

/**
 * Contacts API Endpoints
 * Implements all backend endpoints from the NestJS ContactsController
 */
export const contactsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Create a new contact
     * POST /contacts
     * Note: tenant_id is automatically added by backend from auth token
     */
    createContact: builder.mutation<Contact, CreateContactDto>({
      query: (dto) => ({
        url: '/contacts',
        method: 'POST',
        body: dto,
      }),
      invalidatesTags: [{ type: 'Contact', id: 'LIST' }],
    }),

    /**
     * Get all contacts (server-side paginated)
     * GET /contacts?page=&limit=&q=&status=&created=
     * Backend filters by tenant_id automatically from auth token
     */
    getAllContacts: builder.query<PaginatedResult<Contact>, ContactsQueryParams | void>({
      query: (args) => {
        const a = args || undefined;
        const qs = buildPageQuery(a, {
          q: a?.q,
          status: a?.status,
          created: a?.created,
        });
        return `/contacts?${qs}`;
      },
      transformResponse: unwrapPaginated<Contact>,
      providesTags: (result) =>
        result?.data
          ? [
            ...result.data.map(({ id }) => ({ type: 'Contact' as const, id })),
            { type: 'Contact', id: 'LIST' },
          ]
          : [{ type: 'Contact', id: 'LIST' }],
      keepUnusedDataFor: 300,
    }),

    /**
     * Search contacts (server-side paginated)
     * GET /contacts/search?q=xxx&page=&limit=
     * Backend filters by tenant_id automatically from auth token
     */
    searchContacts: builder.query<PaginatedResult<Contact>, ContactsQueryParams | string>({
      query: (args) => {
        if (typeof args === 'string') {
          const qs = buildPageQuery(undefined, { q: args });
          return `/contacts/search?${qs}`;
        }
        const qs = buildPageQuery(args, { q: args.q });
        return `/contacts/search?${qs}`;
      },
      transformResponse: unwrapPaginated<Contact>,
      providesTags: (result) =>
        result?.data
          ? result.data.map(({ id }) => ({ type: 'Contact' as const, id }))
          : [],
    }),

    /**
     * Get a single contact by ID
     * GET /contacts/:id
     */
    getContactById: builder.query<Contact, string>({
      query: (id) => `/contacts/${id}`,
      providesTags: (result, error, id) => [{ type: 'Contact', id }],
    }),

    /**
     * Update a contact
     * PATCH /contacts/:id
     */
    updateContact: builder.mutation<Contact, { id: string; dto: UpdateContactDto }>({
      query: ({ id, dto }) => ({
        url: `/contacts/${id}`,
        method: 'PATCH',
        body: dto,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Contact', id },
        { type: 'Contact', id: 'LIST' },
      ],
      async onQueryStarted({ id, dto }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          contactsApi.util.updateQueryData('getContactById', id, (draft) => {
            Object.assign(draft, dto);
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),

    /**
     * Update contact properties
     * PATCH /contacts/:id/properties
     */
    updateContactProperties: builder.mutation<
      Contact,
      { id: string; properties: Record<string, any> }
    >({
      query: ({ id, properties }) => ({
        url: `/contacts/${id}/properties`,
        method: 'PATCH',
        body: { properties },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Contact', id },
        { type: 'Contact', id: 'LIST' },
      ],
      async onQueryStarted({ id, properties }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          contactsApi.util.updateQueryData('getContactById', id, (draft) => {
            draft.properties = { ...draft.properties, ...properties };
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),

    /**
     * Delete a contact
     * DELETE /contacts/:id
     */
    deleteContact: builder.mutation<void, string>({
      query: (id) => ({
        url: `/contacts/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Contact', id },
        { type: 'Contact', id: 'LIST' },
      ],
    }),

    /**
     * Bulk delete contacts
     * DELETE /contacts/bulk/delete
     */
    bulkDeleteContacts: builder.mutation<void, { ids: string[] }>({
      query: (body) => ({
        url: '/contacts/bulk/delete',
        method: 'DELETE',
        body,
      }),
      invalidatesTags: [{ type: 'Contact', id: 'LIST' }],
    }),

    /**
     * Bulk update contact status
     * PATCH /contacts/bulk/status
     */
    bulkUpdateContactStatus: builder.mutation<void, { ids: string[]; status: string }>({
      query: (body) => ({
        url: '/contacts/bulk/status',
        method: 'PATCH',
        body,
      }),
      invalidatesTags: [{ type: 'Contact', id: 'LIST' }],
    }),

    /**
     * Bulk add tags to contacts
     * POST /contacts/bulk/tags
     */
    bulkAddContactTags: builder.mutation<void, { ids: string[]; tags: string[] }>({
      query: (body) => ({
        url: '/contacts/bulk/tags',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Contact', id: 'LIST' }],
    }),

    /**
     * Download sample import file
     * GET /contacts/import/sample
     * Returns a CSV file with sample contact data
     */
    downloadSampleImportFile: builder.query<Blob, void>({
      query: () => ({
        url: '/contacts/import/sample',
        method: 'GET',
        responseHandler: async (response) => {
          return await response.blob();
        },
        cache: 'no-cache',
      }),
    }),

    /**
     * Import contacts from file
     * POST /import
     * Accepts a file (CSV/Excel) and optional field mapping
     */
    importContacts: builder.mutation<{ success: boolean; message: string; imported: number }, FormData>({
      query: (formData) => ({
        url: '/contacts/import',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: [{ type: 'Contact', id: 'LIST' }],
    }),
  }),
});

export const {
  useCreateContactMutation,
  useGetAllContactsQuery,
  useLazyGetAllContactsQuery,
  useSearchContactsQuery,
  useLazySearchContactsQuery,
  useGetContactByIdQuery,
  useLazyGetContactByIdQuery,
  useUpdateContactMutation,
  useUpdateContactPropertiesMutation,
  useDeleteContactMutation,
  useBulkDeleteContactsMutation,
  useBulkUpdateContactStatusMutation,
  useBulkAddContactTagsMutation,
  useLazyDownloadSampleImportFileQuery,
  useImportContactsMutation,
} = contactsApi;
