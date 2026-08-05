import { createSlice, PayloadAction } from '@reduxjs/toolkit';

/**
 * Paywall slice
 *
 * Backend entitlement enforcement responds with HTTP 402 (Payment Required) and
 * a body of `{ message, feature, usage, limit, upgradeRequired: true }` when a
 * tenant hits a plan limit or lacks an active subscription. The API base query
 * detects that status and dispatches `openPaywall`, which surfaces the upgrade
 * (pricing) modal instead of a generic error toast.
 */
export interface PaywallInfo {
  feature?: string;
  message?: string;
  usage?: number;
  limit?: number;
}

interface PaywallState {
  open: boolean;
  info: PaywallInfo | null;
}

const initialState: PaywallState = {
  open: false,
  info: null,
};

const paywallSlice = createSlice({
  name: 'paywall',
  initialState,
  reducers: {
    openPaywall: (state, action: PayloadAction<PaywallInfo | undefined>) => {
      state.open = true;
      state.info = action.payload ?? null;
    },
    closePaywall: (state) => {
      state.open = false;
      state.info = null;
    },
  },
});

export const { openPaywall, closePaywall } = paywallSlice.actions;
export default paywallSlice.reducer;

export const selectPaywall = (state: { paywall: PaywallState }) => state.paywall;
