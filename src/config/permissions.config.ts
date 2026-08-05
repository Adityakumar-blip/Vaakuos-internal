/**
 * Permission definitions and role-permission mappings
 */

// Permission constants
export const PERMISSIONS = {
  // Brand permissions
  BRAND_DASHBOARD_VIEW: 'brand:dashboard:view',
  BRAND_SETTINGS_VIEW: 'brand:settings:view',
  BRAND_SETTINGS_EDIT: 'brand:settings:edit',
//   BRAND_WHATSAPP_VIEW: 'brand:whatsapp:view',
//   BRAND_WHATSAPP_MANAGE: 'brand:whatsapp:manage',
//   BRAND_TEMPLATES_VIEW: 'brand:templates:view',
//   BRAND_TEMPLATES_REQUEST: 'brand:templates:request',
  BRAND_BILLING_VIEW: 'brand:billing:view',
  BRAND_BILLING_MANAGE: 'brand:billing:manage',
  USERS_VIEW: 'users:view',
  USERS_MANAGE: 'users:manage',
//   BRAND_COMPLIANCE_VIEW: 'brand:compliance:view',
//   BRAND_COMPLIANCE_EDIT: 'brand:compliance:edit',
//   BRAND_WEBHOOKS_VIEW: 'brand:webhooks:view',
//   BRAND_WEBHOOKS_MANAGE: 'brand:webhooks:manage',
  BRAND_NOTIFICATIONS_MANAGE: 'brand:notifications:manage',
//   BRAND_DANGER_ZONE: 'brand:danger:access',

  // Agency permissions
  AGENCY_DASHBOARD_VIEW: 'agency:dashboard:view',
  AGENCY_BRANDS_VIEW: 'agency:brands:view',
  AGENCY_BRANDS_CREATE: 'agency:brands:create',
  AGENCY_BRANDS_MANAGE: 'agency:brands:manage',
  AGENCY_BRANDS_DELETE: 'agency:brands:delete',
//   AGENCY_TEMPLATES_VIEW: 'agency:templates:view',
//   AGENCY_TEMPLATES_MANAGE: 'agency:templates:manage',
  AGENCY_REPORTS_VIEW: 'agency:reports:view',
  AGENCY_SETTINGS_VIEW: 'agency:settings:view',
  AGENCY_SETTINGS_EDIT: 'agency:settings:edit',
  AGENCY_WHITELABEL_MANAGE: 'agency:whitelabel:manage',


  AGENCY_BILLING_VIEW: 'agency:billing:view',
  AGENCY_BILLING_MANAGE: 'agency:billing:manage',
//   AGENCY_COMPLIANCE_MANAGE: 'agency:compliance:manage',
//   AGENCY_DANGER_ZONE: 'agency:danger:access',

  // Owner permissions
  OWNER_FULL_ACCESS: 'owner:*',
  OWNER_DASHBOARD_VIEW: 'owner:dashboard:view',


  OWNER_AGENCIES_VIEW: 'owner:agencies:view',
  OWNER_AGENCIES_MANAGE: 'owner:agencies:manage',
  OWNER_AGENCIES_SUSPEND: 'owner:agencies:suspend',
  OWNER_BRANDS_VIEW: 'owner:brands:view',
  OWNER_BRANDS_MANAGE: 'owner:brands:manage',
//   OWNER_TEMPLATES_MODERATE: 'owner:templates:moderate',
  OWNER_BILLING_VIEW: 'owner:billing:view',
  OWNER_BILLING_MANAGE: 'owner:billing:manage',
  OWNER_MONITORING_VIEW: 'owner:monitoring:view',
  OWNER_LOGS_VIEW: 'owner:logs:view',
  OWNER_FEATURES_MANAGE: 'owner:features:manage',
  OWNER_CONFIG_VIEW: 'owner:config:view',
  OWNER_CONFIG_EDIT: 'owner:config:edit',
  OWNER_EMERGENCY_CONTROLS: 'owner:emergency:access',
} as const;

