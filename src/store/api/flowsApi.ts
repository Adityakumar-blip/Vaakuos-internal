import { apiSlice } from './apiSlice';
import { PaginatedResult, PageArgs, unwrapPaginated, buildPageQuery } from './paginated';
import type {
  Flow,
  FlowNode,
  FlowConnection,
  FlowVariable,
  FlowSettings,
  FlowStats
} from '../../pages/modules/Automation/types';

export type {
  Flow,
  FlowNode,
  FlowConnection,
  FlowVariable,
  FlowSettings,
  FlowStats
};


/**
 * Flow Status Type
 */
export type FlowStatus = 'draft' | 'active' | 'paused' | 'archived';

/**
 * A single flow execution record (Phase 2 execution history).
 */
export interface FlowRun {
  id: string;
  status: 'running' | 'completed' | 'failed';
  trigger_type: string | null;
  contact_id: string | null;
  error: string | null;
  started_at: string;
  finished_at: string | null;
}

export interface FlowRunsResponse {
  data: FlowRun[];
  meta: { total: number; page: number; perPage: number; totalPages: number };
}

/**
 * Tenant-wide automation overview (dashboard).
 */
export interface FlowsOverview {
  totalFlows: number;
  activeFlows: number;
  totalExecutions: number;
  completedExecutions: number;
  failedExecutions: number;
  successRate: number;
}

/**
 * Create Flow DTO
 * Data Transfer Object for creating a new automation flow
 */
export interface CreateFlowDto {
  name: string;
  description?: string;
  status?: FlowStatus;
  nodes?: FlowNode[];
  connections?: FlowConnection[];
  variables?: FlowVariable[];
  settings?: FlowSettings;
  trigger_keywords?: string[];
}

/**
 * Update Flow DTO
 * Data Transfer Object for updating an existing flow
 */
export interface UpdateFlowDto {
  name?: string;
  description?: string;
  status?: FlowStatus;
  nodes?: FlowNode[];
  connections?: FlowConnection[];
  variables?: FlowVariable[];
  settings?: FlowSettings;
  trigger_keywords?: string[];
}

/**
 * Flows Query Parameters
 * For filtering and pagination
 */
export interface FlowsQueryParams extends PageArgs {
  status?: FlowStatus;
  q?: string;
}

/**
 * Flow API Response (single flow)
 */
export interface FlowResponse extends Flow {
  stats?: FlowStats;
}

