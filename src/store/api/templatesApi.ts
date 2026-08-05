import { apiSlice } from "./apiSlice";

// Default WABA Account ID for template creation
const DEFAULT_WABA_ACCOUNT_ID = "866514506068788";

/**
 * Template Interface
 * Represents a WhatsApp message template entity from the backend
 * Note: tenant_id is handled automatically by the backend through authentication
 */
export interface Template {
  id: string;
  name: string;
  category?: string;
  language?: string;
  // Normalized backend bucket (see templates.service STATUS_BY_EVENT); meta_status keeps the raw Meta event.
  status?: "DRAFT" | "IN_REVIEW" | "APPROVED" | "REJECTED" | "PAUSED" | "FLAGGED" | "DISABLED" | "ARCHIVED" | "DELETED" | "PENDING_DELETION";
  meta_status?: string;
  rejection_reason?: string;
  quality_rating?: "GREEN" | "YELLOW" | "RED" | "UNKNOWN";
  version?: number;
  components?: TemplateComponent[];
  created_at: string;
  updated_at: string;
}

/**
 * Template Component Interface
 * Represents a component within a template (header, body, footer, buttons)
 */
export interface TemplateComponent {
  type: "HEADER" | "BODY" | "FOOTER" | "BUTTONS" | "CAROUSEL";
  format?: "TEXT" | "IMAGE" | "VIDEO" | "DOCUMENT";
  text?: string;
  example?: {
    header_text?: string[];
    header_handle?: string[]; // For media (IMAGE, VIDEO, DOCUMENT)
    body_text?: string[][];
  };
  buttons?: TemplateButton[];
  // AUTHENTICATION category: BODY carries add_security_recommendation, FOOTER carries
  // code_expiration_minutes; neither has free text (Meta auto-generates the copy).
  add_security_recommendation?: boolean;
  code_expiration_minutes?: number;
  // CAROUSEL component: 2-10 structurally-identical cards.
  cards?: TemplateCarouselCard[];
}

/**
 * One carousel card — a media header + optional body + 1-2 buttons.
 * Every card in a template must share the same structure.
 */
export interface TemplateCarouselCard {
  components: TemplateComponent[];
}

/**
 * Template Button Interface
 */
export interface TemplateButton {
  type: "QUICK_REPLY" | "URL" | "PHONE_NUMBER" | "OTP";
  text?: string;         // optional for OTP (Meta supplies a default label)
  url?: string;          // may contain a trailing {{1}} for dynamic URLs
  phone_number?: string;
  example?: string[];    // sample full URL, required by Meta when url is dynamic
  // OTP buttons (AUTHENTICATION templates)
  otp_type?: "COPY_CODE" | "ONE_TAP" | "ZERO_TAP";
  autofill_text?: string;
  supported_apps?: { package_name: string; signature_hash: string }[];
}

/**
 * Create Template DTO
 * Data Transfer Object for creating a new template
 * Note: tenant_id is handled automatically by the backend through authentication
 */
export interface CreateTemplateDto {
  name: string;
  category?: string;
  language?: string;
  components?: TemplateComponent[];
}

/**
 * Update Template DTO
 * Data Transfer Object for updating an existing template
 */
export interface UpdateTemplateDto {
  name?: string;
  category?: string;
  language?: string;
  status?: "DRAFT" | "PENDING" | "APPROVED" | "REJECTED";
  components?: TemplateComponent[];
}

/**
 * Templates Query Parameters
 * For filtering and pagination
 */
export interface TemplatesQueryParams {
  page?: number;
  perPage?: number;
  status?: string;
  meta_status?: string;
  language?: string;
  q?: string;
}

/**
 * Paginated Templates Response
 */
export interface PaginatedTemplatesResponse {
  data: Template[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
}

export const templatesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createTemplate: builder.mutation<Template, CreateTemplateDto>({
      query: (dto) => ({
        url: "/templates/create",
        method: "POST",
        body: {
          ...dto,
        },
      }),
      invalidatesTags: [{ type: "Template", id: "LIST" }],
      // Optimistic update
      async onQueryStarted(newTemplate, { dispatch, queryFulfilled }) {
        try {
          const { data: createdTemplate } = await queryFulfilled;
          // Update the cache optimistically for the template list
          dispatch(
            templatesApi.util.updateQueryData(
              "getAllTemplates",
              {},
              (draft) => {
                if (draft.data) {
                  draft.data.unshift(createdTemplate);
                  draft.meta.total += 1;
                }
              },
            ),
          );
        } catch {
          // If the mutation fails, the cache will be automatically reverted
        }
      },
    }),

