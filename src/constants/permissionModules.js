import { INTERNAL_MODULES } from '@/config/modules.config';
import { getPermissionGroupsByTenantType, permissionGroups } from './permissionGroups';

const actionLabels = {
  read: 'Read',
  view: 'View',
  create: 'Create',
  invite: 'Invite',
  update: 'Update',
  edit: 'Edit',
  delete: 'Delete',
  manage: 'Manage',
  execute: 'Execute',
  approve: 'Approve',
  reply: 'Reply',
  login_as: 'Login As',
};

const formatPermissionLabel = (permission) => {
  const action = permission.split(':').pop();
  return actionLabels[action] || action
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

const formatPermissionScope = (permission) => {
  const scope = permission.split(':')[0] || '';
  return scope
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

const toPermissionFeatures = (permissions = []) => {
  const uniquePermissionKeys = uniquePermissions(permissions);
  const actionLabelCounts = uniquePermissionKeys.reduce((counts, permission) => {
    const label = formatPermissionLabel(permission);
    counts[label] = (counts[label] || 0) + 1;
    return counts;
  }, {});

  return uniquePermissionKeys.map((permission) => {
    const actionLabel = formatPermissionLabel(permission);
    const scopeLabel = formatPermissionScope(permission);

    return {
      key: permission,
      label: actionLabelCounts[actionLabel] > 1 ? `${scopeLabel} ${actionLabel}` : actionLabel,
    };
  });
};

const toPermissionModule = (group) => ({
  id: group.id,
  label: group.label,
  description: group.description,
  features: toPermissionFeatures(group.permissions),
});

const moduleSets = {
  owner: INTERNAL_MODULES,
};

const appPermissionGroupIds = [
  'contacts',
  'campaigns',
  'templates',
  'inbox',
  'automation',
  'integrations',
  'tenant-settings',
  'auto-response',
  'subscriptions',
  'ecommerce',
];

const uniquePermissions = (permissions = []) => [...new Set(permissions)];

const toMenuPermissionNode = (module) => ({
  id: module.id,
  label: module.name,
  description: module.path,
  features: toPermissionFeatures(module.requiredPermissions),
  children: module.children?.map(toMenuPermissionNode) || [],
});

const filterEmptyNodes = (nodes) => nodes
  .map((node) => ({
    ...node,
    children: filterEmptyNodes(node.children || []),
  }))
  .filter((node) => node.features.length > 0 || node.children.length > 0);

const getPermissionKeysFromTree = (nodes) => new Set(
  nodes.flatMap((node) => [
    ...node.features.map((feature) => feature.key),
    ...Array.from(getPermissionKeysFromTree(node.children || [])),
  ]),
);

const removeChildDuplicateFeatures = (nodes) => nodes.map((node) => {
  const children = removeChildDuplicateFeatures(node.children || []);
  const childPermissionKeys = getPermissionKeysFromTree(children);

  return {
    ...node,
    features: node.features.filter((feature) => !childPermissionKeys.has(feature.key)),
    children,
  };
});

const dedupePermissionTree = (nodes, seenPermissionKeys = new Set()) => nodes
  .map((node) => {
    const features = node.features.filter((feature) => {
      if (seenPermissionKeys.has(feature.key)) return false;
      seenPermissionKeys.add(feature.key);
      return true;
    });

    return {
      ...node,
      features,
      children: dedupePermissionTree(node.children || [], seenPermissionKeys),
    };
  })
  .filter((node) => node.features.length > 0 || node.children.length > 0);

const getAppModuleNodes = (existingNodes) => {
  const existingPermissionKeys = getPermissionKeysFromTree(existingNodes);

  return permissionGroups
    .filter((group) => appPermissionGroupIds.includes(group.id))
    .map((group) => {
      const module = toPermissionModule(group);
      return {
        ...module,
        id: `app-${group.id}`,
        features: module.features.filter((feature) => !existingPermissionKeys.has(feature.key)),
      };
    })
    .filter((module) => module.features.length > 0);
};

// Add future modules here. Optionally set adminTypes to ['owner'], ['agency'], or ['brand'].
export const additionalPermissionModules = [];

export const permissionModules = [
  ...permissionGroups.map(toPermissionModule),
  ...additionalPermissionModules,
];

export const getPermissionModulesByAdminType = (adminType) => [
  ...getPermissionGroupsByTenantType(adminType).map(toPermissionModule),
  ...additionalPermissionModules.filter((module) => (
    !module.adminTypes || module.adminTypes.includes(adminType)
  )),
];

export const getPermissionModuleTreeByAdminType = (adminType) => {
  const adminNodes = dedupePermissionTree(
    filterEmptyNodes(
      removeChildDuplicateFeatures(
        filterEmptyNodes((moduleSets[adminType] || []).map(toMenuPermissionNode)),
      ),
    ),
  );

  return dedupePermissionTree([
    ...adminNodes,
    ...getAppModuleNodes(adminNodes),
    ...additionalPermissionModules.filter((module) => (
      !module.adminTypes || module.adminTypes.includes(adminType)
    )),
  ]);
};
