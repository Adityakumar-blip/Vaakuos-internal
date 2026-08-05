import { AppRoute } from "@/types/router";
import { Navigate } from "react-router-dom";
import { AutoRoutes } from "@/components/routing/AutoRoutes";
import Login from "./auth/Login";
import ForgotPassword from "./auth/ForgotPassword";
import ResetPassword from "./auth/ResetPassword";
import ChangePassword from "./auth/ChangePassword";
import NotFound from "./NotFound";

/**
 * Every page under src/pages/internal is auto-routed by file path, so a new
 * internal feature is a new file plus an INTERNAL_MODULES entry — nothing here
 * changes.
 */
export const moduleRoutes: AppRoute[] = [
  { path: "/login", element: <Login />, protected: false },
  { path: "/forgot-password", element: <ForgotPassword />, protected: false },
  { path: "/reset-password", element: <ResetPassword />, protected: false },
  { path: "/change-password", element: <ChangePassword />, protected: true },

  {
    path: "/",
    element: <Navigate to="/dashboard" replace />,
    protected: true,
  },
  {
    path: "/*",
    element: <AutoRoutes basePath="internal" />,
    protected: true,
    useDashboardLayout: true,
  },
];

export const notFoundRoute: AppRoute = {
  path: "*",
  element: <NotFound />,
  protected: false,
  useDashboardLayout: false,
};