// Type for permission values
export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// Role to permissions mapping
export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  // Brand roles
  'brand:admin': [
    PERMISSIONS.BRAND_DASHBOARD_VIEW,
    PERMISSIONS.BRAND_SETTINGS_VIEW,
    PERMISSIONS.BRAND_SETTINGS_EDIT,
//     PERMISSIONS.BRAND_WHATSAPP_VIEW,
//     PERMISSIONS.BRAND_WHATSAPP_MANAGE,
//     PERMISSIONS.BRAND_TEMPLATES_VIEW,
//     PERMISSIONS.BRAND_TEMPLATES_REQUEST,
    PERMISSIONS.BRAND_BILLING_VIEW,
    PERMISSIONS.BRAND_BILLING_MANAGE,
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.USERS_MANAGE,
//     PERMISSIONS.BRAND_COMPLIANCE_VIEW,
//     PERMISSIONS.BRAND_COMPLIANCE_EDIT,
//     PERMISSIONS.BRAND_WEBHOOKS_VIEW,
//     PERMISSIONS.BRAND_WEBHOOKS_MANAGE,
    PERMISSIONS.BRAND_NOTIFICATIONS_MANAGE,
//     PERMISSIONS.BRAND_DANGER_ZONE,
  ],
  'brand:marketer': [
    PERMISSIONS.BRAND_DASHBOARD_VIEW,
    PERMISSIONS.BRAND_SETTINGS_VIEW,
//     PERMISSIONS.BRAND_TEMPLATES_VIEW,
//     PERMISSIONS.BRAND_TEMPLATES_REQUEST,
    PERMISSIONS.BRAND_BILLING_VIEW,
  ],

  // Agency roles
  'agency:owner': [
    PERMISSIONS.AGENCY_DASHBOARD_VIEW,
    PERMISSIONS.AGENCY_BRANDS_VIEW,
    PERMISSIONS.AGENCY_BRANDS_CREATE,
    PERMISSIONS.AGENCY_BRANDS_MANAGE,
    PERMISSIONS.AGENCY_BRANDS_DELETE,
//     PERMISSIONS.AGENCY_TEMPLATES_VIEW,
//     PERMISSIONS.AGENCY_TEMPLATES_MANAGE,
    PERMISSIONS.AGENCY_REPORTS_VIEW,
    PERMISSIONS.AGENCY_SETTINGS_VIEW,
    PERMISSIONS.AGENCY_SETTINGS_EDIT,
    PERMISSIONS.AGENCY_WHITELABEL_MANAGE,
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.USERS_MANAGE,
    PERMISSIONS.AGENCY_BILLING_VIEW,
    PERMISSIONS.AGENCY_BILLING_MANAGE,
//     PERMISSIONS.AGENCY_COMPLIANCE_MANAGE,
//     PERMISSIONS.AGENCY_DANGER_ZONE,
  ],
  'agency:account_manager': [
    PERMISSIONS.AGENCY_DASHBOARD_VIEW,
    PERMISSIONS.AGENCY_BRANDS_VIEW,
    PERMISSIONS.AGENCY_BRANDS_MANAGE,
//     PERMISSIONS.AGENCY_TEMPLATES_VIEW,
    PERMISSIONS.AGENCY_REPORTS_VIEW,
    PERMISSIONS.AGENCY_SETTINGS_VIEW,
  ],

  // Owner roles
  'owner:super_admin': [
    PERMISSIONS.OWNER_FULL_ACCESS,
  ],
};

/**
 * Get permissions for a specific role
 */
export function getPermissionsForRole(adminType: string, role: string): Permission[] {
  const roleKey = `${adminType}:${role}`;
  return ROLE_PERMISSIONS[roleKey] || [];
}

/**
 * Check if a permission matches a wildcard pattern
 */
export function matchesPermission(userPermission: string, requiredPermission: string): boolean {
  // Exact match
  if (userPermission === requiredPermission) {
    return true;
  }

  // Wildcard match (e.g., 'owner:*' matches 'owner:anything')
  if (userPermission.endsWith(':*')) {
    const prefix = userPermission.slice(0, -1);
    return requiredPermission.startsWith(prefix);
  }

  return false;
}

/**
 * Check if user has a specific permission
 */
export function hasPermission(userPermissions: string[], requiredPermission: string): boolean {
  return userPermissions.some(perm => matchesPermission(perm, requiredPermission));
}

/**
 * Check if user has any of the required permissions
 */
export function hasAnyPermission(userPermissions: string[], requiredPermissions: string[]): boolean {
  return requiredPermissions.some(required => hasPermission(userPermissions, required));
}

/**
 * Check if user has all required permissions
 */
export function hasAllPermissions(userPermissions: string[], requiredPermissions: string[]): boolean {
  return requiredPermissions.every(required => hasPermission(userPermissions, required));
}
