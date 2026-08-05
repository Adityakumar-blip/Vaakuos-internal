import { apiSlice as api } from './apiSlice';
import { PaginatedResult, PageArgs, unwrapPaginated, buildPageQuery } from './paginated';

export interface Role {
    id: string;
    name: string;
    description?: string;
    permissions: string[];
    tenant_id?: string | null;
    isSystem?: boolean;
    _count?: {
        user_roles: number;
    };
    created_at?: string;
    updated_at?: string;
}

export interface GetRolesParams extends PageArgs {
    search?: string;
}

export interface AssignRoleParams {
    userId: string;
    roleId: string;
}

export interface PermissionFeature {
    key: string;
    label: string;
}

export interface PermissionModule {
    id: string;
    label: string;
    description?: string;
    features: PermissionFeature[];
}

export const roleApi = api.injectEndpoints({
    endpoints: (builder) => ({
        // Get all roles
        getRoles: builder.query<PaginatedResult<Role>, GetRolesParams>({
            query: (params) => {
                const qs = buildPageQuery(params, { search: params?.search });
                return `/roles?${qs}`;
            },
            transformResponse: unwrapPaginated<Role>,
            providesTags: (result) =>
                result?.data
                    ? [
                        { type: 'Role', id: 'LIST' },
                        ...result.data.map(({ id }) => ({ type: 'Role' as const, id })),
                    ]
                    : [{ type: 'Role', id: 'LIST' }],
        }),

        // Get role by ID
        getRoleById: builder.query<Role, string>({
            query: (id) => `/roles/${id}`,
            providesTags: (result, error, id) => [{ type: 'Role', id }],
        }),

        // Add new role
        addRole: builder.mutation<Role, Partial<Role>>({
            query: (data) => ({
                url: '/roles',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: [{ type: 'Role', id: 'LIST' }],
        }),

        // Update existing role
        updateRole: builder.mutation<Role, { id: string; data: Partial<Role> }>({
            query: ({ id, data }) => ({
                url: `/roles/${id}`,
                method: 'PATCH',
                body: data,
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'Role', id: 'LIST' },
                { type: 'Role', id },
            ],
        }),

        // Delete role
        deleteRole: builder.mutation<void, string>({
            query: (id) => ({
                url: `/roles/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: [{ type: 'Role', id: 'LIST' }],
        }),

        // Assign role to user
        assignRole: builder.mutation<void, AssignRoleParams>({
            query: (data) => ({
                url: '/roles/assign',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: [{ type: 'User', id: 'LIST' }], // Invalidate users because their role changed
        }),

        // Unassign role from user
        unassignRole: builder.mutation<void, AssignRoleParams>({
            query: (data) => ({
                url: '/roles/unassign',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: [{ type: 'User', id: 'LIST' }],
        }),

        // Get available permissions from backend
        getPermissions: builder.query<{ name: string; key: string; group: string }[], void>({
            query: () => '/roles/permissions',
        }),

        getPermissionModules: builder.query<PermissionModule[], void>({
            query: () => '/roles/modules',
        }),
    }),
});

export const {
    useGetRolesQuery,
    useLazyGetRolesQuery,
    useGetRoleByIdQuery,
    useLazyGetRoleByIdQuery,
    useAddRoleMutation,
    useUpdateRoleMutation,
    useDeleteRoleMutation,
    useAssignRoleMutation,
    useUnassignRoleMutation,
    useGetPermissionsQuery,
    useGetPermissionModulesQuery,
} = roleApi;
