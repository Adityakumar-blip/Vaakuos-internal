/**
 * Normalizes a list endpoint response to a plain array.
 *
 * Backend list endpoints are inconsistent: some return a bare array,
 * others wrap it as `{ data: [...] }` (often alongside pagination meta).
 * RTK Query's `providesTags` calls `result.map(...)`, which throws
 * "result.map is not a function" when the response is the wrapped object.
 *
 * Use as a query's `transformResponse` so `result` is always `T[]`.
 */
export const unwrapList = <T>(response: any): T[] =>
  Array.isArray(response) ? response : response?.data ?? [];
