import { apiSlice as api } from './apiSlice';

export enum IntegrationStatus {
    CONNECTED = 'connected',
    DISCONNECTED = 'disconnected',
    ERROR = 'error',
    PENDING = 'pending',
}

export const INTEGRATION_STATUS_OPTIONS = [
    { value: IntegrationStatus.DISCONNECTED, label: 'Disconnected' },
    { value: IntegrationStatus.CONNECTED, label: 'Connected' },
    { value: IntegrationStatus.PENDING, label: 'Pending' },
    { value: IntegrationStatus.ERROR, label: 'Error' },
] as const;

export interface Integration {
    id: string;
    tenant_id: string;
    provider: string;
    name: string;
    description?: string | null;
    icon_url?: string | null;
    status: IntegrationStatus;
    is_enabled: boolean;
    config?: Record<string, unknown> | null;
    metadata?: Record<string, unknown> | null;
    connected_at?: string | null;
    created_at: string;
    updated_at: string;
}

export interface CreateIntegrationDto {
    provider: string;
    name: string;
    description?: string;
    icon_url?: string;
    status?: IntegrationStatus;
    is_enabled?: boolean;
    config?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
}

export type UpdateIntegrationDto = Partial<CreateIntegrationDto>;

export interface IntegrationsQueryParams {
    status?: string;
    is_enabled?: boolean;
}

const LIST_TAG = { type: 'Integration' as const, id: 'LIST' };

export const integrationsApi = api.injectEndpoints({
    endpoints: (builder) => ({
        // Backend returns a bare array — no server-side pagination or search.
        getIntegrations: builder.query<Integration[], IntegrationsQueryParams | void>({
            query: (args) => {
                const a = args || undefined;
                const params = new URLSearchParams();
                if (a?.status) params.set('status', a.status);
                if (a?.is_enabled !== undefined) params.set('is_enabled', String(a.is_enabled));
                const qs = params.toString();
                return `/integrations/all${qs ? `?${qs}` : ''}`;
            },
            providesTags: (result) =>
                result
                    ? [...result.map(({ id }) => ({ type: 'Integration' as const, id })), LIST_TAG]
                    : [LIST_TAG],
        }),
        getIntegration: builder.query<Integration, string>({
            query: (id) => `/integrations/integration/${id}`,
            providesTags: (_result, _error, id) => [{ type: 'Integration', id }],
        }),
        createIntegration: builder.mutation<Integration, CreateIntegrationDto>({
            query: (body) => ({
                url: '/integrations/create',
                method: 'POST',
                body,
            }),
            invalidatesTags: [LIST_TAG],
        }),
        updateIntegration: builder.mutation<Integration, { id: string; body: UpdateIntegrationDto }>({
            query: ({ id, body }) => ({
                url: `/integrations/${id}`,
                method: 'PUT',
                body,
            }),
            invalidatesTags: (_result, _error, { id }) => [{ type: 'Integration', id }, LIST_TAG],
        }),
        toggleIntegration: builder.mutation<Integration, string>({
            query: (id) => ({
                url: `/integrations/${id}/toggle`,
                method: 'PATCH',
            }),
            invalidatesTags: (_result, _error, id) => [{ type: 'Integration', id }, LIST_TAG],
        }),
        deleteIntegration: builder.mutation<void, string>({
            query: (id) => ({
                url: `/integrations/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: [LIST_TAG],
        }),
    }),
});

export const {
    useGetIntegrationsQuery,
    useGetIntegrationQuery,
    useCreateIntegrationMutation,
    useUpdateIntegrationMutation,
    useToggleIntegrationMutation,
    useDeleteIntegrationMutation,
} = integrationsApi;
