import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePaginationState } from '@/hooks/usePaginationState';
import { useDebounce } from '@/hooks/useDebounce';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Tag, Download, Trash2, RefreshCw, CheckCircle2, XCircle, CircleDot } from 'lucide-react';
import { toast } from 'sonner';
import { TableHeader as TableHeaderComponent, RowActions } from '@/components/table';
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog';
import { DataTable, type Column, type BulkAction } from '@/components/ui/data-table';
import { useGetOffersQuery, useDeleteOfferMutation, useUpdateOfferMutation, type Offer } from '@/store/api/offerApi';
import { format } from 'date-fns';
import { AddFilterButton, FilterPills, useDataFilters, type FilterField } from '@/components/common/filters';

export default function OfferPage() {
    const navigate = useNavigate();

    // Search state
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 400);

    // Selection state
    const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>({});

    // Delete confirmation state
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [offerToDelete, setOfferToDelete] = useState<string | null>(null);

    // Pagination state with URL persistence
    const { pageSize, pageIndex, setPageSize, setPageIndex } = usePaginationState({
        defaultPageSize: 10,
        defaultPageIndex: 0,
    });

    // Filter fields — status forwarded to server
    const filterFields: FilterField<Offer>[] = useMemo(() => [
        {
            id: 'status',
            label: 'Status',
            icon: CircleDot,
            type: 'select',
            accessor: (o) => o.status,
            options: [
                { label: 'Active', value: 'active', dot: 'bg-emerald-500' },
                { label: 'Inactive', value: 'inactive', dot: 'bg-zinc-400' },
                { label: 'Scheduled', value: 'scheduled', dot: 'bg-blue-500' },
            ],
        },
    ], []);

    const filters = useDataFilters<Offer>(filterFields);
    const statusParam = filters.filters.find((f) => f.fieldId === 'status')?.values[0] || undefined;

    // API Hooks — server handles search, pagination, and status filter
    const { data: result, isLoading, isFetching } = useGetOffersQuery({
        page: pageIndex + 1,
        perPage: pageSize,
        search: debouncedSearch || undefined,
        status: statusParam,
    });
    const offers = result?.data ?? [];
    const totalItems = result?.total ?? 0;

    const [deleteOffer] = useDeleteOfferMutation();
    const [updateOffer] = useUpdateOfferMutation();

    // Reset to first page when search or filters change
    useEffect(() => { setPageIndex(0); }, [debouncedSearch, statusParam]);

    const handleSearchChange = (value: string) => {
        setSearch(value);
    };

    const handleDeleteClick = () => {
        setDeleteConfirmOpen(true);
    };

    const handleDeleteSingle = (offerId: string) => {
        setOfferToDelete(offerId);
        setDeleteConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        try {
            if (offerToDelete) {
                await deleteOffer(offerToDelete).unwrap();
                toast.success('Offer deleted successfully');
                setOfferToDelete(null);
            } else {
                const selectedIds = Object.keys(selectedRows);
                await Promise.all(selectedIds.map(id => deleteOffer(id).unwrap()));
                toast.success(`${selectedIds.length} offers deleted successfully`);
                setSelectedRows({});
            }
        } catch (error) {
            toast.error('Failed to delete offer(s)');
        } finally {
            setDeleteConfirmOpen(false);
        }
    };

    // Define columns
    const columns: Column<Offer>[] = [
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
            header: "Offer Name",
            cell: ({ row }) => {
                const offer = row.original;
                return (
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-primary/10 text-primary">
                            <Tag size={16} />
                        </div>
                        <span className="font-medium">{offer.name}</span>
                    </div>
                );
            }
        },
        {
            accessorKey: "type",
            header: "Type",
            cell: ({ row }) => {
                const type = row.original.type;
                return (
                    <Badge variant="outline" className="capitalize">
                        {type.replace('_', ' ')}
                    </Badge>
                );
            }
        },
        {
            accessorKey: "starts_at",
            header: "Starts",
            cell: ({ row }) => {
                const date = row.original.starts_at;
                return date ? format(new Date(date), 'MMM dd, yyyy') : <span className="text-muted-foreground">-</span>;
            }
        },
        {
            accessorKey: "expires_at",
            header: "Ends",
            cell: ({ row }) => {
                const date = row.original.expires_at;
                return date ? format(new Date(date), 'MMM dd, yyyy') : <span className="text-muted-foreground">Never</span>;
            }
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const status = row.original.status;
                const variant = status === 'active' ? 'default' : status === 'scheduled' ? 'secondary' : 'outline';
                return (
                    <Badge variant={variant} className="capitalize">
                        {status}
                    </Badge>
                );
            }
        },
        {
            id: "actions",
            header: () => <div className="text-right">Actions</div>,
            cell: ({ row }) => {
                const offer = row.original;
                return (
                    <RowActions
                        onEdit={() => navigate(`/offer/create?id=${offer.id}&action=edit`)}
                        onDelete={() => handleDeleteSingle(offer.id)}
                        onView={() => navigate(`/offer/create?id=${offer.id}&action=view`)}
                    />
                );
            },
        },
    ];

    const selectedIds = Object.keys(selectedRows);

    // Get delete confirmation message
    const getDeleteMessage = () => {
        if (offerToDelete) {
            const offer = offers.find(o => o.id === offerToDelete);
            return {
                title: 'Delete Offer',
                description: `Are you sure you want to delete offer "${offer?.name}"? This action cannot be undone.`,
            };
        }
        return {
            title: 'Delete Offers',
            description: `Are you sure you want to delete ${selectedIds.length} selected offer${selectedIds.length > 1 ? 's' : ''}? This action cannot be undone.`,
        };
    };

    const deleteMessage = getDeleteMessage();

    // Bulk actions configuration
    const bulkActions: BulkAction<Offer>[] = [
        {
            label: "Update Status",
            icon: <RefreshCw size={16} />,
            variant: "default",
            options: [
                {
                    label: "Active",
                    icon: <CheckCircle2 size={14} />,
                    onClick: async (selectedOffers) => {
                        try {
                            await Promise.all(selectedOffers.map(o =>
                                updateOffer({ id: o.id, body: { status: 'active' } }).unwrap()
                            ));
                            setSelectedRows({});
                            toast.success(`${selectedOffers.length} offers activated`);
                        } catch (error) {
                            toast.error('Failed to activate offers');
                        }
                    }
                },
                {
                    label: "Inactive",
                    icon: <XCircle size={14} />,
                    onClick: async (selectedOffers) => {
                        try {
                            await Promise.all(selectedOffers.map(o =>
                                updateOffer({ id: o.id, body: { status: 'inactive' } }).unwrap()
                            ));
                            setSelectedRows({});
                            toast.success(`${selectedOffers.length} offers deactivated`);
                        } catch (error) {
                            toast.error('Failed to deactivate offers');
                        }
                    }
                }
            ]
        },
        {
            label: "Download CSV",
            icon: <Download size={16} />,
            onClick: (items) => {
                const csvContent = "data:text/csv;charset=utf-8,"
                    + "Name,Type,Status,Starts At,Expires At\n"
                    + items.map(o => `"${o.name}",${o.type},${o.status},${o.starts_at || 'Now'},${o.expires_at || 'Never'}`).join("\n");
                const encodedUri = encodeURI(csvContent);
                const link = document.createElement("a");
                link.setAttribute("href", encodedUri);
                link.setAttribute("download", `offers_report_${items.length}.csv`);
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
                    <h1 className="text-2xl font-semibold text-foreground">Offer Management</h1>
                    <p className="text-sm text-muted-foreground mt-1">Manage marketing offers, BOGO deals and seasonal promotions.</p>
                </div>
            </div>

            {/* Table Header with Search, Entries, Delete, Add */}
            <TableHeaderComponent
                entriesPerPage={pageSize}
                onEntriesChange={(s) => { setPageSize(s); setPageIndex(0); }}
                searchValue={search}
                onSearchChange={handleSearchChange}
                searchPlaceholder="Search offers..."
                showDelete={true}
                deleteDisabled={selectedIds.length === 0}
                onDelete={handleDeleteClick}
                actionButton={{
                    label: 'Create Offer',
                    onClick: () => navigate('/offer/create'),
                    icon: <Plus size={18} />,
                }}
            />

            {/* Filter pills */}
            {filters.activeCount > 0 && (
                <div className="flex items-center gap-2">
                    <AddFilterButton fields={filterFields} active={filters.filters} onSet={filters.setFilter} />
                    <FilterPills controller={filters} />
                </div>
            )}

            {/* Data Table */}
            <DataTable
                columns={columns}
                data={offers}
                rowSelection={selectedRows}
                onRowSelectionChange={setSelectedRows}
                bulkActions={bulkActions}
                showPagination={true}
                totalItems={totalItems}
                pageSize={pageSize}
                initialPageIndex={pageIndex}
                onPageIndexChange={setPageIndex}
                onPageSizeChange={(s) => { setPageSize(s); setPageIndex(0); }}
                isLoading={isLoading || isFetching}
            />

            {/* Delete Confirmation Modal */}
            <ConfirmationDialog
                open={deleteConfirmOpen}
                onOpenChange={(open) => {
                    setDeleteConfirmOpen(open);
                    if (!open) setOfferToDelete(null);
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
