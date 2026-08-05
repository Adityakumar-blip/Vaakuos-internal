import type { PermissionModule } from '@/store/api/roleApi';
import type { AdminType } from '@/types/admin.types';

export type LocalPermissionModule = PermissionModule & {
  adminTypes?: AdminType[];
  children?: LocalPermissionModule[];
};

export const additionalPermissionModules: LocalPermissionModule[];
export const permissionModules: PermissionModule[];
export function getPermissionModulesByAdminType(adminType: AdminType): PermissionModule[];
export function getPermissionModuleTreeByAdminType(adminType: AdminType): LocalPermissionModule[];
