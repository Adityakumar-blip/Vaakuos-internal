/**
 * Server-side pagination helpers shared by every list endpoint.
 *
 * The backend has two pagination response shapes:
 *  - `buildPaginatedResponse` → `{ data, pagination: { page, limit, total, totalPages } }`
 *    (contacts, tickets, campaigns, coupons, offers, users, automation, …)
 *  - Templates-style          → `{ data, meta:        { page, perPage, total, totalPages } }`
 * Some legacy endpoints still return a bare array. `unwrapPaginated` normalizes
 * all three into a single `PaginatedResult<T>` so table components can wire the
 * shared `DataTable` identically everywhere.
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

/** Canonical pagination args every list query hook accepts. */
export interface PageArgs {
  page?: number;
  perPage?: number;
}

/** Normalize any backend list response into a `PaginatedResult<T>`. */
export function unwrapPaginated<T>(response: any): PaginatedResult<T> {
  if (Array.isArray(response)) {
    const len = response.length;
    return { data: response, total: len, page: 1, perPage: len || 1, totalPages: 1 };
  }
  const data: T[] = response?.data ?? [];
  const m = response?.pagination ?? response?.meta ?? {};
  const total = m.total ?? data.length;
  const perPage = m.perPage ?? m.limit ?? (data.length || 1);
  const page = m.page ?? 1;
  const totalPages = m.totalPages ?? (perPage > 0 ? Math.ceil(total / perPage) : 1);
  return { data, total, page, perPage, totalPages };
}

/**
 * Build a `?page=&limit=` query string for `buildPaginatedResponse` endpoints.
 * Pass extra params (search/status/…) as `extra`; nullish values are dropped.
 * (Templates uses `perPage` instead of `limit` — build its string inline.)
 */
export function buildPageQuery(
  args: (PageArgs & Record<string, unknown>) | undefined,
  extra: Record<string, unknown> = {},
): string {
  const params = new URLSearchParams();
  params.set('page', String(args?.page ?? 1));
  params.set('limit', String(args?.perPage ?? 20));
  for (const [k, v] of Object.entries(extra)) {
    if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
  }
  return params.toString();
}
