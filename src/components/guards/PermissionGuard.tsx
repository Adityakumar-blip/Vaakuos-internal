import React from 'react';
import { Navigate } from 'react-router-dom';
import { usePermission } from '@/hooks/usePermission';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ExclamationTriangleIcon as AlertTriangle } from '@heroicons/react/24/outline';

interface PermissionGuardProps {
    requiredPermissions: string[];
    requireAll?: boolean;
    fallback?: React.ReactNode;
    redirectTo?: string;
    showAlert?: boolean;
    children: React.ReactNode;
}

/**
 * Guard component that restricts access based on permissions
 */
export function PermissionGuard({
    requiredPermissions,
    requireAll = false,
    fallback,
    redirectTo,
    showAlert = true,
    children,
}: PermissionGuardProps) {
    const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermission();

    // Check permissions
    const hasAccess = requireAll
        ? hasAllPermissions(requiredPermissions)
        : hasAnyPermission(requiredPermissions);

    if (!hasAccess) {
        // Custom fallback provided
        if (fallback) {
            return <>{fallback}</>;
        }

        // Redirect to specific route
        if (redirectTo) {
            return <Navigate to={redirectTo} replace />;
        }

        // Show default alert
        if (showAlert) {
            return (
                <div className="flex items-center justify-center min-h-[400px] p-6">
                    <Alert variant="destructive" className="max-w-md">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Access Denied</AlertTitle>
                        <AlertDescription>
                            You don't have permission to access this resource.
                            {requiredPermissions.length > 0 && (
                                <div className="mt-2 text-sm opacity-80">
                                    Required permissions: {requiredPermissions.join(', ')}
                                </div>
                            )}
                        </AlertDescription>
                    </Alert>
                </div>
            );
        }

        // Default: show nothing
        return null;
    }

    return <>{children}</>;
}
