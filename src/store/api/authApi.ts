import { apiSlice } from "./apiSlice";
import type { WabaAccount } from "./wabaApi";
import {
  setCredentials,
  logout as logoutAction,
  setUser as setAuthUser,
} from "../slices/authSlice";

interface User {
  id: string;
  name: string;
  email: string;
  companyName?: string;
  tenantId?: string;
  tenantType?: "agency" | "business";
  type?: "agency" | "business";
  adminType: "brand" | "agency" | "owner";
  role: "admin" | "marketer" | "owner" | "account_manager" | "super_admin";
  roles: string[];
  permissions: string[];
  subscription?: {
    id: string;
    status: string;
    plans: {
      id: string;
      name: string;
      features: Record<string, unknown>;
    };
  };
  phone?: string;
  avatarUrl?: string | null;
  website?: string;
  companySize?: string;
  metadata?: Record<string, any>;
  onboarding_completed?: boolean;
  // Tenant's WhatsApp Business Account, folded in from the backend.
  // null/undefined means no WABA (Facebook/WhatsApp) connection.
  waba?: WabaAccount | null;
}

export interface UserPreferences {
  theme: "light" | "dark";
  palette: string;
  direction: "ltr" | "rtl";
  showHelpGuide?: boolean;
}

interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface LoginResponse {
  user: User;
  access_token: string;
  refreshToken?: string;
}

interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  companyName: string;
  type: "agency" | "business";
}

interface RegisterResponse {
  user: User;
  access_token: string;
  refreshToken?: string;
}

/**
 * Auth API Endpoints
 * Extends the base API slice with authentication-specific endpoints
 *
 * Usage:
 * const { data, isLoading, error } = useLoginMutation();
 */
