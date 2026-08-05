import { useAppSelector } from '@/store/hooks';
import { selectCurrentUser } from '@/store/slices/authSlice';
import { Permission, hasPermission, hasAnyPermission, hasAllPermissions } from '@/lib/permissions';

export const usePermission = () => {
  const user = useAppSelector(selectCurrentUser);
  const userPermissions = user?.permissions || [];

  const checkPermission = (permission: Permission | string) => {
    return hasPermission(userPermissions, permission);
  };

  const checkAnyPermission = (permissions: (Permission | string)[]) => {
    return hasAnyPermission(userPermissions, permissions);
  };

  const checkAllPermissions = (permissions: (Permission | string)[]) => {
    return hasAllPermissions(userPermissions, permissions);
  };

  return {
    permissions: userPermissions,
    hasPermission: checkPermission,
    hasAnyPermission: checkAnyPermission,
    hasAllPermissions: checkAllPermissions,
    isAdmin: user?.roles.includes('admin') || user?.roles.includes('owner'),
  };
};
