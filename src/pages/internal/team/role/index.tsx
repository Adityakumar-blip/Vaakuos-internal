import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePaginationState } from '@/hooks/usePaginationState';
import { useSearch } from '@/hooks/useSearch';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Plus,
    Shield,
    Trash2,
    Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RowActions } from '@/components/table';
import { SearchInput } from '@/components/common/SearchInput';
import { AddFilterButton, FilterPills, useDataFilters, type FilterField } from '@/components/common/filters';
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog';
import { DataTable, type Column, type BulkAction } from '@/components/ui/data-table';
import { useGetRolesQuery, useDeleteRoleMutation, Role } from '@/store/api/roleApi';

export default function OwnerRolePage() {
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

    // Fetch roles from API (server-side pagination)
    const { data: rolesResult, isLoading } = useGetRolesQuery({
        page: pageIndex + 1,
        perPage: pageSize,
        search: debouncedSearch || undefined,
    });
    const rolesData = rolesResult?.data ?? [];
    const totalRoles = rolesResult?.total ?? 0;

    // Selection state
    const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>({});

    // Delete confirmation state
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [roleToDelete, setRoleToDelete] = useState<string | null>(null);

    const [deleteRole] = useDeleteRoleMutation();


    const handleBulkDelete = () => {
        setRoleToDelete(null); // Indicates bulk mode
        setDeleteConfirmOpen(true);
    };

    const handleDeleteSingle = (roleId: string) => {
        setRoleToDelete(roleId);
        setDeleteConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        try {
            if (roleToDelete) {
                await deleteRole(roleToDelete).unwrap();
                setRoleToDelete(null);
            } else {
                const ids = Object.keys(selectedRows);
                await Promise.all(ids.map(id => deleteRole(id).unwrap()));
                setSelectedRows({});
            }
            setDeleteConfirmOpen(false);
        } catch (error) {
            console.error('Failed to delete roles:', error);
        }
    };

    // Filter fields (search is handled by the backend; filters apply client-side)
    const filterFields: FilterField<Role>[] = useMemo(() => [
        {
            id: 'type',
            label: 'Type',
            icon: Shield,
            type: 'select',
            accessor: (r) => (r.isSystem ? 'system' : 'custom'),
            options: [
                { label: 'System', value: 'system', dot: 'bg-blue-500' },
                { label: 'Custom', value: 'custom', dot: 'bg-emerald-500' },
            ],
        },
    ], []);

    const filters = useDataFilters<Role>(filterFields);

    // client-side type filter applied on current server page
    const filteredRoles = useMemo(() => filters.apply(rolesData), [rolesData, filters.predicate]);


    // Define columns
    const columns: Column<Role>[] = [
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
                    disabled={row.original.isSystem}
                />
            ),
            enableSorting: false,
            enableHiding: false,
        },
        {
            accessorKey: "name",
            header: "Role Name",
            cell: ({ row }) => {
                const role = row.original;
                return (
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-primary/10 text-primary">
                            <Shield size={16} />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">{role.name}</span>
                            {role.isSystem && (
                                <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                                    SYSTEM
                                </Badge>
                            )}
                        </div>
                    </div>
                );
            }
        },
        {
            accessorKey: "description",
            header: "Description",
            cell: ({ row }) => {
                return (
                    <p className="text-sm text-muted-foreground">{row.original.description}</p>
                );
            }
        },
        {
            accessorKey: "permissions",
            header: () => <div className="text-center">Permissions</div>,
            cell: ({ row }) => {
                const permissionCount = row.original.permissions?.length || 0;
                return (
                    <div className="text-center">
                        <Badge variant="outline" className="font-normal">
                            {permissionCount} permission{permissionCount !== 1 ? 's' : ''}
                        </Badge>
                    </div>
                );
            }
        },
        {
            id: "actions",
            header: () => <div className="text-right">Actions</div>,
            cell: ({ row }) => {
                const role = row.original;
                return (
                    <RowActions
                        onEdit={() => navigate(`/team/role/create?id=${role.id}`)}
                        onDelete={!role.isSystem ? () => handleDeleteSingle(role.id) : undefined}
                    />
                );
            },
        },
    ];

    const selectedIds = Object.keys(selectedRows);

    // Get delete confirmation message
    const getDeleteMessage = () => {
        if (roleToDelete) {
            const role = rolesData.find(r => r.id === roleToDelete);
            return {
                title: 'Delete Role',
                description: `Are you sure you want to delete ${role?.name}? This action cannot be undone.`,
            };
        }
        return {
            title: 'Delete Roles',
            description: `Are you sure you want to delete ${selectedIds.length} selected role${selectedIds.length > 1 ? 's' : ''}? This action cannot be undone.`,
        };
    };

    const deleteMessage = getDeleteMessage();

    // Bulk actions configuration
    const bulkActions: BulkAction<Role>[] = [
        {
            label: "Download CSV",
            icon: <Download size={16} />,
            onClick: (roles) => {
                const csvContent = "data:text/csv;charset=utf-8,"
                    + "Name,Description,Permissions\n"
                    + roles.map(r => `"${r.name}","${r.description || ''}",${r.permissions?.length || 0}`).join("\n");
                const encodedUri = encodeURI(csvContent);
                const link = document.createElement("a");
                link.setAttribute("href", encodedUri);
                link.setAttribute("download", `roles_report_${roles.length}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            },
            variant: "default",
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
                    <h1 className="text-2xl font-semibold text-foreground">Roles & Permissions</h1>
                    <p className="text-sm text-muted-foreground mt-1">Manage roles and what each can access</p>
                </div>
                <Button onClick={() => navigate('/team/role/create')}>
                    <Plus className="mr-2 h-4 w-4" /> Create Role
                </Button>
            </div>

            {/* Search */}
            <div className="flex items-center gap-2">
                <SearchInput
                    value={search}
                    onValueChange={handleSearchChange}
                    placeholder="Search roles..."
                />
                <AddFilterButton fields={filterFields} active={filters.filters} onSet={filters.setFilter} />
            </div>

            {/* Data Table */}
            <DataTable
                columns={columns}
                data={filteredRoles}
                isLoading={isLoading}
                toolbar={filters.activeCount > 0 ? <FilterPills controller={filters} /> : undefined}
                rowSelection={selectedRows}
                onRowSelectionChange={setSelectedRows}
                bulkActions={bulkActions}
                showPagination={true}
                totalItems={totalRoles}
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
                    if (!open) setRoleToDelete(null);
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
