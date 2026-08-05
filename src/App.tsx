import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AppLayout } from "./components/layout/AppLayout";
import { AuthProvider } from "./context/AuthContext";
import { moduleRoutes, notFoundRoute } from "./pages/routes";
import { AppRoute } from "./types/router";

import { ThemeProvider } from "./context/ThemeContext";
import { SpotlightProvider } from "./context/SpotlightContext";
import { SidebarProvider } from "./context/SidebarContext";
import { PermissionGuard } from "./components/auth/PermissionGuard";

const queryClient = new QueryClient();

const wrapRouteElement = (route: AppRoute) => {
  let element = route.element;

  if (route.useDashboardLayout) {
    element = <AppLayout>{element}</AppLayout>;
  }

  if (route.permission) {
    element = (
      <PermissionGuard permission={route.permission} fallback={<Navigate to="/404" replace />}>
        {element}
      </PermissionGuard>
    );
  }

  if (route.protected) {
    element = <ProtectedRoute>{element}</ProtectedRoute>;
  }

  return element;
};

const renderRoutes = (routes: AppRoute[]) =>
  routes.map((route, index) => (
    <Route key={route.path || index} path={route.path} element={wrapRouteElement(route)}>
      {route.children && renderRoutes(route.children)}
    </Route>
  ));

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <SpotlightProvider>
          <SidebarProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  {renderRoutes(moduleRoutes)}
                  <Route path={notFoundRoute.path} element={wrapRouteElement(notFoundRoute)} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </SidebarProvider>
        </SpotlightProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
