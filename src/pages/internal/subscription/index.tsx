import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { usePaginationState } from '@/hooks/usePaginationState';
import { useSearch } from '@/hooks/useSearch';
import { unwrapPaginated } from '@/store/api/paginated';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { TableHeader as TableHeaderComponent, RowActions } from '@/components/table';
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog';
import { DataTable, type Column, type BulkAction } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
    useGetMastersQuery,
    useLazyGetMasterByIdQuery,
    useAddMasterMutation,
    useUpdateMasterMutation,
    useDeleteMasterMutation,
    usePublishMasterMutation,
} from '@/store/api/mastersApi';

import {
    Plus,
    CreditCard,
    Plug,
    Globe,
    Copy,
    Loader2,
    Download,
    Trash2,
    RefreshCw,
    CheckCircle2,
    XCircle,
    Lock,
    KeyRound
} from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency, formatPaise } from '@/utils/format';
import { ModuleStrip } from '@/components/licensing/ModuleStrip';
import { resolveSlots, useModuleSlots } from '@/components/licensing/modules';

const SUBSCRIPTIONS_URL = '/subscriptions/plans';
const ADDONS_URL = '/subscriptions/addons';

interface BaseEntity {
    id: string;
    created_at?: string;
    updated_at?: string;
}

interface Subscription extends BaseEntity {
    name: string;
    subtitle: string;
    description: string;
    amount: number;
    yearly_discount?: number;
    razorpay_monthly_plan_id?: string;
    razorpay_yearly_plan_id?: string;
    is_published?: boolean;
    features: Record<string, string | number | boolean>;
}

interface Addon extends BaseEntity {
    name: string;
    description: string;
    amount: number;
    type: 'recurring' | 'one_time';
    is_active: boolean;
}

type MasterByIdResponse<T> = T | { data: T };

type TabType = 'plans' | 'addons';

