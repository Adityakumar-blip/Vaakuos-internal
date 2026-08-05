import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePaginationState } from '@/hooks/usePaginationState';
import { useSearch } from '@/hooks/useSearch';
import { unwrapPaginated } from '@/store/api/paginated';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Database, Download, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { TableHeader as TableHeaderComponent, RowActions } from '@/components/table';
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog';
import { DataTable, type Column, type BulkAction } from '@/components/ui/data-table';
import {
    useGetMastersQuery,
    useDeleteMasterMutation,
} from '@/store/api/mastersApi';
import { type PlanFeature } from './types';

const PLAN_FEATURES_URL = '/plan-features';

export default function PlanFeaturesPage() {
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

    // Fetch plan features from API
    const { data: response, isLoading } = useGetMastersQuery({
        url: PLAN_FEATURES_URL,
        params: `?page=${pageIndex + 1}&limit=${pageSize}${debouncedSearch ? `&search=${encodeURIComponent(debouncedSearch)}` : ''}`,
    });

    const { data: planFeatures, total } = useMemo(() => {
        return unwrapPaginated<PlanFeature>(response);
    }, [response]);

    // Reset to first page on search change
    useEffect(() => { setPageIndex(0); }, [debouncedSearch]);

    // Selection state
    const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>({});

    // Delete confirmation state
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [featureToDelete, setFeatureToDelete] = useState<string | null>(null);

    const [deleteFeature, { isLoading: isDeleting }] = useDeleteMasterMutation();



    const handleDeleteClick = () => {
        setDeleteConfirmOpen(true);
    };

    const handleDeleteSingle = (featureId: string) => {
        setFeatureToDelete(featureId);
        setDeleteConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        try {
            if (featureToDelete) {
                await deleteFeature({ url: PLAN_FEATURES_URL, id: featureToDelete }).unwrap();
                setFeatureToDelete(null);
            } else {
                const selectedIds = Object.keys(selectedRows);
                await Promise.all(
                    selectedIds.map((id) =>
                        deleteFeature({ url: PLAN_FEATURES_URL, id }).unwrap()
                    )
                );
                setSelectedRows({});
            }
            setDeleteConfirmOpen(false);
        } catch (error) {
            console.error('Failed to delete plan features:', error);
        }
    };


    // Define columns
    const columns: Column<PlanFeature>[] = [
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
            header: 'Feature',
            cell: ({ row }) => {
                const feature = row.original;
                return (
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-primary/10 text-primary">
                            <Database size={16} />
                        </div>
                        <div>
                            <p className="font-medium text-foreground">{feature.name}</p>
                            {feature.description && (
                                <p className="text-xs text-muted-foreground">{feature.description}</p>
                            )}
                        </div>
                    </div>
                );
            },
        },
        {
            accessorKey: 'code',
            header: 'Code',
            cell: ({ row }) => {
                return (
                    <code className="text-sm bg-muted px-2 py-1 rounded">
                        {row.original.code}
                    </code>
                );
            },
        },
        {
            accessorKey: 'type',
            header: 'Type',
            cell: ({ row }) => {
                const type = row.getValue('type') as string;
                return (
                    <Badge variant="outline" className="capitalize font-normal">
                        {type}
                    </Badge>
                );
            },
        },
        // {
        //     accessorKey: 'is_active',
        //     header: 'Status',
        //     cell: ({ row }) => {
        //         const isActive = row.getValue('is_active') as boolean;
        //         return (
        //             <Badge variant={isActive ? 'default' : 'secondary'} className="capitalize">
        //                 {isActive ? 'Active' : 'Inactive'}
        //             </Badge>
        //         );
        //     },
        // },
        {
            id: 'actions',
            header: () => <div className="text-right">Actions</div>,
            cell: ({ row }) => {
                const feature = row.original;
                return (
                    <RowActions
                        onEdit={() =>
                            navigate(`/master/plan-features/create?id=${feature.id}&action=edit`)
                        }
                        onDelete={() => handleDeleteSingle(feature.id)}
                        onView={() =>
                            navigate(`/master/plan-features/create?id=${feature.id}&action=view`)
                        }
                    />
                );
            },
        },
    ];

    const selectedIds = Object.keys(selectedRows);

    // Get delete confirmation message
    const getDeleteMessage = () => {
        if (featureToDelete) {
            const feature = planFeatures.find((f) => f.id === featureToDelete);
            return {
                title: 'Delete Plan Feature',
                description: `Are you sure you want to delete "${feature?.name}"? This action cannot be undone.`,
            };
        }
        return {
            title: 'Delete Plan Features',
            description: `Are you sure you want to delete ${selectedIds.length} selected feature${selectedIds.length > 1 ? 's' : ''
                }? This action cannot be undone.`,
        };
    };

    const deleteMessage = getDeleteMessage();

    // Bulk actions configuration
    const bulkActions: BulkAction<PlanFeature>[] = [
        {
            label: "Download CSV",
            icon: <Download size={16} />,
            onClick: (selected) => {
                const csvContent = "data:text/csv;charset=utf-8,"
                    + "Feature,Code,Type\n"
                    + selected.map(f => `"${f.name}","${f.code}",${f.type}`).join("\n");
                const encodedUri = encodeURI(csvContent);
                const link = document.createElement("a");
                link.setAttribute("href", encodedUri);
                link.setAttribute("download", `plan_features_report_${selected.length}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            },
            variant: "default",
        },
        {
            label: "Delete Selected",
            icon: <Trash2 size={16} />,
            onClick: handleDeleteClick,
            variant: "destructive",
            shortcut: "d",
        },
    ];

    return (
        <div className="space-y-6 pt-4">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">Plan Features</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Manage plan feature configurations and settings
                    </p>
                </div>
            </div>

            {/* Table Header with Search, Entries, Delete, Add */}
            <TableHeaderComponent
                entriesPerPage={pageSize}
                onEntriesChange={setPageSize}
                searchValue={search}
                onSearchChange={handleSearchChange}
                searchPlaceholder="Search plan features..."
                showDelete={true}
                deleteDisabled={selectedIds.length === 0}
                onDelete={handleDeleteClick}
                actionButton={{
                    label: 'Create Plan Feature',
                    onClick: () => navigate('/master/plan-features/create'),
                    icon: <Plus size={18} />,
                }}
            />

            {/* Data Table */}
            <DataTable
                columns={columns}
                data={planFeatures}
                isLoading={isLoading}
                rowSelection={selectedRows}
                onRowSelectionChange={setSelectedRows}
                bulkActions={bulkActions}
                showPagination={true}
                totalItems={total}
                pageSize={pageSize}
                initialPageIndex={pageIndex}
                onPageIndexChange={setPageIndex}
                onPageSizeChange={(size) => { setPageSize(size); setPageIndex(0); }}
            />

            {/* Delete Confirmation Modal */}
            <ConfirmationDialog
                open={deleteConfirmOpen}
                onOpenChange={(open) => {
                    setDeleteConfirmOpen(open);
                    if (!open) setFeatureToDelete(null);
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
