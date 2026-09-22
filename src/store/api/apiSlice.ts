import { createApi, fetchBaseQuery, retry } from "@reduxjs/toolkit/query/react";
import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query";
import { RootState } from "../index";
import { logout as logoutAction, setCredentials, type User } from "../slices/authSlice";
import { openPaywall } from "../slices/paywallSlice";

/**
 * Base Query with Authentication
 * Automatically adds auth token to all requests except login and register
 */
const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_BASE_URL,
  // Bypass App Bridge's patched window.fetch, which stalls our bearer-authed
  // requests inside the Shopify admin iframe. See index.html.
  fetchFn: (...args) => (window.__nativeFetch ?? fetch)(...args),
  prepareHeaders: (headers, { getState }) => {
    // Get token from auth slice
    const token = (getState() as RootState).auth.token;

    // If we have a token, set it in the headers
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }

    // Set default content type
    if (!headers.has("content-type")) {
      headers.set("content-type", "application/json");
    }

    return headers;
  },
  credentials: "include", // Include cookies in requests
});

/**
 * Base Query with Retry Logic
 * Automatically retries failed requests with exponential backoff
 */
const baseQueryWithRetry = retry(baseQuery, { maxRetries: 3 });

// Embedded == running in an iframe (always true in Shopify admin, false
// standalone). Don't key off window.shopify: App Bridge defines it on the
// standalone app too, which would wrongly route boot 401s into idToken() and hang.
const isEmbedded = () =>
  typeof window !== "undefined" && window.top !== window.self;

// Embedded Shopify auth: cookies are unreliable in the admin iframe, so recover
// the app session from the App Bridge session token (shopify.idToken()) instead
// of the refresh cookie. Returns the new bearer, or null to fall back to logout.
async function mintEmbeddedSession(
  api: Parameters<typeof baseQuery>[1],
  extraOptions: Parameters<typeof baseQuery>[2],
): Promise<string | null> {
  // config.shop may be unpopulated on the first-tick boot 401 (App Bridge inits
  // async); the backend redirect always carries ?shop= so fall back to it.
  const shop =
    window.shopify?.config.shop ||
    new URLSearchParams(window.location.search).get("shop") ||
    undefined;
  if (!shop || !window.shopify?.idToken) return null;
  try {
    const idToken = await window.shopify.idToken();
    const res = await baseQuery(
      { url: "/shopify/session", method: "POST", body: { shop, idToken } },
      api,
      extraOptions,
    );
    if (res.data) {
      const data = res.data as { access_token: string; user: User };
      api.dispatch(setCredentials({ user: data.user, token: data.access_token }));
      return data.access_token;
    }
  } catch {
    /* fall through to logout */
  }
  return null;
}

/**
 * Base Query with Re-authentication
 * Handles token refresh when access token expires
 */
const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  // Run the request
  let result = await baseQuery(args, api, extraOptions);

  // 401 → recover the session
  if (result.error && result.error.status === 401) {
    const url = typeof args === "string" ? args : args.url;
    // Never recurse through the endpoints used to recover a session.
    if (url !== "/shopify/session" && url !== "/auth/refresh") {
      if (isEmbedded() && window.shopify?.idToken) {
        // Cookie-free: re-mint from the Shopify session token, then retry.
        const minted = await mintEmbeddedSession(api, extraOptions);
        if (minted) {
          result = await baseQuery(args, api, extraOptions);
        } else {
          // Store not linked yet → let ProtectedRoute route to the login/link page.
          api.dispatch(logoutAction());
        }
      } else {
        console.log("Token expired, attempting to refresh...");
        const refreshResult = await baseQuery(
          { url: "/auth/refresh", method: "POST" },
          api,
          extraOptions,
        );

        if (refreshResult.data) {
          const data = refreshResult.data as { access_token: string };
          const currentUser = (api.getState() as RootState).auth.user;

          if (currentUser) {
            api.dispatch(setCredentials({ user: currentUser, token: data.access_token }));
          }

          // Retry original request
          result = await baseQuery(args, api, extraOptions);
        } else {
          api.dispatch(logoutAction());
          // Only redirect if we're not already on the login page to prevent refresh loops
          if (window.location.pathname !== "/login") {
            window.location.href = "/login";
          }
        }
      }
    }
  }

  // 402 → entitlement limit reached / subscription required.
  // Surface the upgrade modal instead of a generic error toast. The backend
  // body shape is { message, feature, usage, limit, upgradeRequired: true }.
  if (result.error && result.error.status === 402) {
    const data = (result.error.data ?? {}) as {
      message?: string;
      feature?: string;
      usage?: number;
      limit?: number;
    };
    api.dispatch(
      openPaywall({
        feature: data.feature,
        message: data.message,
        usage: data.usage,
        limit: data.limit,
      }),
    );
  }

  return result;
};

/**
 * Main API Slice
 * This is the base API slice that all other API endpoints will extend
 *
 * Features:
 * - Automatic caching
 * - Request deduplication
 * - Polling support
 * - Optimistic updates
 * - Tag-based invalidation
 */
export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,

  // Tag types for cache invalidation
  tagTypes: [
    "User",
    "Auth",
    "Product",
    "Order",
    "Customer",
    "Contact",
    "Template",
    "Analytics",
    "Settings",
    "Integration",
    "Widget",
    "Flow",
    "Tag",
    "Campaign",
    "Conversation",
    "Message",
    "AbandonedCart",
    "Cart",
    "Dashboard",
    "Note",
    "Ticket",
    "Role",
    "Designation",
    "Masters",
    "AutoResponse",
    "Agency",
    "Brand",
    "Finance",
    "Blog",
    "BlogCategory",
    "Subscription",
    "Notification",
    "Log",
    "Coupon",
    "Offer",
    "ApiKey",
    "Waba",
    "LegalPage",
    "ContactQuery",
    "DemoBooking",
  ],

  // Endpoints will be injected in separate files
  endpoints: () => ({}),

  // Keep unused data in cache for 60 seconds
  keepUnusedDataFor: 60,

  // Refetch on mount or arg change
  refetchOnMountOrArgChange: 30,

  // Refetch on reconnect
  refetchOnReconnect: true,

  // Refetch on focus
  refetchOnFocus: false,
});

/**
 * Export hooks for usage in functional components
 * Add your hooks here once endpoints are defined
 */
// export const { } = apiSlice;
