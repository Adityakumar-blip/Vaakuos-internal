export { apiSlice } from './apiSlice';

// Export Auth API
export {
  authApi,
  useLoginMutation,
  useLogoutMutation,
  useGetCurrentUserQuery,
  useRefreshTokenMutation,
  useUpdateProfileMutation,
  useChangePasswordMutation,
} from './authApi';

// Export Products API
export {
  productsApi,
  useGetProductsQuery,
  useGetProductByIdQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useBulkDeleteProductsMutation,
  useSearchProductsQuery,
  useLazySearchProductsQuery,
} from './productsApi';

// Export types
export type { Product } from './productsApi';

// Export utilities
export {
  getErrorMessage,
  buildQueryString,
  isFetchBaseQueryError,
  isSerializedError,
  formatDateForApi,
  parseDateFromApi,
  debounce,
  transformPaginatedResponse,
  createOptimisticUpdate,
  retryWithBackoff,
  isSuccessResponse,
  createFormData,
} from './utils';

export type { PaginatedResponse } from './utils';

// Export configuration
export {
  API_BASE_URLS,
  getApiBaseUrl,
  API_ENDPOINTS,
  API_ERROR_MESSAGES,
  HTTP_STATUS,
  REQUEST_TIMEOUT,
  RETRY_CONFIG,
  CACHE_CONFIG,
} from './config';

// Export Contacts API
export {
  contactsApi,
  useCreateContactMutation,
  useGetAllContactsQuery,
  useLazyGetAllContactsQuery,
  useSearchContactsQuery,
  useLazySearchContactsQuery,
  useGetContactByIdQuery,
  useLazyGetContactByIdQuery,
  useUpdateContactMutation,
  useUpdateContactPropertiesMutation,
  useDeleteContactMutation,
  useBulkDeleteContactsMutation,
} from './contactsApi';

export type { Contact, CreateContactDto, UpdateContactDto } from './contactsApi';

// Export Templates API
export {
  templatesApi,
  useCreateTemplateMutation,
  useSubmitTemplateToMetaMutation,
  useGetAllTemplatesQuery,
  useLazyGetAllTemplatesQuery,
  useGetTemplateByIdQuery,
  useLazyGetTemplateByIdQuery,
  useUpdateTemplateMutation,
  useDeleteTemplateMutation,
  useUploadTemplateMediaMutation,
} from './templatesApi';

export type {
  Template,
  CreateTemplateDto,
  UpdateTemplateDto,
  TemplatesQueryParams,
  PaginatedTemplatesResponse,
  TemplateComponent,
  TemplateButton,
} from './templatesApi';

// Export Integrations API
export {
  integrationsApi,
  useCreateIntegrationMutation,
  useGetAllIntegrationsQuery,
  useLazyGetAllIntegrationsQuery,
  useGetIntegrationByIdQuery,
  useLazyGetIntegrationByIdQuery,
  useUpdateIntegrationMutation,
  useDeleteIntegrationMutation,
  useConnectIntegrationMutation,
  useDisconnectIntegrationMutation,
  useGetGoogleSheetsAuthUrlQuery,
  useLazyGetGoogleSheetsAuthUrlQuery,
  useGetShopifyAuthUrlQuery,
  useLazyGetShopifyAuthUrlQuery,
} from './integrationsApi';

// Export Users API
export {
  userApi,
  useGetUsersQuery,
  useLazyGetUsersQuery,
} from './userApi';

export type {
  Integration,
  CreateIntegrationDto,
  UpdateIntegrationDto,
} from './integrationsApi';

// Export Flows API
export {
  flowsApi,
  useCreateFlowMutation,
  useGetAllFlowsQuery,
  useLazyGetAllFlowsQuery,
  useGetFlowByIdQuery,
  useLazyGetFlowByIdQuery,
  useUpdateFlowMutation,
  useDeleteFlowMutation,
  useDuplicateFlowMutation,
  usePlayFlowMutation,
  usePauseFlowMutation,
  useArchiveFlowMutation,
  useGetFlowStatsQuery,
  useLazyGetFlowStatsQuery,
} from './flowsApi';

export type {
  Flow,
  FlowNode,
  FlowConnection,
  FlowVariable,
  FlowSettings,
  FlowStats,
  FlowStatus,
  CreateFlowDto,
  UpdateFlowDto,
} from './flowsApi';

// Export Ecommerce API
export {
  ecommerceApi,
  useGetAbandonedCartsQuery,
  useGetAbandonedCartByIdQuery,
  useSendAbandonedCartReminderMutation,
  useGetEcommerceStatsQuery,
  useGetCartsQuery,
  useGetCartByIdQuery,
  useRecoverCartMutation,
  useDeleteAbandonedCartMutation,
} from './ecommerceApi';

export type {
  AbandonedCart,
  Cart,
  CartItem,
  CartTimelineEvent,
  EcommerceStats,
} from './ecommerceApi';

// Export Dashboard API
export {
  dashboardApi,
  useGetWidgetsQuery,
  useCreateWidgetMutation,
  useUpdateWidgetMutation,
  useDeleteWidgetMutation,
  useReorderWidgetsMutation,
  useGetAllWidgetsDataQuery,
  useGetWidgetDataQuery,
  useGetAvailableMetricsQuery,
  useGetLayoutQuery,
  useUpdateLayoutMutation,
  useSeedDefaultsMutation,
} from './dashboardApi';

export type {
  MetricDefinition,
  MetricResult,
  DashboardWidget,
  WidgetDataResponse,
  CreateWidgetDto,
  UpdateWidgetDto,
  DashboardLayout,
} from './dashboardApi';

// Export Notifications API
export {
  notificationsApi,
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
  useDeleteNotificationMutation,
} from './notificationsApi';

export type { Notification, NotificationType } from './notificationsApi';

// Export Logs API
export {
  logsApi,
  useGetActivityLogsQuery,
  usePurgeActivityLogsMutation,
} from './logsApi';

export type { ActivityLog } from '@/types/owner.types';

// Export API Keys API
export {
  apiKeysApi,
  useGetApiKeysQuery,
  useLazyGetApiKeysQuery,
  useCreateApiKeyMutation,
  useDeleteApiKeyMutation,
} from './apiKeysApi';

export type {
  ApiKey,
  CreateApiKeyDto,
  CreatedApiKey,
} from './apiKeysApi';
