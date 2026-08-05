import { useAuth } from '@/context/AuthContext';
import { AdminType } from '@/types/admin.types';

/**
 * Hook for admin type utilities
 */
export function useAdminType() {
  const { user } = useAuth();

  const isBrandAdmin = user?.adminType === 'brand';
  const isAgencyAdmin = user?.adminType === 'agency';
  const isOwnerAdmin = user?.adminType === 'owner';

  const getAdminTypeLabel = (): string => {
    if (!user) return '';

    switch (user.adminType) {
      case 'brand':
        return 'Brand Admin';
      case 'agency':
        return 'Agency Admin';
      case 'owner':
        return 'Super Admin';
      default:
        return '';
    }
  };

  const canSwitchContext = (): boolean => {
    return isAgencyAdmin || isOwnerAdmin;
  };

  return {
    adminType: user?.adminType,
    isBrandAdmin,
    isAgencyAdmin,
    isOwnerAdmin,
    getAdminTypeLabel,
    canSwitchContext,
  };
}
