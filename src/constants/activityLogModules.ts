/**
 * Backend derives `module` on every activity-log row from the first path segment
 * of the write request (see instacal-backend ActivityLogInterceptor.deriveModule),
 * and filters on it with an exact match — so a free-text field silently returns
 * nothing unless typed exactly right. Values here mirror the backend's top-level
 * route prefixes (instacal-backend/src/modules/**\/*.controller.ts @Controller paths).
 */
const ACRONYMS: Record<string, string> = {
  ai: "AI",
  api: "API",
  waba: "WABA",
};

function humanize(slug: string): string {
  return slug
    .split("-")
    .map((word) => ACRONYMS[word] ?? word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

const MODULE_SLUGS = [
  "admin",
  "agencies",
  "ai",
  "api-tokens",
  "auth",
  "automation",
  "auto-responses",
  "blogs",
  "blog-topics",
  "brands",
  "campaigns",
  "contacts",
  "coupons",
  "custom-fields",
  "dashboard",
  "demo-bookings",
  "ecommerce",
  "email-templates",
  "events",
  "finance",
  "google-sheets",
  "inbox",
  "integration-requests",
  "integrations",
  "media",
  "notifications",
  "offers",
  "phone-numbers",
  "plan-features",
  "plugin",
  "public",
  "realtime",
  "roles",
  "schedules",
  "shopify",
  "subscriptions",
  "tags",
  "templates",
  "tenants",
  "tickets",
  "users",
  "waba",
] as const;

export const ACTIVITY_LOG_MODULES = MODULE_SLUGS.map((value) => ({
  value,
  label: humanize(value),
}));