    /**
     * Submit template to Meta for approval
     * POST /templates/:id/submit
     */
    submitTemplateToMeta: builder.mutation<Template, string>({
      query: (id) => ({
        url: `/templates/${id}/submit`,
        method: "POST",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Template", id },
        { type: "Template", id: "LIST" },
      ],
      // Optimistic update
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          templatesApi.util.updateQueryData("getTemplateById", id, (draft) => {
            draft.status = "IN_REVIEW";
          }),
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),

    /**
     * Get all templates with filtering and pagination
     * GET /templates?page=1&perPage=20&status=xxx&meta_status=xxx&q=xxx
     * Backend filters by tenant_id automatically from auth token
     */
    getAllTemplates: builder.query<
      PaginatedTemplatesResponse,
      TemplatesQueryParams | undefined
    >({
      query: (params) => {
        const searchParams = new URLSearchParams();

        if (params?.page) searchParams.append("page", params.page.toString());
        if (params?.perPage)
          searchParams.append("perPage", params.perPage.toString());
        if (params?.status) searchParams.append("status", params.status);
        if (params?.meta_status)
          searchParams.append("meta_status", params.meta_status);
        if (params?.language) searchParams.append("language", params.language);
        if (params?.q) searchParams.append("q", params.q);

        const queryString = searchParams.toString();
        return `/templates${queryString ? `?${queryString}` : ""}`;
      },
      providesTags: (result) =>
        result?.data
          ? [
            ...result.data.map(({ id }) => ({
              type: "Template" as const,
              id,
            })),
            { type: "Template", id: "LIST" },
          ]
          : [{ type: "Template", id: "LIST" }],
      // Keep data fresh for 5 minutes
      keepUnusedDataFor: 300,
      // Live-update the list when Meta approves/rejects a template (realtime gateway push).
      async onCacheEntryAdded(arg, { cacheDataLoaded, cacheEntryRemoved, dispatch }) {
        await cacheDataLoaded;

        const { io } = await import("socket.io-client");
        const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
        const socket = io(baseUrl, {
          withCredentials: true,
          transports: ["websocket"],
          forceNew: true,
        });

        socket.on("TEMPLATE_STATUS_UPDATE", (data: { id?: string }) => {
          dispatch(
            templatesApi.util.invalidateTags([
              { type: "Template", id: "LIST" },
              ...(data?.id ? [{ type: "Template" as const, id: data.id }] : []),
            ]),
          );
        });

        await cacheEntryRemoved;
        socket.disconnect();
      },
    }),

    /**
     * Get a single template by ID
     * GET /templates/:id
     */
    getTemplateById: builder.query<Template, string>({
      query: (id) => `/templates/${id}`,
      providesTags: (result, error, id) => [{ type: "Template", id }],
    }),

    /**
     * Update a template
     * PATCH /templates/:id
     */
    updateTemplate: builder.mutation<
      Template,
      { id: string; dto: UpdateTemplateDto }
    >({
      query: ({ id, dto }) => ({
        url: `/templates/${id}`,
        method: "PATCH",
        body: dto,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Template", id },
        { type: "Template", id: "LIST" },
      ],
      // Optimistic update
      async onQueryStarted({ id, dto }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          templatesApi.util.updateQueryData("getTemplateById", id, (draft) => {
            Object.assign(draft, dto);
          }),
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),

    /**
     * Delete a template
     * DELETE /templates/:id
     */
    deleteTemplate: builder.mutation<void, string>({
      query: (id) => ({
        url: `/templates/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Template", id },
        { type: "Template", id: "LIST" },
      ],
    }),

    /**
     * Submit templates to Meta in bulk
     * POST /templates/bulk-submit
     */
    bulkSubmitTemplatesToMeta: builder.mutation<void, { ids: string[] }>({
      query: (body) => ({
        url: '/templates/bulk-submit',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Template', id: 'LIST' }],
    }),

    /**
     * Delete templates in bulk
     * DELETE /templates/bulk
     */
    bulkDeleteTemplates: builder.mutation<void, { ids: string[] }>({
      query: (body) => ({
        url: '/templates/bulk',
        method: 'DELETE',
        body,
      }),
      invalidatesTags: [{ type: 'Template', id: 'LIST' }],
    }),

    /**
     * Update template status in bulk
     * PATCH /templates/bulk-status
     */
    bulkUpdateTemplateStatus: builder.mutation<void, { ids: string[]; status: string }>({
      query: (body) => ({
        url: '/templates/bulk-status',
        method: 'PATCH',
        body,
      }),
      invalidatesTags: [{ type: 'Template', id: 'LIST' }],
    }),

    /**
     * Upload template media file
     * POST /templates/upload
     * Accepts a file (IMAGE, VIDEO, DOCUMENT) for template header
     * Returns the uploaded file URL
     */
    uploadTemplateMedia: builder.mutation<
      { url: string; file_url?: string; path?: string },
      FormData
    >({
      query: (formData) => ({
        url: "/media/upload",
        method: "POST",
        body: formData,
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
 * // Create a template
 * const [createTemplate, { isLoading }] = useCreateTemplateMutation();
 * await createTemplate({
 *   name: 'welcome_message',
 *   category: 'MARKETING',
 *   language: 'en',
 *   components: [...]
 * });
 *
 * // Get all templates (tenant filtered automatically by backend)
 * const { data: templates, isLoading } = useGetAllTemplatesQuery({ page: 1, perPage: 20 });
 *
 * // Get all templates with filters
 * const { data: templates } = useGetAllTemplatesQuery({
 *   status: 'APPROVED',
 *   q: 'welcome'
 * });
 *
 * // Get single template
 * const { data: template } = useGetTemplateByIdQuery('template_id');
 *
 * // Update template
 * const [updateTemplate] = useUpdateTemplateMutation();
 * await updateTemplate({ id: 'template_id', dto: { name: 'new_name' } });
 *
 * // Submit template to Meta
 * const [submitTemplate] = useSubmitTemplateToMetaMutation();
 * await submitTemplate('template_id');
 *
 * // Delete template
 * const [deleteTemplate] = useDeleteTemplateMutation();
 * await deleteTemplate('template_id');
 */
export const {
  useCreateTemplateMutation,
  useSubmitTemplateToMetaMutation,
  useGetAllTemplatesQuery,
  useLazyGetAllTemplatesQuery,
  useGetTemplateByIdQuery,
  useLazyGetTemplateByIdQuery,
  useUpdateTemplateMutation,
  useDeleteTemplateMutation,
  useUploadTemplateMediaMutation,
  useBulkSubmitTemplatesToMetaMutation,
  useBulkDeleteTemplatesMutation,
  useBulkUpdateTemplateStatusMutation,
} = templatesApi;
