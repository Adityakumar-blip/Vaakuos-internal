import {
  useGetEntitlementsQuery,
  type Entitlements,
} from '@/store/api/subscriptionApi';

/** Sentinel value (matches backend `UNLIMITED`) meaning "no limit". */
export const UNLIMITED = -1;

/**
 * Free-tier / expired-trial defaults. Mirrors `DEFAULT_ENTITLEMENTS` in the
 * backend so the UI degrades to the same gated baseline while the request is in
 * flight or if it fails — never a hard lock, just the free limits.
 */
export const DEFAULT_ENTITLEMENTS: Entitlements = {
  max_agents: 1,
  max_contacts: 100,
  monthly_messages: 500,
  monthly_ai_replies: 0,
  markup_per_message: 0.5,
  broadcast_enabled: false,
  api_access: false,
  priority_support: false,
};

/**
 * Reads the tenant's effective entitlements from the backend and exposes typed
 * helpers for gating UI. Use this to disable/hide premium features and show
 * usage limits, instead of inferring access from a binary expired flag.
 *
 * The backend still enforces every limit (HTTP 402); these helpers only drive
 * the UX so users see a graceful "usable but gated" experience.
 */
export const useEntitlements = () => {
  const { data, isLoading, isError, refetch } = useGetEntitlementsQuery();

  const entitlements: Entitlements = { ...DEFAULT_ENTITLEMENTS, ...(data ?? {}) };

  /** Boolean capability flags, e.g. `can('broadcast_enabled')`. */
  const can = (feature: keyof Entitlements | string): boolean =>
    entitlements[feature] === true;

  /** Numeric ceiling for a feature, e.g. `limitOf('max_contacts')`. */
  const limitOf = (feature: keyof Entitlements | string): number =>
    Number(entitlements[feature] ?? 0);

  /** Whether a numeric feature is unlimited (-1). */
  const isUnlimited = (feature: keyof Entitlements | string): boolean =>
    entitlements[feature] === UNLIMITED;

  return {
    entitlements,
    isLoading,
    isError,
    refetch,
    can,
    limitOf,
    isUnlimited,
  };
};
