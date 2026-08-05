import { apiSlice } from './apiSlice';
import { unwrapList } from './unwrapList';

/**
 * Integration Interface
 * Represents an integration entity from the backend
 */
export interface Integration {
  id: string;
  tenant_id: string;
  provider: string;
  name: string;
  description: string;
  icon_url: string;
  status: 'connected' | 'disconnected';
  is_enabled: boolean;
  config: {
    scopes?: string[];
    [key: string]: any;
  };
  metadata: {
    version?: string;
    api_endpoint?: string;
    [key: string]: any;
  };
  connected_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Create Integration DTO
 * Data Transfer Object for creating a new integration
 */
export interface CreateIntegrationDto {
  provider: string;
  name: string;
  description: string;
  icon_url?: string;
  is_enabled?: boolean;
  config?: Record<string, any>;
  metadata?: Record<string, any>;
}

/**
 * Update Integration DTO
 * Data Transfer Object for updating an existing integration
 */
export interface UpdateIntegrationDto {
  name?: string;
  description?: string;
  icon_url?: string;
  is_enabled?: boolean;
  config?: Record<string, any>;
  metadata?: Record<string, any>;
}

/** A spreadsheet in the connected Google account. */
export interface GoogleSpreadsheet {
  id: string;
  name: string;
  modifiedTime?: string;
}

/** Preview of a sheet tab returned by the backend. */
export interface GoogleSheetPreview {
  headers: string[];
  sampleRows: Record<string, string>[];
  totalRows: number;
}

/** Request body for importing contacts from a sheet tab. */
export interface GoogleSheetImportRequest {
  tab?: string;
  skipDuplicates?: boolean;
  updateExisting?: boolean;
  tagIds?: string[];
  columnMapping?: Record<string, string>;
}

/** Request body for exporting contacts to a sheet tab. */
export interface GoogleSheetExportRequest {
  tab?: string;
  contactIds?: string[];
  columns?: string[];
}

/** Result returned after a sheet import. */
export interface GoogleSheetImportResult {
  success: boolean;
  totalRows: number;
  imported: number;
  updated: number;
  skipped: number;
  failed: number;
  errors: { row: number; data: any; error: string }[];
}

/**
 * Integrations API Endpoints
 * Implements all backend endpoints for integrations management
 * 
 * Available Endpoints:
 * - POST /integrations - Create a new integration
 * - GET /integrations/all - Get all integrations (tenant filtered by backend)
 * - GET /integrations/:id - Get a single integration by ID
 * - PATCH /integrations/:id - Update an integration
 * - DELETE /integrations/:id - Delete an integration
 * - POST /integrations/:id/connect - Connect an integration
 * - POST /integrations/:id/disconnect - Disconnect an integration
 */
export const integrationsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Create a new integration
     * POST /integrations
     * Note: tenant_id is automatically added by backend from auth token
     */
    createIntegration: builder.mutation<Integration, CreateIntegrationDto>({
      query: (dto) => ({
        url: '/integrations',
        method: 'POST',
        body: dto,
      }),
      invalidatesTags: [{ type: 'Integration', id: 'LIST' }],
    }),

    /**
     * Get all integrations
     * GET /integrations/all
     * Backend filters by tenant_id automatically from auth token
     */
    getAllIntegrations: builder.query<Integration[], void>({
      query: () => '/integrations/all',
      transformResponse: unwrapList<Integration>,
      providesTags: (result) =>
        result
          ? [
            ...result.map(({ id }) => ({ type: 'Integration' as const, id })),
            { type: 'Integration', id: 'LIST' },
          ]
          : [{ type: 'Integration', id: 'LIST' }],
      // Keep data fresh for 5 minutes
      keepUnusedDataFor: 300,
    }),

    /**
     * Get a single integration by ID
     * GET /integrations/:id
     */
    getIntegrationById: builder.query<Integration, string>({
      query: (id) => `/integrations/${id}`,
      providesTags: (result, error, id) => [{ type: 'Integration', id }],
    }),