export default function SubscriptionPage() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const tabParam = searchParams.get('tab');
    const initialTab = (tabParam === 'addons' ? 'addons' : 'plans') as TabType;
    const [activeTab, setActiveTab] = useState<TabType>(initialTab);
    const [cloningId, setCloningId] = useState<string | null>(null);

    // Search state
    const { search, debouncedSearch, handleSearchChange, setSearch } = useSearch({
        onSearchChange: () => setPageIndex(0),
    });

    // Pagination state with URL persistence
    const { pageSize, pageIndex, setPageSize, setPageIndex } = usePaginationState({
        defaultPageSize: 10,
        defaultPageIndex: 0,
    });

    // Determine current API URL
    const currentUrl = activeTab === 'plans' ? SUBSCRIPTIONS_URL : ADDONS_URL;

    // Fetch data from API
    const { data: response, isLoading } = useGetMastersQuery({
        url: currentUrl,
        params: `?page=${pageIndex + 1}&limit=${pageSize}${debouncedSearch ? `&search=${encodeURIComponent(debouncedSearch)}` : ''}`,
    });

    const { data, total } = useMemo(() => {
        return unwrapPaginated<Subscription | Addon>(response);
    }, [response]);

    // Reset to first page on search or tab change
    useEffect(() => { setPageIndex(0); }, [debouncedSearch, activeTab]);

    // Selection state
    const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>({});

    // Delete confirmation state
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);

    const [deleteMaster, { isLoading: isDeleting }] = useDeleteMasterMutation();

    const handleTabChange = (tab: TabType) => {
        setActiveTab(tab);
        setSearch('');
        setPageIndex(0);
        setSelectedRows({});
        setSearchParams((prev) => {
            const newParams = new URLSearchParams(prev);
            newParams.set('tab', tab);
            return newParams;
        });
    };

    const handleDeleteClick = () => {
        setDeleteConfirmOpen(true);
    };

    const handleDeleteSingle = (id: string) => {
        setItemToDelete(id);
        setDeleteConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        try {
            if (itemToDelete) {
                await deleteMaster({ url: currentUrl, id: itemToDelete }).unwrap();
                setItemToDelete(null);
            } else {
                const selectedIds = Object.keys(selectedRows);
                await Promise.all(
                    selectedIds.map((id) =>
                        deleteMaster({ url: currentUrl, id }).unwrap()
                    )
                );
                setSelectedRows({});
            }
            setDeleteConfirmOpen(false);
        } catch (error) {
            console.error('Failed to delete items:', error);
        }
    };

    // Publish state
    const [publishConfirmOpen, setPublishConfirmOpen] = useState(false);
    const [planToPublish, setPlanToPublish] = useState<string | null>(null);
    const [publishMaster, { isLoading: isPublishing }] = usePublishMasterMutation();
    const [updateMaster] = useUpdateMasterMutation();

    const handlePublishClick = (id: string) => {
        setPlanToPublish(id);
        setPublishConfirmOpen(true);
    };

    const handleConfirmPublish = async () => {
        if (!planToPublish) return;
        try {
            await publishMaster({ url: SUBSCRIPTIONS_URL, id: planToPublish }).unwrap();
            setPublishConfirmOpen(false);
            setPlanToPublish(null);
        } catch (error) {
            console.error('Failed to publish plan:', error);
        }
    };

    // Clone functionality
    const [getMasterById] = useLazyGetMasterByIdQuery();
    const [addMaster] = useAddMasterMutation();

    const handleClone = async (id: string) => {
        setCloningId(id);
        try {
            const response = await getMasterById({ url: SUBSCRIPTIONS_URL, id }).unwrap();
            const responseData = response as MasterByIdResponse<Subscription>;
            const planData = 'data' in responseData ? responseData.data : responseData;

            // Remove fields that shouldn't be cloned
            const { id: _, created_at, updated_at, is_published, ...cloneData } = planData;

            // Modify name to indicate it's a clone
            cloneData.name = `${planData.name} (Clone)`;

            await addMaster({ url: SUBSCRIPTIONS_URL, data: cloneData }).unwrap();
            toast.success('Plan cloned successfully');
        } catch (error) {
            console.error('Failed to clone plan:', error);
            toast.error('Failed to clone plan');
        } finally {
            setCloningId(null);
        }
    };


    // Columns for Subscriptions
    const moduleSlots = useModuleSlots();

    const planColumns: Column<Subscription>[] = [
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
            header: "Plan Name",
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/10 text-primary">
                        <CreditCard size={16} />
                    </div>
                    <div>
                        <p className="font-medium text-foreground">{row.original.name}</p>
                        <p className="text-xs text-muted-foreground">{row.original.subtitle}</p>
                    </div>
                </div>
            )
        },
        {
            id: "pricing",
            header: "Pricing",
            cell: ({ row }) => {
                const monthly = row.original.amount;
                const discount = row.original.yearly_discount ?? 0;
                const yearly = Math.round(monthly * 12 * (1 - discount / 100));
                return (
                    <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium tabular-nums">
                            {formatPaise(monthly)}
                            <span className="text-muted-foreground text-xs font-normal">/mo</span>
                        </span>
                        <span className="text-xs text-muted-foreground tabular-nums">
                            {formatPaise(yearly)}/yr
                            {discount > 0 && (
                                <span className="ml-1 text-green-600 font-medium">(-{discount}%)</span>
                            )}
                        </span>
                    </div>
                );
            }
        },
        {
            id: "modules",
            header: "Modules",
            cell: ({ row }) => (
                <ModuleStrip
                    variant="full"
                    slots={resolveSlots(moduleSlots, row.original.features)}
                />
            )
        },
        {
            accessorKey: "is_published",
            header: "Availability",
            cell: ({ row }) => {
                const isPublished = row.original.is_published;
                return (
                    <div>
                        {isPublished ? (
                            <span className="inline-flex items-center gap-1.5 text-sm text-foreground">
                                <Globe size={13} className="text-primary" />
                                On pricing page
                            </span>
                        ) : (
                            <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                                    <Lock size={13} />
                                    Private
                                </span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                                    onClick={() => handlePublishClick(row.original.id)}
                                >
                                    Publish
                                </Button>
                            </div>
                        )}
                    </div>
                );
            }
        },
        {
            id: "actions",
            header: () => <div className="text-right">Actions</div>,
            cell: ({ row }) => (
                <RowActions
                    onEdit={() => navigate(`/subscription/create?id=${row.original.id}&action=edit`)}
                    onDelete={() => handleDeleteSingle(row.original.id)}
                    onView={() => navigate(`/subscription/create?id=${row.original.id}&action=view`)}
                    extraActions={[
                        {
                            label: "Clone Plan",
                            icon: (cloningId === row.original.id) ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Copy className="w-4 h-4 mr-2" />,
                            onClick: () => handleClone(row.original.id),
                        }
                    ]}
                />
            ),
        },
    ];

    // Columns for Add-ons
    const addonColumns: Column<Addon>[] = [
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
            header: "Add-on Name",
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/10 text-primary">
                        <Plug size={16} />
                    </div>
                    <div>
                        <p className="font-medium text-foreground">{row.original.name}</p>
                    </div>
                </div>
            )
        },
        {
            accessorKey: "amount",
            header: "Price",
            cell: ({ row }) => (
                <span className="font-medium">
                    {formatPaise(row.original.amount)}
                    <span className="text-xs text-muted-foreground ml-1">
                        {row.original.type === 'recurring' ? '/mo' : ''}
                    </span>
                </span>
            )
        },
        {
            accessorKey: "type",
            header: "Type",
            cell: ({ row }) => (
                <Badge variant={row.original.type === 'recurring' ? 'default' : 'secondary'} className="capitalize">
                    {row.original.type?.replace('_', ' ')}
                </Badge>
            )
        },
        {
            accessorKey: "is_active",
            header: "Status",
            cell: ({ row }) => (
                <Badge variant={row.original.is_active ? 'default' : 'destructive'}>
                    {row.original.is_active ? 'Active' : 'Inactive'}
                </Badge>
            )
        },
        {
            id: "actions",
            header: () => <div className="text-right">Actions</div>,
            cell: ({ row }) => (
                <RowActions
                    onEdit={() => navigate(`/subscription/addons/create?id=${row.original.id}&action=edit`)}
                    onDelete={() => handleDeleteSingle(row.original.id)}
                    onView={() => navigate(`/subscription/addons/create?id=${row.original.id}&action=view`)}
                />
            ),
        },
    ];

    const selectedIds = Object.keys(selectedRows);

    // Get delete confirmation message
    const getDeleteMessage = () => {
        const itemType = activeTab === 'plans' ? 'Subscription' : 'Add-on';
        if (itemToDelete) {
            const item = data.find((d: Subscription | Addon) => d.id === itemToDelete);
            return {
                title: `Delete ${itemType}`,
                description: `Are you sure you want to delete "${item?.name}"? This action cannot be undone.`,
            };
        }
        return {
            title: `Delete ${itemType}s`,
            description: `Are you sure you want to delete ${selectedIds.length} selected ${itemType.toLowerCase()}${selectedIds.length > 1 ? 's' : ''}? This action cannot be undone.`,
        };
    };

    const deleteMessage = getDeleteMessage();

    // Bulk actions for Plans
    const planBulkActions: BulkAction<Subscription>[] = [
        {
            label: "Download CSV",
            icon: <Download size={16} />,
            onClick: (plans) => {
                const csvContent = "data:text/csv;charset=utf-8,"
                    + "Name,Subtitle,Monthly Price (₹),Yearly Discount (%),Published\n"
                    + plans.map(p => `"${p.name}","${p.subtitle}",${p.amount},${p.yearly_discount ?? 0},${p.is_published ? 'Yes' : 'No'}`).join("\n");
                const encodedUri = encodeURI(csvContent);
                const link = document.createElement("a");
                link.setAttribute("href", encodedUri);
                link.setAttribute("download", `subscription_plans_report_${plans.length}.csv`);
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

    // Bulk actions for Add-ons
    const addonBulkActions: BulkAction<Addon>[] = [
        {
            label: "Update Status",
            icon: <RefreshCw size={16} />,
            variant: "default",
            options: [
                {
                    label: "Active",
                    icon: <CheckCircle2 size={14} />,
                    onClick: async (selectedAddons) => {
                        try {
                            await Promise.all(
                                selectedAddons.map(addon =>
                                    updateMaster({ url: ADDONS_URL, id: addon.id, data: { is_active: true } }).unwrap()
                                )
                            );
                            setSelectedRows({});
                            toast.success('Add-ons activated');
                        } catch (error) {
                            console.error('Failed to update status:', error);
                            toast.error('Failed to update status');
                        }
                    }
                },
                {
                    label: "Inactive",
                    icon: <XCircle size={14} />,
                    onClick: async (selectedAddons) => {
                        try {
                            await Promise.all(
                                selectedAddons.map(addon =>
                                    updateMaster({ url: ADDONS_URL, id: addon.id, data: { is_active: false } }).unwrap()
                                )
                            );
                            setSelectedRows({});
                            toast.success('Add-ons deactivated');
                        } catch (error) {
                            console.error('Failed to update status:', error);
                            toast.error('Failed to update status');
                        }
                    }
                }
            ]
        },
        {
            label: "Download CSV",
            icon: <Download size={16} />,
            onClick: (addons) => {
                const csvContent = "data:text/csv;charset=utf-8,"
                    + "Name,Price,Type,Status\n"
                    + addons.map(a => `"${a.name}",${a.amount},${a.type},${a.is_active ? 'Active' : 'Inactive'}`).join("\n");
                const encodedUri = encodeURI(csvContent);
                const link = document.createElement("a");
                link.setAttribute("href", encodedUri);
                link.setAttribute("download", `addons_report_${addons.length}.csv`);
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
                    <h1 className="text-2xl font-semibold text-foreground">Plans and licences</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Build what a plan grants, then issue it to a customer.
                    </p>
                </div>
                {activeTab === 'plans' && (
                    <Button variant="outline" onClick={() => navigate('/subscription/issue-licence')}>
                        <KeyRound size={16} className="mr-2" />
                        Issue a licence
                    </Button>
                )}
            </div>

            {/* Tabs */}
            <div className="border-b border-border">
                <div className="flex gap-4">
                    <button
                        onClick={() => handleTabChange('plans')}
                        className={cn(
                            "px-4 py-2 border-b-2 text-sm font-medium transition-colors",
                            activeTab === 'plans'
                                ? "border-primary text-primary"
                                : "border-transparent text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Plans
                    </button>
                    <button
                        onClick={() => handleTabChange('addons')}
                        className={cn(
                            "px-4 py-2 border-b-2 text-sm font-medium transition-colors",
                            activeTab === 'addons'
                                ? "border-primary text-primary"
                                : "border-transparent text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Add-ons
                    </button>
                </div>
            </div>

            {/* Table Header with Search, Entries, Delete, Add */}
            <TableHeaderComponent
                entriesPerPage={pageSize}
                onEntriesChange={setPageSize}
                searchValue={search}
                onSearchChange={handleSearchChange}
                searchPlaceholder={`Search ${activeTab === 'plans' ? 'plans' : 'add-ons'}...`}
                showDelete={true}
                deleteDisabled={selectedIds.length === 0}
                onDelete={handleDeleteClick}
                actionButton={{
                    label: `Create ${activeTab === 'plans' ? 'Plan' : 'Add-on'}`,
                    onClick: () => navigate(activeTab === 'plans' ? '/subscription/create' : '/subscription/addons/create'),
                    icon: <Plus size={18} />,
                }}
            />

            {/* Data Table */}
            <DataTable
                columns={activeTab === 'plans' ? planColumns : addonColumns}
                data={data}
                rowSelection={selectedRows}
                onRowSelectionChange={setSelectedRows}
                bulkActions={activeTab === 'plans' ? planBulkActions : addonBulkActions}
                showPagination={true}
                totalItems={total}
                pageSize={pageSize}
                initialPageIndex={pageIndex}
                onPageIndexChange={setPageIndex}
                onPageSizeChange={(size) => { setPageSize(size); setPageIndex(0); }}
                isLoading={isLoading}
            />

            {/* Delete Confirmation Modal */}
            <ConfirmationDialog
                open={deleteConfirmOpen}
                onOpenChange={(open) => {
                    setDeleteConfirmOpen(open);
                    if (!open) setItemToDelete(null);
                }}
                onConfirm={handleConfirmDelete}
                title={deleteMessage.title}
                description={deleteMessage.description}
                confirmText="Delete"
                cancelText="Cancel"
                variant="destructive"
                isLoading={isDeleting}
            />

            {/* Publish Confirmation Modal */}
            <ConfirmationDialog
                open={publishConfirmOpen}
                onOpenChange={(open) => {
                    setPublishConfirmOpen(open);
                    if (!open) setPlanToPublish(null);
                }}
                onConfirm={handleConfirmPublish}
                title="Publish Plan"
                description="Are you sure you want to publish this plan? This will make it available on external platforms (e.g. App Store, Razorpay)."
                confirmText="Publish"
                cancelText="Cancel"
                isLoading={isPublishing}
            />
        </div>
    );
}
