export interface PermissionModule {
  label: string;
  module: string;
  actions?: string[];
  children?: {
    label: string;
    module: string;
    actions: string[];
  }[];
}

export const OWNER_PERMISSIONS: PermissionModule[] = [
  {
    label: "Dashboard",
    module: "dashboard",
    actions: ["view"]
  },
  {
    label: "Team",
    module: "team",
    children: [
      { label: "Users", module: "users", actions: ["view", "create", "edit", "delete"] },
      { label: "Roles", module: "roles", actions: ["view", "create", "edit", "delete"] }
    ]
  },
  {
    label: "Agencies",
    module: "agencies",
    actions: ["view", "create", "edit", "delete", "login_as"]
  },
  {
    label: "Brands",
    module: "brands",
    actions: ["view", "create", "edit", "delete", "login_as"]
  },
  {
    label: "Subscription",
    module: "subscription",
    children: [
      { label: "Plans", module: "plans", actions: ["view", "create", "edit", "delete"] },
      { label: "Addons", module: "addons", actions: ["view", "create", "edit", "delete"] }
    ]
  },
  {
    label: "Master Data",
    module: "master",
    children: [
      { label: "FAQ Categories", module: "faq-categories", actions: ["view", "create", "edit", "delete"] },
      { label: "Integrations", module: "integrations", actions: ["view", "create", "edit", "delete"] },
      { label: "Plan Features", module: "plan-features", actions: ["view", "create", "edit", "delete"] }
    ]
  },
  {
    label: "Billing",
    module: "billing",
    actions: ["view", "edit"]
  },
  {
    label: "Coupons",
    module: "coupons",
    actions: ["view", "create", "edit", "delete"]
  },
  {
    label: "Monitoring",
    module: "monitoring",
    actions: ["view"]
  },
  {
    label: "Logs",
    module: "logs",
    actions: ["view"]
  },
  {
    label: "Configuration",
    module: "config",
    actions: ["view", "edit"]
  }
];
