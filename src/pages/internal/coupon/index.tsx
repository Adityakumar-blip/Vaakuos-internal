import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePaginationState } from '@/hooks/usePaginationState';
import { useDebounce } from '@/hooks/useDebounce';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Ticket, Download, Trash2, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { TableHeader as TableHeaderComponent, RowActions } from '@/components/table';
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog';
import { DataTable, type Column, type BulkAction } from '@/components/ui/data-table';
import { useGetCouponsQuery, useDeleteCouponMutation, useUpdateCouponMutation, type Coupon } from '@/store/api/couponApi';
import { format } from 'date-fns';
import { AddFilterButton, FilterPills, useDataFilters, type FilterField } from '@/components/common/filters';
import { CircleDot } from 'lucide-react';

export default function CouponPage() {
    const navigate = useNavigate();

    // Search state
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 400);

    // Selection state
    const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>({});

    // Delete confirmation state
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [couponToDelete, setCouponToDelete] = useState<string | null>(null);

    // Pagination state with URL persistence
    const { pageSize, pageIndex, setPageSize, setPageIndex } = usePaginationState({
        defaultPageSize: 10,
        defaultPageIndex: 0,
    });

    // Filter fields — status forwarded to server
    const filterFields: FilterField<Coupon>[] = useMemo(() => [
        {
            id: 'status',
            label: 'Status',
            icon: CircleDot,
            type: 'select',
            accessor: (c) => (c.is_active ? 'active' : 'inactive'),
            options: [
                { label: 'Active', value: 'active', dot: 'bg-emerald-500' },
                { label: 'Inactive', value: 'inactive', dot: 'bg-zinc-400' },
            ],
        },
    ], []);

    const filters = useDataFilters<Coupon>(filterFields);
    const statusParam = filters.filters.find((f) => f.fieldId === 'status')?.values[0] || undefined;

    // API Hooks — server handles search, pagination, and status filter
    const { data: result, isLoading, isFetching } = useGetCouponsQuery({
        page: pageIndex + 1,
        perPage: pageSize,
        search: debouncedSearch || undefined,
        status: statusParam,
    });
    const coupons = result?.data ?? [];
    const totalItems = result?.total ?? 0;

    const [deleteCoupon] = useDeleteCouponMutation();
    const [updateCoupon] = useUpdateCouponMutation();

    // Reset to first page when search or filters change
    useEffect(() => { setPageIndex(0); }, [debouncedSearch, statusParam]);

    const handleSearchChange = (value: string) => {
        setSearch(value);
    };

    const handleDeleteClick = () => {
        setDeleteConfirmOpen(true);
    };

    const handleDeleteSingle = (couponId: string) => {
        setCouponToDelete(couponId);
        setDeleteConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        try {
            if (couponToDelete) {
                await deleteCoupon(couponToDelete).unwrap();
                toast.success('Coupon deleted successfully');
                setCouponToDelete(null);
            } else {
                const selectedIds = Object.keys(selectedRows);
                await Promise.all(selectedIds.map(id => deleteCoupon(id).unwrap()));
                toast.success(`${selectedIds.length} coupons deleted successfully`);
                setSelectedRows({});
            }
        } catch (error) {
            toast.error('Failed to delete coupon(s)');
        } finally {
            setDeleteConfirmOpen(false);
        }
    };

    // Define columns
    const columns: Column<Coupon>[] = [
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
            accessorKey: "code",
            header: "Coupon Code",
            cell: ({ row }) => {
                const coupon = row.original;
                return (
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-primary/10 text-primary">
                            <Ticket size={16} />
                        </div>
                        <span className="font-medium font-mono">{coupon.code}</span>
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
            accessorKey: "value",
            header: "Value",
            cell: ({ row }) => {
                const coupon = row.original;
                return (
                    <span className="font-medium">
                        {coupon.type === 'percentage' ? `${coupon.value}%` : `₹${coupon.value}`}
                    </span>
                );
            }
        },
        {
            accessorKey: "usage",
            header: "Usage",
            cell: ({ row }) => {
                const coupon = row.original;
                if (!coupon.usage_limit) return <span className="text-muted-foreground">Unlimited</span>;

                const percentage = (coupon.usage_count / coupon.usage_limit) * 100;
                return (
                    <div className="space-y-1 min-w-[100px]">
                        <div className="flex items-center gap-2 text-sm">
                            <span>{coupon.usage_count} / {coupon.usage_limit}</span>
                            <span className="text-muted-foreground text-[10px]">({percentage.toFixed(0)}%)</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1.5">
                            <div
                                className="bg-primary h-1.5 rounded-full transition-all"
                                style={{ width: `${Math.min(percentage, 100)}%` }}
                            />
                        </div>
                    </div>
                );
            }
        },
        {
            accessorKey: "expires_at",
            header: "Expiry",
            cell: ({ row }) => {
                const date = row.original.expires_at;
                return date ? format(new Date(date), 'MMM dd, yyyy') : <span className="text-muted-foreground">Never</span>;
            }
        },
        {
            accessorKey: "is_active",
            header: "Status",
            cell: ({ row }) => {
                const isActive = row.original.is_active;
                return (
                    <Badge variant={isActive ? 'default' : 'secondary'}>
                        {isActive ? 'Active' : 'Inactive'}
                    </Badge>
                );
            }
        },
        {
            id: "actions",
            header: () => <div className="text-right">Actions</div>,
            cell: ({ row }) => {
                const coupon = row.original;
                return (
                    <RowActions
                        onEdit={() => navigate(`/coupon/create?id=${coupon.id}&action=edit`)}
                        onDelete={() => handleDeleteSingle(coupon.id)}
                        onView={() => navigate(`/coupon/create?id=${coupon.id}&action=view`)}
                    />
                );
            },
        },
    ];

    const selectedIds = Object.keys(selectedRows);

    // Get delete confirmation message
    const getDeleteMessage = () => {
        if (couponToDelete) {
            const coupon = coupons.find(c => c.id === couponToDelete);
            return {
                title: 'Delete Coupon',
                description: `Are you sure you want to delete coupon ${coupon?.code}? This action cannot be undone.`,
            };
        }
        return {
            title: 'Delete Coupons',
            description: `Are you sure you want to delete ${selectedIds.length} selected coupon${selectedIds.length > 1 ? 's' : ''}? This action cannot be undone.`,
        };
    };

    const deleteMessage = getDeleteMessage();

    // Bulk actions configuration
    const bulkActions: BulkAction<Coupon>[] = [
        {
            label: "Update Status",
            icon: <RefreshCw size={16} />,
            variant: "default",
            options: [
                {
                    label: "Active",
                    icon: <CheckCircle2 size={14} />,
                    onClick: async (selectedCoupons) => {
                        try {
                            await Promise.all(selectedCoupons.map(c =>
                                updateCoupon({ id: c.id, body: { is_active: true } }).unwrap()
                            ));
                            setSelectedRows({});
                            toast.success(`${selectedCoupons.length} coupons activated`);
                        } catch (error) {
                            toast.error('Failed to activate coupons');
                        }
                    }
                },
                {
                    label: "Inactive",
                    icon: <XCircle size={14} />,
                    onClick: async (selectedCoupons) => {
                        try {
                            await Promise.all(selectedCoupons.map(c =>
                                updateCoupon({ id: c.id, body: { is_active: false } }).unwrap()
                            ));
                            setSelectedRows({});
                            toast.success(`${selectedCoupons.length} coupons deactivated`);
                        } catch (error) {
                            toast.error('Failed to deactivate coupons');
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
                    + "Code,Type,Value,Usage Limit,Used Count,Status,Expires At\n"
                    + items.map(c => `${c.code},${c.type},${c.value},${c.usage_limit || 'Unlimited'},${c.usage_count},${c.is_active ? 'Active' : 'Inactive'},${c.expires_at || 'Never'}`).join("\n");
                const encodedUri = encodeURI(csvContent);
                const link = document.createElement("a");
                link.setAttribute("href", encodedUri);
                link.setAttribute("download", `coupons_report_${items.length}.csv`);
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
                    <h1 className="text-2xl font-semibold text-foreground">Coupon Management</h1>
                    <p className="text-sm text-muted-foreground mt-1">Manage promotional codes and discounts for your platform.</p>
                </div>
            </div>

            {/* Table Header with Search, Entries, Delete, Add */}
            <TableHeaderComponent
                entriesPerPage={pageSize}
                onEntriesChange={(s) => { setPageSize(s); setPageIndex(0); }}
                searchValue={search}
                onSearchChange={handleSearchChange}
                searchPlaceholder="Search coupons..."
                showDelete={true}
                deleteDisabled={selectedIds.length === 0}
                onDelete={handleDeleteClick}
                actionButton={{
                    label: 'Create Coupon',
                    onClick: () => navigate('/coupon/create'),
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
                data={coupons}
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
                    if (!open) setCouponToDelete(null);
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