    /**
     * Update an integration
     * PATCH /integrations/:id
     */
    updateIntegration: builder.mutation<Integration, { id: string; dto: UpdateIntegrationDto }>({
      query: ({ id, dto }) => ({
        url: `/integrations/${id}`,
        method: 'PATCH',
        body: dto,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Integration', id },
        { type: 'Integration', id: 'LIST' },
      ],
      // Optimistic update
      async onQueryStarted({ id, dto }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          integrationsApi.util.updateQueryData('getIntegrationById', id, (draft) => {
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
     * Delete an integration
     * DELETE /integrations/:id
     */
    deleteIntegration: builder.mutation<void, string>({
      query: (id) => ({
        url: `/integrations/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Integration', id },
        { type: 'Integration', id: 'LIST' },
      ],
    }),

    /**
     * Connect an integration
     * POST /integrations/:id/connect
     */
    connectIntegration: builder.mutation<Integration, string>({
      query: (id) => ({
        url: `/integrations/${id}/connect`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Integration', id },
        { type: 'Integration', id: 'LIST' },
      ],
    }),

    /**
     * Disconnect an integration
     * POST /integrations/:id/disconnect
     */
    disconnectIntegration: builder.mutation<Integration, string>({
      query: (id) => ({
        url: `/integrations/${id}/disconnect`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Integration', id },
        { type: 'Integration', id: 'LIST' },
      ],
    }),

    getGoogleSheetsAuthUrl: builder.query<{ authUrl: string }, void>({
      query: () => '/google-sheets/auth/url',
    }),

    /**
     * Whether Google Sheets is connected for the current tenant.
     * GET /google-sheets/auth/status
     */
    getGoogleSheetsStatus: builder.query<{ connected: boolean; expiresAt?: string }, void>({
      query: () => '/google-sheets/auth/status',
    }),

    /**
     * List the connected account's spreadsheets (for the import picker).
     * GET /google-sheets/spreadsheets
     */
    getGoogleSheetsSpreadsheets: builder.query<GoogleSpreadsheet[], void>({
      query: () => '/google-sheets/spreadsheets',
      transformResponse: (res: { spreadsheets: GoogleSpreadsheet[] }) => res?.spreadsheets ?? [],
    }),

    /**
     * List the tab names within a spreadsheet.
     * GET /google-sheets/spreadsheets/:id/tabs
     */
    getGoogleSheetsTabs: builder.query<string[], string>({
      query: (spreadsheetId) => `/google-sheets/spreadsheets/${spreadsheetId}/tabs`,
      transformResponse: (res: { tabs: string[] }) => res?.tabs ?? [],
    }),

    /**
     * Preview a sheet tab: headers + sample rows for column mapping.
     * GET /google-sheets/spreadsheets/:id/preview?tab=
     */
    getGoogleSheetsPreview: builder.query<GoogleSheetPreview, { spreadsheetId: string; tab?: string }>({
      query: ({ spreadsheetId, tab }) =>
        `/google-sheets/spreadsheets/${spreadsheetId}/preview${tab ? `?tab=${encodeURIComponent(tab)}` : ''}`,
    }),

    /**
     * Import contacts from a sheet tab.
     * POST /google-sheets/spreadsheets/:id/import
     */
    importContactsFromGoogleSheet: builder.mutation<
      GoogleSheetImportResult,
      { spreadsheetId: string; body: GoogleSheetImportRequest }
    >({
      query: ({ spreadsheetId, body }) => ({
        url: `/google-sheets/spreadsheets/${spreadsheetId}/import`,
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Contact', id: 'LIST' }],
    }),

    /**
     * Export contacts to a sheet tab (overwrites the tab with a fresh snapshot).
     * POST /google-sheets/spreadsheets/:id/export-contacts
     */
    exportContactsToGoogleSheet: builder.mutation<
      { success: boolean; exported: number },
      { spreadsheetId: string; body: GoogleSheetExportRequest }
    >({
      query: ({ spreadsheetId, body }) => ({
        url: `/google-sheets/spreadsheets/${spreadsheetId}/export-contacts`,
        method: 'POST',
        body,
      }),
    }),
    getShopifyAuthUrl: builder.query<{ authUrl: string }, { shop: string }>({
      query: ({ shop }) => `/shopify/auth/url?shop=${shop}`,
    }),
    /**
     * Shopify connection status for the current tenant.
     * GET /shopify/auth/status → { connected, shop, scopes?, connectedAt? }
     */
    getShopifyStatus: builder.query<
      { connected: boolean; shop?: string | null; scopes?: string | null; connectedAt?: string | null },
      void
    >({
      query: () => '/shopify/auth/status',
    }),
    // Binds the store to the logged-in tenant. The backend reads the Admin token
    // from its shop-keyed store (parked during OAuth), so the client sends only the shop.
    registerShopifyWebhooks: builder.mutation<{ success: boolean }, { shop: string, scopes?: string }>({
      query: ({ shop, scopes }) => ({
        url: `/shopify/link`,
        method: 'POST',
        body: { shop, scopes },
      }),
    }),
  }),
});

/**
 * Export hooks for usage in functional components
 * These are auto-generated based on defined endpoints
 * 
 * Usage Examples:
 * 
 * // Create an integration
 * const [createIntegration, { isLoading }] = useCreateIntegrationMutation();
 * await createIntegration({ provider: 'google_sheets', name: 'Google Sheets' });
 * 
 * // Get all integrations (tenant filtered automatically by backend)
 * const { data: integrations, isLoading } = useGetAllIntegrationsQuery();
 * 
 * // Get single integration
 * const { data: integration } = useGetIntegrationByIdQuery('integration_id');
 * 
 * // Update integration
 * const [updateIntegration] = useUpdateIntegrationMutation();
 * await updateIntegration({ id: 'integration_id', dto: { name: 'New Name' } });
 * 
 * // Delete integration
 * const [deleteIntegration] = useDeleteIntegrationMutation();
 * await deleteIntegration('integration_id');
 * 
 * // Connect integration
 * const [connectIntegration] = useConnectIntegrationMutation();
 * await connectIntegration('integration_id');
 * 
 * // Disconnect integration
 * const [disconnectIntegration] = useDisconnectIntegrationMutation();
 * await disconnectIntegration('integration_id');
 */
export const {
  useCreateIntegrationMutation,
  useGetAllIntegrationsQuery,
  useLazyGetAllIntegrationsQuery,
  useGetIntegrationByIdQuery,
  useLazyGetIntegrationByIdQuery,
  useUpdateIntegrationMutation,
  useDeleteIntegrationMutation,
  useConnectIntegrationMutation,
  useDisconnectIntegrationMutation,
  useGetGoogleSheetsAuthUrlQuery,
  useLazyGetGoogleSheetsAuthUrlQuery,
  useGetGoogleSheetsStatusQuery,
  useGetGoogleSheetsSpreadsheetsQuery,
  useLazyGetGoogleSheetsSpreadsheetsQuery,
  useGetGoogleSheetsTabsQuery,
  useLazyGetGoogleSheetsTabsQuery,
  useGetGoogleSheetsPreviewQuery,
  useLazyGetGoogleSheetsPreviewQuery,
  useImportContactsFromGoogleSheetMutation,
  useExportContactsToGoogleSheetMutation,
  useGetShopifyAuthUrlQuery,
  useLazyGetShopifyAuthUrlQuery,
  useGetShopifyStatusQuery,
  useRegisterShopifyWebhooksMutation,
} = integrationsApi;
