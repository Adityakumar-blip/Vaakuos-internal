import { apiSlice } from './apiSlice';

/**
 * A phone number connected under a WABA account.
 */
export interface WabaPhoneNumber {
  id: string;
  phone_number: string;
  display_name?: string | null;
  status?: string | null;
  metadata?: Record<string, unknown> | null;
}

/**
 * WhatsApp Business Account for the current tenant.
 * Mirrors the backend `waba_accounts` model (returned inline on GET /auth/me).
 */
export interface WabaAccount {
  id: string;
  tenant_id: string;
  waba_id: string;
  display_name?: string | null;
  verified: boolean;
  status?: string | null;
  /** Token health computed server-side: 'expired' means reconnect via Embedded Signup. */
  token_status?: 'ok' | 'expired' | 'missing' | null;
  credentials?: Record<string, unknown> | null;
  phone_numbers?: WabaPhoneNumber[];
  created_at?: string;
  updated_at?: string;
}

/**
 * WABA API — POST /waba/sync.
 *
 * The tenant's WABA account is no longer fetched here: it is returned inline on
 * GET /auth/me (see `User.waba` in authApi). getCurrentUser provides the
 * { type: 'Waba', id: 'ME' } tag, so the sync mutation below still refetches it.
 * (The onboarding-url query lives in authApi as getWabaOnboardingUrl.)
 */
export const wabaApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Sync templates and phone numbers from Facebook.
     * POST /waba/sync
     */
    syncWaba: builder.mutation<unknown, void>({
      query: () => ({
        url: '/waba/sync',
        method: 'POST',
      }),
      invalidatesTags: [{ type: 'Waba', id: 'ME' }, { type: 'Template', id: 'LIST' }],
    }),
  }),
});

export const {
  useSyncWabaMutation,
} = wabaApi;
