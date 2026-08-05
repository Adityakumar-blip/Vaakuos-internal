import { PermissionModule } from './ownerPermissions';

export const BRAND_PERMISSIONS: PermissionModule[] = [
  {
    label: "Dashboard",
    module: "dashboard",
    actions: ["read"]
  },
  {
    label: "Team",
    module: "team",
    children: [
      { label: "Users", module: "users", actions: ["read", "invite", "update", "delete"] },
      { label: "Roles", module: "roles", actions: ["read", "invite", "update", "delete"] }
    ]
  },
  {
    label: "WhatsApp",
    module: "whatsapp",
    actions: ["read", "update", "manage"]
  },
  {
    label: "Billing",
    module: "billing",
    actions: ["read", "manage"]
  },
  {
    label: "Webhooks",
    module: "webhooks",
    actions: ["read", "create", "update", "delete"]
  },
  {
    label: "Settings",
    module: "settings",
    actions: ["read", "update", "danger_zone_manage"]
  },
  // Common modules
  {
    label: "Contacts",
    module: "contacts",
    actions: ["read", "create", "update", "delete"]
  },
  {
    label: "Campaigns",
    module: "campaigns",
    actions: ["read", "create", "update", "delete", "execute"]
  },
  {
    label: "Templates",
    module: "templates",
    actions: ["read", "create", "update", "delete", "approve"]
  },
  {
    label: "Inbox",
    module: "inbox",
    actions: ["read", "reply", "manage"]
  },
  {
    label: "Automation",
    module: "automation",
    actions: ["read", "create", "update", "delete"]
  },
  {
    label: "Integrations",
    module: "integrations",
    actions: ["read", "manage"]
  },
  {
    label: "Auto Responses",
    module: "auto_response",
    actions: ["read", "manage"]
  },
  {
    label: "E-commerce",
    module: "ecommerce",
    actions: ["read", "manage"]
  }
];
