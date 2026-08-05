import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePaginationState } from '@/hooks/usePaginationState';
import { useSearch } from '@/hooks/useSearch';
import { Button } from '@/components/ui/button';
import { StatusPill } from '@/components/ui/pill';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Plus,
    CheckCircle2,
    XCircle,
    RefreshCw,
    Trash2,
    Download,
} from 'lucide-react';
import { RowActions } from '@/components/table';
import { SearchInput } from '@/components/common/SearchInput';
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog';
import { DataTable, type BulkAction, type Column } from '@/components/ui/data-table';
import { useGetUsersQuery, useDeleteUserMutation, useUpdateUserMutation, type User } from '@/store/api/userApi';
import { type Role } from '@/store/api/roleApi';
import { AddFilterButton, FilterPills, useDataFilters, type FilterField, type FilterOption } from '@/components/common/filters';
import { CircleDot, Shield } from 'lucide-react';

export default function OwnerUserPage() {
    const navigate = useNavigate();

    // Search state
    const { search, debouncedSearch, handleSearchChange, setSearch } = useSearch({
        onSearchChange: () => setPageIndex(0),
    });

    // Pagination state with URL persistence
    const { pageSize, pageIndex, setPageSize, setPageIndex } = usePaginationState({
        defaultPageSize: 10,
        defaultPageIndex: 0,
    });

    // Fetch users from API (server-side pagination)
    const { data: usersResult, isLoading } = useGetUsersQuery({
        page: pageIndex + 1,
        perPage: pageSize,
        search: debouncedSearch || undefined,
    });
    const users = usersResult?.data ?? [];
    const totalUsers = usersResult?.total ?? 0;

    // Selection state
    const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>({});

    // Delete confirmation state
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<string | null>(null);


    const [deleteUser] = useDeleteUserMutation();
    const [updateUser] = useUpdateUserMutation();



    const handleDeleteSingle = (userId: string) => {
        setUserToDelete(userId);
        setDeleteConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        try {
            if (userToDelete) {
                await deleteUser(userToDelete).unwrap();
                setUserToDelete(null);
            } else {
                const selectedIds = Object.keys(selectedRows);
                await Promise.all(selectedIds.map(id => deleteUser(id).unwrap()));
                setSelectedRows({});
            }
            setDeleteConfirmOpen(false);
        } catch (error) {
            console.error('Failed to delete users:', error);
        }
    };


    const handleBulkDelete = (selectedUsers: User[]) => {
        setUserToDelete(null); // Indicates bulk mode
        setDeleteConfirmOpen(true);
    };


    // Define columns
    const columns: Column<User>[] = [
        {
            id: "select",
            header: ({ table }) => (
                <Checkbox
                    checked={
                        table.getIsAllPageRowsSelected()
                            ? true
                            : table.getIsSomePageRowsSelected()
                                ? "indeterminate"
                                : false
                    }
                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                    aria-label="Select all"
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    aria-label="Select row"
                />
            ),
            enableSorting: false,
            enableHiding: false,
        },
        {
            accessorKey: "name",
            header: "User",
            cell: ({ row }) => {
                const user = row.original;
                return (
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-sm">
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <p className="font-medium text-foreground">{user.name}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                    </div>
                );
            }
        },
        {
            accessorKey: "role",
            header: "Role",
            cell: ({ row }) => {
                const user = row.original;
                const roles = user.user_roles?.map((ur: { roles: Role }) => ur.roles?.name).filter(Boolean) || [];
                return roles.length > 0 ? (
                    <span className="text-sm capitalize">{roles.join(", ")}</span>
                ) : (
                    <span className="text-muted-foreground text-xs italic">No Role</span>
                );
            }
        },

        {
            accessorKey: "is_active",
            header: "Status",
            cell: ({ row }) => {
                const isActive = row.getValue("is_active") as boolean;
                return <StatusPill status={isActive ? "active" : "inactive"} />;
            }
        },
        {
            id: "actions",
            header: () => <div className="text-right">Actions</div>,
            cell: ({ row }) => {
                const user = row.original;
                return (
                    <RowActions
                        onEdit={() => navigate(`/team/user/create?id=${user.id}&action=edit`)}
                        onDelete={() => handleDeleteSingle(user.id)}
                        onView={() => navigate(`/team/user/create?id=${user.id}&action=view`)}
                    />
                );
            },
        },
    ];

    // Role options derived from the current page data
    const roleOptions: FilterOption[] = useMemo(() => {
        const names = new Set<string>();
        users.forEach((u: any) => (u.user_roles || []).forEach((ur: { roles: Role }) => ur.roles?.name && names.add(ur.roles.name)));
        return Array.from(names).map((name) => ({ label: name, value: name }));
    }, [users]);

    const filterFields: FilterField<User>[] = useMemo(() => [
        {
            id: "status",
            label: "Status",
            icon: CircleDot,
            type: "select",
            // client-side only — backend does not support status filter on GET /users via this page
            accessor: (u: any) => (u.is_active ? "active" : "inactive"),
            options: [
                { label: "Active", value: "active", dot: "bg-emerald-500" },
                { label: "Inactive", value: "inactive", dot: "bg-zinc-400" },
            ],
        },
        {
            id: "role",
            label: "Role",
            icon: Shield,
            type: "multiselect",
            searchable: true,
            // client-side only — role filter applied on current page results
            accessor: (u: any) => (u.user_roles || []).map((ur: { roles: Role }) => ur.roles?.name).filter(Boolean),
            options: roleOptions,
        },
    ], [roleOptions]);

    const filters = useDataFilters<User>(filterFields);

    // Apply client-side filters (status, role) on the server-returned page
    const filteredData = useMemo(() => filters.apply(users), [users, filters.predicate]);

    const getDeleteMessage = () => {
        if (userToDelete) {
            const user = users.find(u => u.id === userToDelete);
            return {
                title: 'Delete User',
                description: `Are you sure you want to delete ${user?.name}? This action cannot be undone.`,
            };
        }
        const selectedCount = Object.keys(selectedRows).length;
        return {
            title: 'Delete Users',
            description: `Are you sure you want to delete ${selectedCount} selected user${selectedCount > 1 ? 's' : ''}? This action cannot be undone.`,
        };
    };

    const deleteMessage = getDeleteMessage();
    const selectedIds = Object.keys(selectedRows);

    // Bulk actions configuration
    const bulkActions: BulkAction<User>[] = [
        {
            label: "Update Status",
            icon: <RefreshCw size={16} />,
            variant: "default",
            options: [
                {
                    label: "Active",
                    icon: <CheckCircle2 size={14} />,
                    onClick: async (selectedUsers) => {
                        try {
                            await Promise.all(
                                selectedUsers.map(user =>
                                    updateUser({ id: user.id as string, data: { is_active: true } }).unwrap()
                                )
                            );
                            setSelectedRows({});
                        } catch (error) {
                            console.error('Failed to update status:', error);
                        }
                    }
                },
                {
                    label: "Inactive",
                    icon: <XCircle size={14} />,
                    onClick: async (selectedUsers) => {
                        try {
                            await Promise.all(
                                selectedUsers.map(user =>
                                    updateUser({ id: user.id as string, data: { is_active: false } }).unwrap()
                                )
                            );
                            setSelectedRows({});
                        } catch (error) {
                            console.error('Failed to update status:', error);
                        }
                    }
                }
            ]
        },
        {
            label: "Download CSV",
            icon: <Download size={16} />,
            onClick: (users) => {
                const csvContent = "data:text/csv;charset=utf-8,"
                    + "Name,Email,Role,Status\n"
                    + users.map(u => `${u.name},${u.email},${u.role},${u.is_active ? 'active' : 'inactive'}`).join("\n");
                const encodedUri = encodeURI(csvContent);
                const link = document.createElement("a");
                link.setAttribute("href", encodedUri);
                link.setAttribute("download", `users_report_${users.length}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            },
            variant: "default",
            shortcut: "c",
        },
        {
            label: "Delete Selected",
            icon: <Trash2 size={16} />,
            onClick: handleBulkDelete,
            variant: "destructive",
            shortcut: "d",
        },
    ];

    return (
        <div className="space-y-6 pt-4">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">User Management</h1>
                    <p className="text-sm text-muted-foreground mt-1">Manage your team members and their roles</p>
                </div>
                <Button onClick={() => navigate('/team/user/create')}>
                    <Plus className="mr-2 h-4 w-4" /> Add User
                </Button>
            </div>

            {/* Search + Filters */}
            <div className="flex items-center gap-2">
                <SearchInput
                    value={search}
                    onValueChange={handleSearchChange}
                    placeholder="Search users..."
                />
                <AddFilterButton fields={filterFields} active={filters.filters} onSet={filters.setFilter} />
            </div>

            {/* Data Table */}
            <DataTable
                columns={columns}
                data={filteredData}
                toolbar={filters.activeCount > 0 ? <FilterPills controller={filters} /> : undefined}
                rowSelection={selectedRows}
                onRowSelectionChange={setSelectedRows}
                bulkActions={bulkActions}
                isLoading={isLoading}
                showPagination={true}
                totalItems={totalUsers}
                pageSize={pageSize}
                initialPageIndex={pageIndex}
                onPageIndexChange={setPageIndex}
                onPageSizeChange={(s) => { setPageSize(s); setPageIndex(0); }}
            />

            {/* Delete Confirmation Modal */}
            <ConfirmationDialog
                open={deleteConfirmOpen}
                onOpenChange={(open) => {
                    setDeleteConfirmOpen(open);
                    if (!open) setUserToDelete(null);
                }}
                onConfirm={handleConfirmDelete}
                title={deleteMessage.title}
                description={deleteMessage.description}
                confirmText="Delete"
                cancelText="Cancel"
                variant="destructive"
            />

        </div>
    );
}
