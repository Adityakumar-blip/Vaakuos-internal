/**
 * Core type definitions for multi-tenant admin panel system
 */

// Admin type enumeration
export type AdminType = 'brand' | 'agency' | 'owner';

// Role definitions per admin type
export type BrandRole = 'admin' | 'marketer';
export type AgencyRole = 'owner' | 'account_manager';
export type OwnerRole = 'super_admin';

// Unified role type
export type AdminRole = BrandRole | AgencyRole | OwnerRole;

/**
 * Admin user with context-specific information
 */
export interface AdminUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  
  // Admin type and role
  adminType: AdminType;
  role: AdminRole;
  
  // Context-specific IDs
  brandId?: string;
  brandName?: string;
  agencyId?: string;
  agencyName?: string;
  
  // Permissions array
  permissions: string[];
}

/**
 * Module/Feature configuration
 */
export interface ModuleConfig {
  id: string;
  name: string;
  path: string;
  icon: string;
  adminTypes: AdminType[];
  requiredPermissions?: string[];
  children?: ModuleConfig[];
}

/**
 * Route configuration
 */
export interface RouteConfig {
  path: string;
  element: React.ComponentType;
  adminTypes: AdminType[];
  requiredPermissions?: string[];
  children?: RouteConfig[];
}

/**
 * Permission check result
 */
export interface PermissionCheckResult {
  hasAccess: boolean;
  reason?: string;
}