export const flowsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Create a new automation flow
     * POST /automation/flows
     */
    createFlow: builder.mutation<FlowResponse, CreateFlowDto>({
      query: (dto) => ({
        url: '/automation/flows',
        method: 'POST',
        body: dto,
      }),
      invalidatesTags: [{ type: 'Flow', id: 'LIST' }],
      // Optimistic update
      async onQueryStarted(newFlow, { dispatch, queryFulfilled }) {
        try {
          const { data: createdFlow } = await queryFulfilled;
          // Update the cache optimistically for the flow list
          dispatch(
            flowsApi.util.updateQueryData(
              'getAllFlows',
              {},
              (draft) => {
                if (draft.data) {
                  draft.data.unshift(createdFlow);
                  draft.total += 1;
                }
              }
            )
          );
        } catch {
          // If the mutation fails, the cache will be automatically reverted
        }
      },
    }),

    /**
     * Get all flows with filtering and pagination
     * GET /automation/flows?page=1&limit=20&status=xxx&q=xxx
     * Backend filters by tenant_id automatically from auth token
     */
    getAllFlows: builder.query<PaginatedResult<Flow>, FlowsQueryParams | undefined>({
      query: (params) => {
        const qs = buildPageQuery(params, {
          status: params?.status,
          q: params?.q,
        });
        return `/automation/flows?${qs}`;
      },
      transformResponse: unwrapPaginated<Flow>,
      providesTags: (result) =>
        result?.data
          ? [
            ...result.data.map(({ id }) => ({ type: 'Flow' as const, id })),
            { type: 'Flow', id: 'LIST' },
          ]
          : [{ type: 'Flow', id: 'LIST' }],
      // Keep data fresh for 5 minutes
      keepUnusedDataFor: 300,
    }),

    /**
     * Get a single flow by ID
     * GET /automation/flows/:id
     */
    getFlowById: builder.query<FlowResponse, string>({
      query: (id) => `/automation/flows/${id}`,
      transformResponse: (response: any) => ({
        ...response,
        createdAt: response.createdAt || response.created_at,
        updatedAt: response.updatedAt || response.updated_at,
        tenantId: response.tenantId || response.tenant_id,
        triggerKeywords: response.triggerKeywords || response.trigger_keywords,
      }),
      providesTags: (result, error, id) => [{ type: 'Flow' as const, id }],
    }),

    /**
     * Update a flow
     * PATCH /automation/flows/:id
     */
    updateFlow: builder.mutation<FlowResponse, { id: string; dto: UpdateFlowDto }>({
      query: ({ id, dto }) => ({
        url: `/automation/flows/${id}`,
        method: 'PATCH',
        body: dto,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Flow', id },
        { type: 'Flow', id: 'LIST' },
      ],
      // Optimistic update
      async onQueryStarted({ id, dto }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          flowsApi.util.updateQueryData('getFlowById', id, (draft) => {
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
     * Delete a flow
     * DELETE /automation/flows/:id
     */
    deleteFlow: builder.mutation<void, string>({
      query: (id) => ({
        url: `/automation/flows/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Flow', id },
        { type: 'Flow', id: 'LIST' },
      ],
    }),

    /**
     * Duplicate a flow
     * POST /automation/flows/:id/duplicate
     */
    duplicateFlow: builder.mutation<FlowResponse, string>({
      query: (id) => ({
        url: `/automation/flows/${id}/duplicate`,
        method: 'POST',
      }),
      invalidatesTags: [{ type: 'Flow', id: 'LIST' }],
    }),

    /**
     * Play/Activate a flow
     * POST /automation/flows/:id/play
     */
    playFlow: builder.mutation<FlowResponse, string>({
      query: (id) => ({
        url: `/automation/flows/${id}/start`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Flow', id },
        { type: 'Flow', id: 'LIST' },
      ],
      // Optimistic update
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          flowsApi.util.updateQueryData('getFlowById', id, (draft) => {
            draft.status = 'active';
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
     * Pause a flow
     * POST /automation/flows/:id/pause
     */
    pauseFlow: builder.mutation<FlowResponse, string>({
      query: (id) => ({
        url: `/automation/flows/${id}/pause`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Flow', id },
        { type: 'Flow', id: 'LIST' },
      ],
      // Optimistic update
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          flowsApi.util.updateQueryData('getFlowById', id, (draft) => {
            draft.status = 'paused';
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
     * Archive a flow
     * POST /automation/flows/:id/archive
     */
    archiveFlow: builder.mutation<FlowResponse, string>({
      query: (id) => ({
        url: `/automation/flows/${id}/archive`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Flow', id },
        { type: 'Flow', id: 'LIST' },
      ],
      // Optimistic update
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          flowsApi.util.updateQueryData('getFlowById', id, (draft) => {
            draft.status = 'archived';
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
     * Get flow execution statistics
     * GET /automation/flows/:id/stats
     */
    getFlowStats: builder.query<FlowStats, string>({
      query: (id) => `/automation/flows/${id}/stats`,
      providesTags: (result, error, id) => [{ type: 'Flow', id: `${id}-stats` }],
    }),

    /**
     * Get paginated flow execution history (runs)
     * GET /automation/flows/:id/runs
     */
    getFlowRuns: builder.query<FlowRunsResponse, { id: string; page?: number; perPage?: number }>({
      query: ({ id, page = 1, perPage = 20 }) =>
        `/automation/flows/${id}/runs?page=${page}&perPage=${perPage}`,
      providesTags: (result, error, { id }) => [{ type: 'Flow', id: `${id}-runs` }],
    }),

    /**
     * Tenant-wide automation overview stats (dashboard)
     * GET /automation/flows/stats/overview
     */
    getFlowsOverview: builder.query<FlowsOverview, void>({
      query: () => `/automation/flows/stats/overview`,
      providesTags: [{ type: 'Flow', id: 'OVERVIEW' }],
    }),
  }),
});

/**
 * Export hooks for usage in functional components
 * These are auto-generated based on defined endpoints
 * 
 * Usage Examples:
 * 
 * // Create a flow
 * const [createFlow, { isLoading }] = useCreateFlowMutation();
 * await createFlow({ 
 *   name: 'Welcome Flow', 
 *   description: 'Automated welcome message',
 *   status: 'draft',
 *   nodes: [...],
 *   connections: [...],
 * });
 * 
 * // Get all flows (tenant filtered automatically by backend)
 * const { data: flows, isLoading } = useGetAllFlowsQuery({ page: 1, perPage: 20 });
 * 
 * // Get all flows with filters
 * const { data: flows } = useGetAllFlowsQuery({ 
 *   status: 'active', 
 *   q: 'welcome' 
 * });
 * 
 * // Get single flow
 * const { data: flow } = useGetFlowByIdQuery('flow_id');
 * 
 * // Update flow
 * const [updateFlow] = useUpdateFlowMutation();
 * await updateFlow({ id: 'flow_id', dto: { name: 'New Name', nodes: [...] } });
 * 
 * // Delete flow
 * const [deleteFlow] = useDeleteFlowMutation();
 * await deleteFlow('flow_id');
 * 
 * // Play/Pause/Archive flow
 * const [playFlow] = usePlayFlowMutation();
 * const [pauseFlow] = usePauseFlowMutation();
 * const [archiveFlow] = useArchiveFlowMutation();
 * await playFlow('flow_id');
 * 
 * // Duplicate flow
 * const [duplicateFlow] = useDuplicateFlowMutation();
 * await duplicateFlow('flow_id');
 * 
 * // Get flow statistics
 * const { data: stats } = useGetFlowStatsQuery('flow_id');
 */
export const {
  useCreateFlowMutation,
  useGetAllFlowsQuery,
  useLazyGetAllFlowsQuery,
  useGetFlowByIdQuery,
  useLazyGetFlowByIdQuery,
  useUpdateFlowMutation,
  useDeleteFlowMutation,
  useDuplicateFlowMutation,
  usePlayFlowMutation,
  usePauseFlowMutation,
  useArchiveFlowMutation,
  useGetFlowStatsQuery,
  useLazyGetFlowStatsQuery,
  useGetFlowRunsQuery,
  useLazyGetFlowRunsQuery,
  useGetFlowsOverviewQuery,
} = flowsApi;