export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Login endpoint
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
      }),
      invalidatesTags: ["Auth", "User"],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          // Dispatch token and user data
          dispatch(
            setCredentials({
              user: data.user,
              token: data.access_token,
              rememberMe: arg.rememberMe,
            }),
          );
        } catch (error) {
          console.error("Login failed:", error);
        }
      },
    }),

    // Register endpoint
    register: builder.mutation<RegisterResponse, RegisterRequest>({
      query: (userData) => ({
        url: "/auth/register",
        method: "POST",
        body: userData,
      }),
      invalidatesTags: ["Auth", "User"],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          // Dispatch token and user data
          dispatch(
            setCredentials({ user: data.user, token: data.access_token }),
          );
          // Mark that user needs onboarding
          localStorage.setItem("needsOnboarding", "true");
        } catch (error) {
          console.error("Registration failed:", error);
        }
      },
    }),

    // Logout endpoint
    logout: builder.mutation<void, void>({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
      // Removed invalidatesTags: ['Auth', 'User'] because it triggers an immediate
      // refetch of /auth/me while the token might still be valid in Redux/Headers,
      // leading to automatic re-authentication.
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        // Clear local state immediately to prevent subsequent requests from using the old token
        dispatch(logoutAction());
        // Reset API state to clear all cached data, including the 'getCurrentUser' result
        dispatch(apiSlice.util.resetApiState());

        try {
          await queryFulfilled;
        } catch (err) {
          console.error("Logout failed:", err);
        }
      },
    }),

    // Get current user
    getCurrentUser: builder.query<User, void>({
      query: () => "/auth/me",
      // Also provides the Waba tag so syncWaba (and other WABA mutations)
      // invalidating { type: 'Waba', id: 'ME' } refetches this single endpoint.
      providesTags: ["User", { type: "Waba", id: "ME" }],
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(setAuthUser(data));
        } catch (err) {
          console.error("Get user failed:", err);
          dispatch(logoutAction());
        }
      },
    }),

    // Refresh token
    refreshToken: builder.mutation<{ access_token: string }, void>({
      query: () => ({
        url: "/auth/refresh",
        method: "POST",
      }),
    }),

    // Update user profile
    updateProfile: builder.mutation<User, Partial<User>>({
      query: (updates) => ({
        url: "/auth/profile",
        method: "PATCH",
        body: updates,
      }),
      invalidatesTags: ["User"],
    }),

    // Self-service profile update (name / phone / avatar)
    updateMe: builder.mutation<
      User,
      { name?: string; phone?: string; avatarUrl?: string }
    >({
      query: (updates) => ({
        url: "/auth/me",
        method: "PATCH",
        body: updates,
      }),
      invalidatesTags: ["User"],
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(setAuthUser(data));
        } catch {
          /* error surfaced to caller via unwrap() */
        }
      },
    }),

    // Change password (backend route is /auth/update-password)
    changePassword: builder.mutation<
      void,
      { currentPassword: string; newPassword: string }
    >({
      query: (passwords) => ({
        url: "/auth/update-password",
        method: "POST",
        body: passwords,
      }),
      // Refetch /auth/me so a cleared force_password_change lets the user through.
      invalidatesTags: ["User"],
    }),

    // Exchange Facebook token
    exchangeFacebookToken: builder.mutation<
      { success: boolean; message?: string },
      { code: string; redirectUri: string }
    >({
      query: (data) => ({
        url: "/auth/whatsapp/complete-signup",
        method: "POST",
        body: { code: data.code, redirectUri: data.redirectUri },
      }),
      invalidatesTags: ["Auth"],
    }),

    // Get WABA onboarding URL
    getWabaOnboardingUrl: builder.query<{ url: string }, void>({
      query: () => "/waba/onboarding-url",
    }),

    // Google login endpoint
    googleLogin: builder.mutation<LoginResponse, { token: string }>({
      query: (data) => ({
        url: "/auth/google",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Auth", "User"],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(
            setCredentials({ user: data.user, token: data.access_token }),
          );
        } catch (error) {
          console.error("Google login failed:", error);
        }
      },
    }),

    // WABA onboarding callback - send code and state after OAuth redirect
    wabaOnboardingCallback: builder.mutation<
      { success: boolean; message?: string },
      { code: string; state: string }
    >({
      query: (data) => ({
        url: "/waba/onboarding/callback",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Auth"],
    }),

    // Forgot password
    forgotPassword: builder.mutation<{ message: string }, { email: string }>({
      query: (data) => ({
        url: "/auth/forgot-password",
        method: "POST",
        body: data,
      }),
    }),

    // Reset password
    resetPassword: builder.mutation<
      { message: string },
      { token: string; newPassword: string }
    >({
      query: (data) => ({
        url: "/auth/reset-password",
        method: "POST",
        body: data,
      }),
    }),

    // Exchange token
    exchangeToken: builder.mutation<LoginResponse, { token: string }>({
      query: (data) => ({
        url: "/auth/exchange",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Auth", "User"],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(
            setCredentials({ user: data.user, token: data.access_token }),
          );
        } catch (error) {
          console.error("Exchange token failed:", error);
        }
      },
    }),
    // Get user preferences
    getPreferences: builder.query<UserPreferences, void>({
      query: () => "/auth/preferences",
      providesTags: ["User"],
    }),

    // Update user preferences
    updatePreferences: builder.mutation<
      UserPreferences,
      Partial<UserPreferences>
    >({
      query: (preferences) => ({
        url: "/auth/preferences",
        method: "PATCH",
        body: preferences,
      }),
      // Removed invalidatesTags: ['User'] to prevent redundant /auth/me refetching.
      // We use onQueryStarted for optimistic local cache updates instead.
      async onQueryStarted(preferences, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          authApi.util.updateQueryData("getPreferences", undefined, (draft) => {
            Object.assign(draft, preferences);
          }),
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),
  }),
});

/**
 * Export hooks for usage in functional components
 * These are auto-generated based on defined endpoints
 */
export const {
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useGetCurrentUserQuery,
  useRefreshTokenMutation,
  useUpdateProfileMutation,
  useUpdateMeMutation,
  useChangePasswordMutation,
  useGoogleLoginMutation,
  useExchangeFacebookTokenMutation,
  useLazyGetWabaOnboardingUrlQuery,
  useWabaOnboardingCallbackMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useExchangeTokenMutation,
  useGetPreferencesQuery,
  useUpdatePreferencesMutation,
} = authApi;
