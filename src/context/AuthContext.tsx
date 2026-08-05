import React, { createContext, useContext, useEffect, useMemo } from "react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { 
  selectCurrentUser, 
  selectIsAuthenticated, 
  selectAuthLoading,
  setCredentials,
  logout as logoutAction,
  User
} from "@/store/slices/authSlice";
import { authApi, useLogoutMutation, useGetCurrentUserQuery } from "@/store/api/authApi";

import { AdminType, AdminRole } from "../types/admin.types";

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<User>;
  signup: (data: User & { password: string }) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const user = useAppSelector(selectCurrentUser) as User | null;
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const dispatch = useAppDispatch();
  const [reduxLogout] = useLogoutMutation();
  
  // Globally trigger session check via cookies on app boot
  const { isLoading: isProfileLoading } = useGetCurrentUserQuery();
  const isLoading = useAppSelector(selectAuthLoading) || isProfileLoading;


  const login = async (email: string, password: string, rememberMe = false): Promise<User> => {
    const result = await dispatch(
      authApi.endpoints.login.initiate({ email, password, rememberMe })
    ).unwrap() as { user: User; access_token: string };

    return result.user;
  };

  const signup = async (
    data: User & { password: string }
  ): Promise<boolean> => {
    // This is legacy code for local-only signup
    const users = JSON.parse(localStorage.getItem("users") || "[]");

    if (users.find((u: any) => u.email === data.email)) {
      return false;
    }

    users.push(data);
    localStorage.setItem("users", JSON.stringify(users));

    const { password: _, ...userWithoutPassword } = data;
    dispatch(setCredentials({ user: userWithoutPassword as User }));
    localStorage.setItem("needsOnboarding", "true");
    return true;
  };

  const logout = () => {
    reduxLogout();
    dispatch(logoutAction());
    
    // Redirect to landing page based on environment
    const isLocal = window.location.hostname === 'localhost' || 
                   window.location.hostname === '127.0.0.1' || 
                   window.location.hostname === 'vaakuos.local';
                   
    const landingUrl = isLocal ? 'http://vaakuos.local:8080' : 'https://vaakuos.com';
    window.location.href = landingUrl;
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;

    // Check for owner wildcard
    if (user.permissions.includes('owner:*')) {
      return true;
    }

    // Check exact permission
    if (user.permissions.includes(permission)) {
      return true;
    }

    const [requiredModule] = permission.split(':');

    // Check wildcard patterns (e.g., brand:*) and module manage permissions (e.g., roles:manage)
    return user.permissions.some(perm => {
      if (perm.endsWith(':*')) {
        const prefix = perm.slice(0, -1);
        return permission.startsWith(prefix);
      }

      if (perm.endsWith(':manage')) {
        const [permissionModule] = perm.split(':');
        return permissionModule === requiredModule;
      }

      return false;
    });
  };

  const hasAnyPermission = (permissions: string[]): boolean => {
    return permissions.some(perm => hasPermission(perm));
  };

  const hasAllPermissions = (permissions: string[]): boolean => {
    return permissions.every(perm => hasPermission(perm));
  };

  const value = useMemo(() => ({ 
    user, 
    login, 
    signup, 
    logout, 
    isAuthenticated, 
    isLoading,
    hasPermission, 
    hasAnyPermission, 
    hasAllPermissions 
  }), [
    user, 
    isAuthenticated, 
    isLoading, 
    hasPermission, 
    hasAnyPermission, 
    hasAllPermissions
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

