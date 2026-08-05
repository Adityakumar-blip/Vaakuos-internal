/**
 * API Key Scope Catalog — "feature control" for programmatic access.
 *
 * Each API key carries a list of scope strings (stored on the backend
 * `api_tokens.scopes` array). A scope grants a key access to a specific
 * platform capability over the public API. Grouping here drives the
 * scope-selection UI on the API key create page and the human-readable
 * labels shown in the key list.
 *
 * Scope strings follow the platform `resource:action` convention so they
 * line up with the permission model in `src/lib/permissions.ts`.
 */

export interface ApiScope {
  /** The raw scope string persisted on the key (e.g. "contacts:read"). */
  value: string;
  /** Short human label shown in checkboxes and badges. */
  label: string;
  /** One-line explanation of what the scope unlocks. */
  description: string;
}

export interface ApiScopeGroup {
  /** Stable id for the feature group. */
  id: string;
  /** Group heading shown in the create form. */
  name: string;
  /** What this feature area covers. */
  description: string;
  scopes: ApiScope[];
}

export const API_SCOPE_GROUPS: ApiScopeGroup[] = [
  {
    id: "contacts",
    name: "Contacts",
    description: "Read and manage contact records and their properties.",
    scopes: [
      { value: "contacts:read", label: "Read contacts", description: "List and view contacts." },
      { value: "contacts:write", label: "Write contacts", description: "Create, update and delete contacts." },
    ],
  },
  {
    id: "campaigns",
    name: "Campaigns",
    description: "Manage and trigger marketing campaigns.",
    scopes: [
      { value: "campaigns:read", label: "Read campaigns", description: "List and view campaigns." },
      { value: "campaigns:write", label: "Write campaigns", description: "Create and update campaigns." },
      { value: "campaigns:execute", label: "Execute campaigns", description: "Send and schedule campaigns." },
    ],
  },
  {
    id: "templates",
    name: "Templates",
    description: "Access WhatsApp message templates.",
    scopes: [
      { value: "templates:read", label: "Read templates", description: "List and view templates." },
      { value: "templates:write", label: "Write templates", description: "Create and update templates." },
    ],
  },
  {
    id: "messages",
    name: "Messaging",
    description: "Send messages and read inbox conversations.",
    scopes: [
      { value: "messages:read", label: "Read messages", description: "Read conversations and messages." },
      { value: "messages:send", label: "Send messages", description: "Send outbound messages." },
    ],
  },
  {
    id: "automation",
    name: "Automation",
    description: "Read and control automation flows.",
    scopes: [
      { value: "flows:read", label: "Read flows", description: "List and view automation flows." },
      { value: "flows:write", label: "Write flows", description: "Create, update and toggle flows." },
    ],
  },
  {
    id: "ecommerce",
    name: "E-commerce",
    description: "Access carts, orders and abandoned-cart data.",
    scopes: [
      { value: "ecommerce:read", label: "Read commerce", description: "Read carts, orders and products." },
      { value: "ecommerce:write", label: "Write commerce", description: "Recover carts and manage orders." },
    ],
  },
  {
    id: "events",
    name: "Events & Webhooks",
    description: "Push events into the platform and receive callbacks.",
    scopes: [
      { value: "events:read", label: "Read events", description: "Read delivered event payloads." },
      { value: "events:write", label: "Write events", description: "Emit events into the platform." },
    ],
  },
  {
    id: "analytics",
    name: "Analytics",
    description: "Read reporting and dashboard metrics.",
    scopes: [
      { value: "analytics:read", label: "Read analytics", description: "Read metrics and reports." },
    ],
  },
];

/**
 * Recommended default scopes for e-commerce store-connector plugins
 * (WooCommerce, Shopify, etc.). Such a plugin pushes cart/order events into the
 * platform (`events:write` → the `/events` ingest endpoint) and drives cart
 * recovery / order sync (`ecommerce:read` + `ecommerce:write`). Pre-selected on
 * the create-key form so store owners get a working key without guessing.
 */
export const DEFAULT_PLUGIN_SCOPES: string[] = [
  "ecommerce:read",
  "ecommerce:write",
  "events:write",
];

/** Flat list of every selectable scope value. */
export const ALL_API_SCOPES: ApiScope[] = API_SCOPE_GROUPS.flatMap((group) => group.scopes);

/** Quick lookup from scope value → its definition. */
const SCOPE_BY_VALUE: Record<string, ApiScope> = ALL_API_SCOPES.reduce(
  (acc, scope) => {
    acc[scope.value] = scope;
    return acc;
  },
  {} as Record<string, ApiScope>,
);

/** Resolve a scope value to its human label, falling back to the raw value. */
export const getScopeLabel = (value: string): string => SCOPE_BY_VALUE[value]?.label ?? value;
