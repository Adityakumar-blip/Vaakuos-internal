export enum Permission {
  // Contacts
  CONTACTS_READ = 'contacts:read',
  CONTACTS_CREATE = 'contacts:create',
  CONTACTS_UPDATE = 'contacts:update',
  CONTACTS_DELETE = 'contacts:delete',

  // Campaigns
  CAMPAIGNS_READ = 'campaigns:read',
  CAMPAIGNS_CREATE = 'campaigns:create',
  CAMPAIGNS_UPDATE = 'campaigns:update',
  CAMPAIGNS_DELETE = 'campaigns:delete',
  CAMPAIGNS_EXECUTE = 'campaigns:execute',

  // Templates
  TEMPLATES_READ = 'templates:read',
  TEMPLATES_CREATE = 'templates:create',
  TEMPLATES_UPDATE = 'templates:update',
  TEMPLATES_DELETE = 'templates:delete',

  // Inbox/Messaging
  INBOX_READ = 'inbox:read',
  INBOX_REPLY = 'inbox:reply',
  INBOX_MANAGE = 'inbox:manage',

  // Automation/Flows
  AUTOMATION_READ = 'automation:read',
  AUTOMATION_CREATE = 'automation:create',
  AUTOMATION_UPDATE = 'automation:update',
  AUTOMATION_DELETE = 'automation:delete',

  // Integrations
  INTEGRATIONS_READ = 'integrations:read',
  INTEGRATIONS_MANAGE = 'integrations:manage',

  // Settings/Tenant
  TENANT_READ = 'tenant:read',
  TENANT_UPDATE = 'tenant:update',
  SETTINGS_MANAGE = 'settings:manage',

  // Users & Roles
  USERS_READ = 'users:read',
  USERS_CREATE = 'users:create',
  USERS_UPDATE = 'users:update',
  USERS_DELETE = 'users:delete',
  USERS_MANAGE = 'users:manage',
  ROLES_READ = 'roles:read',
  ROLES_CREATE = 'roles:create',
  ROLES_UPDATE = 'roles:update',
  ROLES_DELETE = 'roles:delete',
  ROLES_MANAGE = 'roles:manage',

  // Coupons
  COUPONS_READ = 'coupons:read',
  COUPONS_CREATE = 'coupons:create',
  COUPONS_UPDATE = 'coupons:update',
  COUPONS_DELETE = 'coupons:delete',

  // Offers
  OFFERS_READ = 'offers:read',
  OFFERS_CREATE = 'offers:create',
  OFFERS_UPDATE = 'offers:update',
  OFFERS_DELETE = 'offers:delete',

  // API Keys
  API_KEYS_READ = 'api_keys:read',
  API_KEYS_CREATE = 'api_keys:create',
  API_KEYS_DELETE = 'api_keys:delete',

  // Audit Trail / Error Logs
  AUDIT_LOGS_READ = 'audit_logs:read',
  AUDIT_LOGS_MANAGE = 'audit_logs:manage',
}

export type PermissionType = Permission | string;

export const hasPermission = (userPermissions: string[], requiredPermission: PermissionType): boolean => {
  if (userPermissions.includes(requiredPermission)) {
    return true;
  }

  const [requiredModule] = String(requiredPermission).split(':');

  return userPermissions.some((permission) => {
    if (permission.endsWith(':*')) {
      const prefix = permission.slice(0, -1);
      return String(requiredPermission).startsWith(prefix);
    }

    if (!permission.endsWith(':manage')) {
      return false;
    }

    const [permissionModule] = permission.split(':');
    return permissionModule === requiredModule;
  });
};

export const hasAnyPermission = (userPermissions: string[], requiredPermissions: PermissionType[]): boolean => {
  return requiredPermissions.some(perm => hasPermission(userPermissions, perm));
};

export const hasAllPermissions = (userPermissions: string[], requiredPermissions: PermissionType[]): boolean => {
  return requiredPermissions.every(perm => hasPermission(userPermissions, perm));
};
