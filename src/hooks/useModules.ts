import { useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ModuleConfig } from '@/types/admin.types';
import { INTERNAL_MODULES } from '@/config/modules.config';

export function useModules() {
  const { user, hasPermission } = useAuth();

  const modules = useMemo(
    () => (user ? filterModulesByPermissions(INTERNAL_MODULES, hasPermission) : []),
    [user, hasPermission]
  );

  return { modules };
}

/** A parent stays visible when any child survives, even if the parent itself is ungated. */
function filterModulesByPermissions(
  modules: ModuleConfig[],
  hasPermission: (permission: string) => boolean
): ModuleConfig[] {
  return modules
    .map(module => ({
      ...module,
      children: module.children
        ? filterModulesByPermissions(module.children, hasPermission)
        : undefined,
    }))
    .filter(module => {
      if (module.children?.length) return true;
      return (
        !module.requiredPermissions?.length ||
        module.requiredPermissions.some(hasPermission)
      );
    });
}
