/**
 * Store Exports
 * Central export point for Redux store, hooks, and slices
 * 
 * Usage:
 * import { store, useAppDispatch, useAppSelector } from '@/store';
 */

// Export store
export { store } from './index';
export type { RootState, AppDispatch } from './index';

// Export hooks
export { useAppDispatch, useAppSelector } from './hooks';

// Export slices
export {
  setCredentials,
  setUser,
  logout,
  setLoading,
  selectCurrentUser,
  selectIsAuthenticated,
  selectAuthToken,
  selectAuthLoading,
} from './slices/authSlice';

// Re-export API
export * from './api';
