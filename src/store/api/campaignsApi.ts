import { apiSlice } from './apiSlice';
import { PaginatedResult, PageArgs, unwrapPaginated, buildPageQuery } from './paginated';

/**
 * Campaign Interface
 */
export interface Campaign {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'scheduled' | 'completed' | 'draft' | 'paused' | 'processing' | 'failed';
  template_id?: string;
  contact_ids?: string[];
  payload?: Record<string, unknown>;
  metrics?: {
    sent: number;
    delivered: number;
    read: number;
    failed?: number;
    queued?: number;
    pending?: number;
    total_contacts?: number;
  };
  scheduled_at?: string;
  waba_account_id?: string;
  created_at: string;
  updated_at: string;
  /** Live send stats attached by the list endpoint (GET /campaigns). */
  stats?: CampaignStats;
}

/**
 * Create Campaign DTO
 */
export interface AudienceFilter {
  all?: boolean;
  tags?: string[];
  search?: string;
}

export interface CreateCampaignDto {
  name: string;
  type: string;
  template_id?: string;
  contact_ids?: string[];
  audience_filter?: AudienceFilter;
  payload?: Record<string, unknown>;
  status?: string;
  metrics?: Record<string, unknown>;
  scheduled_at?: string;
  waba_account_id?: string;
}

/**
 * Update Campaign DTO
 */
export type UpdateCampaignDto = Partial<CreateCampaignDto>;

export interface CampaignsQueryParams extends PageArgs {
  search?: string;
  status?: string;
  channel?: string;
}

/**
 * Live send stats for a campaign (GET /campaigns/:id/stats).
 * Counts are funnel-cumulative: sent ⊇ delivered ⊇ read.
 * queued = audience not yet picked up by a send job.
 */
export interface CampaignStats {
  campaign_id: string;
  status: string;
  total: number;
  queued: number;
  pending: number;
  sent: number;
  delivered: number;
  read: number;
  failed: number;
  processed: number;
}

/**
 * Campaigns API Endpoints
 */
export const campaignsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Create a new campaign
     * POST /campaigns
     */
    createCampaign: builder.mutation<Campaign, CreateCampaignDto>({
      query: (dto) => ({
        url: '/campaigns',
        method: 'POST',
        body: dto,
      }),
      invalidatesTags: [{ type: 'Campaign', id: 'LIST' }],
    }),

    /**
     * Get all campaigns (server-side paginated)
     * GET /campaigns?page=&limit=&search=&status=&channel=
     * Backend uses FilterCampaignDto: search, status, channel, page, limit
     */
    getAllCampaigns: builder.query<PaginatedResult<Campaign>, CampaignsQueryParams | void>({
      query: (args) => {
        const a:any = args || undefined;
        // Backend uses `search` (not `q`) and `limit` (via buildPageQuery)
        const qs = buildPageQuery(a, {
          search: a?.search,
          status: a?.status,
          channel: a?.channel,
        });
        return `/campaigns?${qs}`;
      },
      transformResponse: unwrapPaginated<Campaign>,
      providesTags: (result) =>
        result?.data
          ? [
            ...result.data.map(({ id }) => ({ type: 'Campaign' as const, id })),
            { type: 'Campaign', id: 'LIST' },
          ]
          : [{ type: 'Campaign', id: 'LIST' }],
    }),

    /**
     * Get a single campaign by ID
     * GET /campaigns/:id
     */
    getCampaignById: builder.query<Campaign, string>({
      query: (id) => `/campaigns/${id}`,
      providesTags: (result, error, id) => [{ type: 'Campaign', id }],
    }),

    /**
     * Get live send stats for a campaign
     * GET /campaigns/:id/stats
     * Funnel-cumulative status counts; poll while the campaign is sending.
     */
    getCampaignStats: builder.query<CampaignStats, string>({
      query: (id) => `/campaigns/${id}/stats`,
      providesTags: (result, error, id) => [{ type: 'Campaign', id }],
    }),

    /**
     * Update a campaign
     * PATCH /campaigns/:id
     */
    updateCampaign: builder.mutation<Campaign, { id: string; dto: UpdateCampaignDto }>({
      query: ({ id, dto }) => ({
        url: `/campaigns/${id}`,
        method: 'PATCH',
        body: dto,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Campaign', id },
        { type: 'Campaign', id: 'LIST' },
      ],
    }),

    /**
     * Execute (launch) a campaign now
     * POST /campaigns/:id/execute
     * Triggers message sending via the BullMQ campaign queue.
     */
    executeCampaign: builder.mutation<void, string>({
      query: (id) => ({
        url: `/campaigns/${id}/execute`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Campaign', id },
        { type: 'Campaign', id: 'LIST' },
      ],
    }),

    /**
     * Delete a campaign
     * DELETE /campaigns/:id
     */
    deleteCampaign: builder.mutation<void, string>({
      query: (id) => ({
        url: `/campaigns/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Campaign', id },
        { type: 'Campaign', id: 'LIST' },
      ],
    }),

    /**
     * Bulk delete campaigns
     * DELETE /campaigns/bulk/delete
     */
    bulkDeleteCampaigns: builder.mutation<void, { ids: string[] }>({
      query: (body) => ({
        url: '/campaigns/bulk/delete',
        method: 'DELETE',
        body,
      }),
      invalidatesTags: [{ type: 'Campaign', id: 'LIST' }],
    }),

    /**
     * Bulk update campaign status
     * PATCH /campaigns/bulk/status
     */
    bulkUpdateCampaignStatus: builder.mutation<void, { ids: string[]; status: string }>({
      query: (body) => ({
        url: '/campaigns/bulk/status',
        method: 'PATCH',
        body,
      }),
      invalidatesTags: [{ type: 'Campaign', id: 'LIST' }],
    }),

    /**
     * Bulk schedule campaigns
     * PATCH /campaigns/bulk/schedule
     */
    bulkScheduleCampaigns: builder.mutation<void, { ids: string[]; scheduleDate: string }>({
      query: (body) => ({
        url: '/campaigns/bulk/schedule',
        method: 'PATCH',
        body,
      }),
      invalidatesTags: [{ type: 'Campaign', id: 'LIST' }],
    }),

    /**
     * Add contacts to a campaign
     * POST /campaigns/:id/contacts
     */
    addContactsToCampaign: builder.mutation<void, { campaignId: string; contactIds: string[] }>({
      query: ({ campaignId, contactIds }) => ({
        url: `/campaigns/${campaignId}/contacts`,
        method: 'POST',
        body: { contactIds },
      }),
      invalidatesTags: (result, error, { campaignId }) => [
        { type: 'Campaign', id: campaignId },
        { type: 'Campaign', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useCreateCampaignMutation,
  useGetAllCampaignsQuery,
  useGetCampaignByIdQuery,
  useGetCampaignStatsQuery,
  useUpdateCampaignMutation,
  useExecuteCampaignMutation,
  useDeleteCampaignMutation,
  useBulkDeleteCampaignsMutation,
  useBulkUpdateCampaignStatusMutation,
  useBulkScheduleCampaignsMutation,
  useAddContactsToCampaignMutation,
} = campaignsApi;
