import { Navigate, useLocation } from "react-router-dom";
import { useAppSelector } from "@/store/hooks";
import { selectCurrentUser, selectIsAuthenticated } from "@/store/slices/authSlice";
import { useGetCurrentUserQuery } from "@/store/api/authApi";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isLoading, isFetching } = useGetCurrentUserQuery();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectCurrentUser) as any;
  const { pathname } = useLocation();

  // Show loader ONLY if we are not authenticated AND the session check is in progress.
  // This prevents the "Authenticating..." flicker on refresh/navigation for logged-in users.
  if ((isLoading || isFetching) && !isAuthenticated) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent shadow-sm"></div>
          <p className="text-sm text-muted-foreground animate-pulse font-medium tracking-tight">
            Authenticating...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    const searchParams = typeof window !== 'undefined' ? window.location.search : '';
    return <Navigate to={`/login${searchParams}`} replace />;
  }

  // Admin-created users must set their own password before reaching any app route.
  const mustChangePassword = user?.force_password_change ?? user?.forcePasswordChange;
  if (mustChangePassword && pathname !== "/change-password") {
    return <Navigate to="/change-password" replace />;
  }

  return <>{children}</>;
};
