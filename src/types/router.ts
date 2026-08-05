import { RouteObject } from "react-router-dom";

export type AppRoute = RouteObject & {
  protected?: boolean;
  useDashboardLayout?: boolean;
  permission?: string;
};
