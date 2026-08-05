import { apiSlice } from "./apiSlice";
import { PaginatedResult, PageArgs, unwrapPaginated, buildPageQuery } from "./paginated";
import { ActivityLog } from "@/types/owner.types";

/**
 * Activity/Audit Logs API
 * Backs both the Audit Trail and Error Logs admin pages off the same
 * `/admin/activity-logs` table — pages differ only by the `level` filter they send.
 */

/** Raw shape returned by the backend — Prisma columns, snake_case. */
interface RawActivityLog {
  id: string;
  tenant_id: string;
  user_id?: string;
  module: string;
  action: string;
  level: ActivityLog["level"];
  message: string;
  details?: Record<string, unknown>;
  resource_id?: string;
  resource_type?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

function normalizeActivityLog(raw: RawActivityLog): ActivityLog {
  return {
    id: raw.id,
    tenantId: raw.tenant_id,
    userId: raw.user_id,
    module: raw.module,
    action: raw.action,
    level: raw.level,
    message: raw.message,
    details: raw.details,
    resourceId: raw.resource_id,
    resourceType: raw.resource_type,
    ipAddress: raw.ip_address,
    userAgent: raw.user_agent,
    createdAt: raw.created_at,
  };
}

export interface ActivityLogsQueryParams extends PageArgs {
  level?: string;
  module?: string;
  action?: string;
  resourceType?: string;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface PurgeActivityLogsParams {
  before?: string;
}

export const logsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * List activity/audit log entries (paginated, filterable).
     */
    getActivityLogs: builder.query<PaginatedResult<ActivityLog>, ActivityLogsQueryParams | void>({
      query: (args) => {
        const a = args || undefined;
        const qs = buildPageQuery(a, {
          level: a?.level,
          module: a?.module,
          action: a?.action,
          resourceType: a?.resourceType,
          userId: a?.userId,
          dateFrom: a?.dateFrom,
          dateTo: a?.dateTo,
        });
        return `/admin/activity-logs?${qs}`;
      },
      transformResponse: (response: unknown) => {
        const result = unwrapPaginated<RawActivityLog>(response);
        return { ...result, data: result.data.map(normalizeActivityLog) };
      },
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ id }) => ({ type: "Log" as const, id })),
              { type: "Log" as const, id: "LIST" },
            ]
          : [{ type: "Log" as const, id: "LIST" }],
    }),

    /**
     * Purge log entries, optionally scoped to everything older than `before`.
     */
    purgeActivityLogs: builder.mutation<{ success: boolean }, PurgeActivityLogsParams | void>({
      query: (args) => {
        const params = new URLSearchParams();
        if (args?.before) params.set("before", args.before);
        const qs = params.toString();
        return {
          url: `/admin/activity-logs${qs ? `?${qs}` : ""}`,
          method: "DELETE",
        };
      },
      invalidatesTags: [{ type: "Log", id: "LIST" }],
    }),
  }),
});

export const { useGetActivityLogsQuery, usePurgeActivityLogsMutation } = logsApi;
