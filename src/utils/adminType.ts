import { AdminType } from '@/types/admin.types';
import { Permission } from '@/types/permissions.enum';

/**
 * Derives the AdminType from a user's tenantType.
 *   business / brand  → 'brand'
 *   agency            → 'agency'
 *   internal / owner  → 'owner'  (explicit signal only)
 *
 * SECURITY: 'owner' is the platform super-admin tier and is granted ONLY on an
 * explicit signal (adminType === 'owner' or tenantType internal/owner). Unknown
 * or missing data fails closed to the least-privileged tier ('brand') — it must
 * never default to owner. Callers additionally gate on the matching view
 * permission (getAdminViewPermission), so a 'brand' fallback grants nothing on
 * its own.
 */
export function deriveAdminType(
  adminType?: AdminType | string,
  tenantType?: string
): AdminType {
  // If adminType is already set and valid, use it
  if (adminType && ['brand', 'agency', 'owner'].includes(adminType as string)) {
    return adminType as AdminType;
  }

  // Derive from tenantType
  if (tenantType === 'business' || tenantType === 'brand') return 'brand';
  if (tenantType === 'agency') return 'agency';
  if (tenantType === 'internal' || tenantType === 'owner') return 'owner';

  // Fail closed: unknown/missing signals get the least-privileged tier, never owner.
  return 'brand';
}

/**
 * Internal (platform provider) accounts live entirely in the admin console —
 * they have no brand workspace, so workspace chrome must not render for them.
 */
export function isInternalAdmin(
  adminType?: AdminType | string,
  tenantType?: string
): boolean {
  return deriveAdminType(adminType, tenantType) === 'owner';
}




export function getAdminTypeLabel(adminType: AdminType): string {
  switch (adminType) {
    case 'brand':
      return 'Brand Admin';
    case 'agency':
      return 'Agency Admin';
    case 'owner':
      return 'Super Admin';
    default:
      return 'Admin';
  }
}

export function getAdminViewPermission(adminType: AdminType): Permission {
  switch (adminType) {
    case 'brand':
      return Permission.BRAND_DASHBOARD_READ;
    case 'agency':
      return Permission.AGENCY_DASHBOARD_READ;
    case 'owner':
      return Permission.OWNER_DASHBOARD_READ;
    default:
      return Permission.OWNER_DASHBOARD_READ;
  }
}
