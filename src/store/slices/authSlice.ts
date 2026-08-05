import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AdminType, AdminRole, AdminUser } from '../../types/admin.types';

export interface User extends AdminUser {
  companyName?: string;
  tenantId?: string;
  tenantType?: 'agency' | 'business';
  type?: 'agency' | 'business';
  roles: string[]; // Keep for backward compatibility if needed
  subscription?: {
    id: string;
    // Mirrors the backend subscription status enum (see instacal-backend
    // subscriptions schema): trialing | created | authenticated | active |
    // pending | halted | cancelled | completed | expired.
    status:
      | 'trialing'
      | 'created'
      | 'authenticated'
      | 'active'
      | 'pending'
      | 'halted'
      | 'cancelled'
      | 'completed'
      | 'expired';
    plan_id: string;
    trial_ends_at: string | null;
    current_period_end: string | null;
    plans: {
      id: string;
      name: string;
      features: Record<string, any>;
    };
    metadata?: Record<string, any>;
  };
  companySize?: string;
  website?: string;
  metadata?: Record<string, any>;
  onboarding_completed?: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Auth is cookie-based (httpOnly access_token). We no longer persist the JWT
// or the user object in web storage — both are XSS-readable. On boot,
// AuthProvider's getCurrentUser (/auth/me) rehydrates the user from the cookie,
// and ProtectedRoute shows a loader during that check.
//
// Exception: inside the Shopify admin iframe the access_token is a third-party
// cookie that Safari ITP / Chrome block, so it can't persist the session across
// the iframe reloads Shopify triggers on navigation. Only there do we keep the
// JWT in sessionStorage (partitioned to this iframe) and rehydrate it — the
// backend accepts it as `Authorization: Bearer` (jwt.strategy). Normal web is
// untouched and never writes a token to web storage.
// Embedded == running in an iframe. This is synchronously true from the first
// tick (unlike window.shopify, which App Bridge sets only after an async
// handshake — too late for store init on the reload Shopify triggers). It's also
// false on the standalone app, so we never persist a bearer to storage there.
const EMBEDDED = typeof window !== 'undefined' && window.top !== window.self;
const EMBEDDED_TOKEN_KEY = 'sh_access_token';

// Storage access throws a SecurityError in a third-party iframe when the browser
// blocks it (Safari always; Chrome under some settings). Never let that crash
// store init or a reducer.
const readEmbeddedToken = (): string | null => {
  if (!EMBEDDED) return null;
  try {
    return sessionStorage.getItem(EMBEDDED_TOKEN_KEY);
  } catch {
    return null;
  }
};
const writeEmbeddedToken = (token: string): void => {
  if (!EMBEDDED) return;
  try {
    sessionStorage.setItem(EMBEDDED_TOKEN_KEY, token);
  } catch {
    /* storage blocked in this iframe — Bearer survives only until reload */
  }
};
const clearEmbeddedToken = (): void => {
  try {
    sessionStorage.removeItem(EMBEDDED_TOKEN_KEY);
  } catch {
    /* ignore */
  }
};

const initialState: AuthState = {
  user: null,
  token: readEmbeddedToken(),
  isAuthenticated: false,
  isLoading: false,
};

/**
 * Auth Slice
 * Manages authentication state in Redux
 */
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; token?: string; rememberMe?: boolean }>
    ) => {
      // In-memory only. The JWT lives in the httpOnly cookie; session
      // persistence (incl. "remember me") is governed by the cookie's maxAge,
      // set server-side at login. Nothing is written to web storage.
      state.user = action.payload.user;
      state.token = action.payload.token || null;
      state.isAuthenticated = true;
      if (action.payload.token) {
        writeEmbeddedToken(action.payload.token);
      }
    },

    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },

    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('token');
      clearEmbeddedToken();
    },

    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

export const { setCredentials, setUser, logout, setLoading } = authSlice.actions;

export default authSlice.reducer;

// Selectors
export const selectCurrentUser = (state: any) => state.auth.user as User | null;
export const selectIsAuthenticated = (state: any) => state.auth.isAuthenticated as boolean;
export const selectAuthToken = (state: any) => state.auth.token as string | null;
export const selectAuthLoading = (state: any) => state.auth.isLoading as boolean;
