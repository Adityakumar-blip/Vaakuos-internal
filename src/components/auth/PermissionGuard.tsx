import React from 'react';
import { usePermission } from '@/hooks/usePermission';
import { Permission } from '@/lib/permissions';

interface PermissionGuardProps {
  permission?: Permission | string;
  permissions?: (Permission | string)[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  permission,
  permissions,
  requireAll = false,
  fallback = null,
  children,
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermission();

  let isAllowed = false;

  if (permission) {
    isAllowed = hasPermission(permission);
  } else if (permissions) {
    if (requireAll) {
      isAllowed = hasAllPermissions(permissions);
    } else {
      isAllowed = hasAnyPermission(permissions);
    }
  } else {
    // If no permission is required, allowed by default
    isAllowed = true;
  }

  if (!isAllowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
