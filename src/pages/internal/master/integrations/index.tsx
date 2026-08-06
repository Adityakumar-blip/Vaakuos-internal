import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePaginationState } from '@/hooks/usePaginationState';
import { useSearch } from '@/hooks/useSearch';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Plus, Plug, Download, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { TableHeader as TableHeaderComponent, RowActions } from '@/components/table';
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog';
import { DataTable, type Column, type BulkAction } from '@/components/ui/data-table';
import {
    useGetIntegrationsQuery,
    useDeleteIntegrationMutation,
    useToggleIntegrationMutation,
    IntegrationStatus,
    type Integration,
} from '@/store/api/integrationsApi';

const STATUS_VARIANT: Record<IntegrationStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    [IntegrationStatus.CONNECTED]: 'default',
    [IntegrationStatus.DISCONNECTED]: 'secondary',
    [IntegrationStatus.PENDING]: 'outline',
    [IntegrationStatus.ERROR]: 'destructive',
};

export default function IntegrationsPage() {
    const navigate = useNavigate();

    const { search, handleSearchChange, debouncedSearch } = useSearch({
        onSearchChange: () => setPageIndex(0),
    });

    const { pageSize, pageIndex, setPageSize, setPageIndex } = usePaginationState({
        defaultPageSize: 10,
        defaultPageIndex: 0,
    });

    const { data: integrations = [], isLoading, error, refetch } = useGetIntegrationsQuery();

    // Endpoint has no search param — filter locally.
    const filtered = useMemo(() => {
        const q = debouncedSearch.trim().toLowerCase();
        if (!q) return integrations;
        return integrations.filter(
            (i) =>
                i.name.toLowerCase().includes(q) ||
                i.provider.toLowerCase().includes(q) ||
                (i.description ?? '').toLowerCase().includes(q),
        );
    }, [integrations, debouncedSearch]);

    const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>({});
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [integrationToDelete, setIntegrationToDelete] = useState<string | null>(null);

    const [deleteIntegration, { isLoading: isDeleting }] = useDeleteIntegrationMutation();
    const [toggleIntegration] = useToggleIntegrationMutation();

    const handleDeleteClick = () => setDeleteConfirmOpen(true);

    const handleDeleteSingle = (id: string) => {
        setIntegrationToDelete(id);
        setDeleteConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        try {
            if (integrationToDelete) {
                await deleteIntegration(integrationToDelete).unwrap();
                setIntegrationToDelete(null);
                toast.success('Integration deleted successfully');
            } else {
                const selectedIds = Object.keys(selectedRows);
                await Promise.all(selectedIds.map((id) => deleteIntegration(id).unwrap()));
                setSelectedRows({});
                toast.success(`${selectedIds.length} integrations deleted successfully`);
            }
            setDeleteConfirmOpen(false);
        } catch {
            toast.error('Failed to delete integration(s)');
        }
    };

    const handleToggle = async (integration: Integration) => {
        try {
            await toggleIntegration(integration.id).unwrap();
            toast.success(`${integration.name} ${integration.is_enabled ? 'disabled' : 'enabled'}`);
        } catch {
            toast.error('Failed to update integration');
        }
    };

    const columns: Column<Integration>[] = [
        {
            id: 'select',
            header: ({ table }) => (
                <Checkbox
                    checked={
                        table.getIsAllPageRowsSelected()
                            ? true
                            : table.getIsSomePageRowsSelected()
                                ? 'indeterminate'
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
            accessorKey: 'name',
            header: 'Integration',
            cell: ({ row }) => {
                const integration = row.original;
                return (
                    <div className="flex items-center gap-3">
                        {integration.icon_url ? (
                            <img
                                src={integration.icon_url}
                                alt=""
                                className="h-9 w-9 rounded-full object-contain bg-muted p-1"
                            />
                        ) : (
                            <div className="p-2 rounded-full bg-primary/10 text-primary">
                                <Plug size={16} />
                            </div>
                        )}
                        <div>
                            <p className="font-medium text-foreground">{integration.name}</p>
                            {integration.description && (
                                <p className="text-xs text-muted-foreground line-clamp-1">
                                    {integration.description}
                                </p>
                            )}
                        </div>
                    </div>
                );
            },
        },
        {
            accessorKey: 'provider',
            header: 'Provider',
            cell: ({ row }) => (
                <code className="text-sm bg-muted px-2 py-1 rounded">{row.original.provider}</code>
            ),
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => {
                const status = row.original.status;
                return (
                    <Badge variant={STATUS_VARIANT[status] ?? 'outline'} className="capitalize font-normal">
                        {status}
                    </Badge>
                );
            },
        },
        {
            accessorKey: 'is_enabled',
            header: 'Enabled',
            cell: ({ row }) => (
                <Switch
                    checked={row.original.is_enabled}
                    onCheckedChange={() => handleToggle(row.original)}
                    aria-label="Toggle integration"
                />
            ),
        },
        {
            id: 'actions',
            header: () => <div className="text-right">Actions</div>,
            cell: ({ row }) => {
                const integration = row.original;
                return (
                    <RowActions
                        onView={() =>
                            navigate(`/master/integrations/create?id=${integration.id}&action=view`)
                        }
                        onEdit={() =>
                            navigate(`/master/integrations/create?id=${integration.id}&action=edit`)
                        }
                        onDelete={() => handleDeleteSingle(integration.id)}
                    />
                );
            },
        },
    ];

    const selectedIds = Object.keys(selectedRows);

    const deleteMessage = integrationToDelete
        ? {
            title: 'Delete Integration',
            description: `Are you sure you want to delete "${integrations.find((i) => i.id === integrationToDelete)?.name
                }"? This action cannot be undone.`,
        }
        : {
            title: 'Delete Integrations',
            description: `Are you sure you want to delete ${selectedIds.length} selected integration${selectedIds.length > 1 ? 's' : ''
                }? This action cannot be undone.`,
        };

    const bulkActions: BulkAction<Integration>[] = [
        {
            label: 'Download CSV',
            icon: <Download size={16} />,
            onClick: (selected) => {
                const csvContent =
                    'data:text/csv;charset=utf-8,' +
                    'Name,Provider,Status,Enabled\n' +
                    selected
                        .map((i) => `"${i.name}","${i.provider}",${i.status},${i.is_enabled}`)
                        .join('\n');
                const link = document.createElement('a');
                link.setAttribute('href', encodeURI(csvContent));
                link.setAttribute('download', `integrations_report_${selected.length}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            },
            variant: 'default',
        },
        {
            label: 'Delete Selected',
            icon: <Trash2 size={16} />,
            onClick: handleDeleteClick,
            variant: 'destructive',
            shortcut: 'd',
        },
    ];

    return (
        <div className="space-y-6 pt-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">Integrations</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Manage third-party integrations and their connection settings
                    </p>
                </div>
            </div>

            <TableHeaderComponent
                entriesPerPage={pageSize}
                onEntriesChange={setPageSize}
                searchValue={search}
                onSearchChange={handleSearchChange}
                searchPlaceholder="Search integrations..."
                showDelete={true}
                deleteDisabled={selectedIds.length === 0}
                onDelete={handleDeleteClick}
                actionButton={{
                    label: 'Add Integration',
                    onClick: () => navigate('/master/integrations/create'),
                    icon: <Plus size={18} />,
                }}
            />

            <DataTable
                columns={columns}
                data={filtered}
                isLoading={isLoading}
                error={error}
                onRetry={refetch}
                emptyMessage="No integrations yet"
                emptyDescription="Add an integration to make it available on the platform."
                rowSelection={selectedRows}
                onRowSelectionChange={setSelectedRows}
                bulkActions={bulkActions}
                showPagination={true}
                pageSize={pageSize}
                initialPageIndex={pageIndex}
                onPageIndexChange={setPageIndex}
                onPageSizeChange={(size) => {
                    setPageSize(size);
                    setPageIndex(0);
                }}
            />

            <ConfirmationDialog
                open={deleteConfirmOpen}
                onOpenChange={(open) => {
                    setDeleteConfirmOpen(open);
                    if (!open) setIntegrationToDelete(null);
                }}
                onConfirm={handleConfirmDelete}
                title={deleteMessage.title}
                description={deleteMessage.description}
                confirmText="Delete"
                cancelText="Cancel"
                variant="destructive"
                isLoading={isDeleting}
            />
        </div>
    );
}
