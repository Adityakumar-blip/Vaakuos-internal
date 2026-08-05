import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePaginationState } from '@/hooks/usePaginationState';
import { unwrapPaginated } from '@/store/api/paginated';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, FolderOpen, Download, Trash2, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { TableHeader as TableHeaderComponent, RowActions } from '@/components/table';
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog';
import { DataTable, type Column, type BulkAction } from '@/components/ui/data-table';
import {
    useGetMastersQuery,
    useUpdateMasterMutation,
    useDeleteMasterMutation,
} from '@/store/api/mastersApi';
import { type FAQCategory } from './types';

const FAQ_CATEGORIES_URL = '/faq-categories';

export default function FAQCategoriesPage() {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');

    const { pageSize, pageIndex, setPageSize, setPageIndex } = usePaginationState({
        defaultPageSize: 10,
        defaultPageIndex: 0,
    });

    const { data: response, isLoading } = useGetMastersQuery({
        url: FAQ_CATEGORIES_URL,
        params: `?page=${pageIndex + 1}&limit=${pageSize}${search ? `&search=${encodeURIComponent(search)}` : ''}`,
    });

    const { data: categories, total } = useMemo(() => {
        return unwrapPaginated<FAQCategory>(response);
    }, [response]);

    // Reset to first page on search change
    useEffect(() => { setPageIndex(0); }, [search]);

    const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>({});
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

    const [deleteCategory, { isLoading: isDeleting }] = useDeleteMasterMutation();
    const [updateMaster] = useUpdateMasterMutation();

    const handleSearchChange = (value: string) => {
        setSearch(value);
        setPageIndex(0);
    };

    const handleDeleteClick = () => {
        setDeleteConfirmOpen(true);
    };

    const handleDeleteSingle = (categoryId: string) => {
        setCategoryToDelete(categoryId);
        setDeleteConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        try {
            if (categoryToDelete) {
                await deleteCategory({ url: FAQ_CATEGORIES_URL, id: categoryToDelete }).unwrap();
                setCategoryToDelete(null);
            } else {
                const selectedIds = Object.keys(selectedRows);
                await Promise.all(
                    selectedIds.map((id) =>
                        deleteCategory({ url: FAQ_CATEGORIES_URL, id }).unwrap()
                    )
                );
                setSelectedRows({});
            }
            setDeleteConfirmOpen(false);
        } catch (error) {
            console.error('Failed to delete FAQ categories:', error);
        }
    };


    const columns: Column<FAQCategory>[] = [
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
            accessorKey: 'order',
            header: 'Order',
            cell: ({ row }) => {
                return <span className="text-sm font-medium">{row.original.order}</span>;
            },
        },
        {
            accessorKey: 'name',
            header: 'Category',
            cell: ({ row }) => {
                const category = row.original;
                return (
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-primary/10 text-primary">
                            <FolderOpen size={16} />
                        </div>
                        <div>
                            <p className="font-medium text-foreground">{category.name}</p>
                            {category.description && (
                                <p className="text-xs text-muted-foreground">{category.description}</p>
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
            accessorKey: 'is_active',
            header: 'Status',
            cell: ({ row }) => {
                const isActive = row.getValue('is_active') as boolean;
                return (
                    <Badge variant={isActive ? 'default' : 'secondary'} className="capitalize">
                        {isActive ? 'Active' : 'Inactive'}
                    </Badge>
                );
            },
        },
        {
            id: 'actions',
            header: () => <div className="text-right">Actions</div>,
            cell: ({ row }) => {
                const category = row.original;
                return (
                    <RowActions
                        onEdit={() =>
                            navigate(`/master/faq-categories/create?id=${category.id}&action=edit`)
                        }
                        onDelete={() => handleDeleteSingle(category.id)}
                        onView={() =>
                            navigate(`/master/faq-categories/create?id=${category.id}&action=view`)
                        }
                    />
                );
            },
        },
    ];

    const selectedIds = Object.keys(selectedRows);

    const getDeleteMessage = () => {
        if (categoryToDelete) {
            const category = categories.find((c) => c.id === categoryToDelete);
            return {
                title: 'Delete FAQ Category',
                description: `Are you sure you want to delete "${category?.name}"? This action cannot be undone.`,
            };
        }
        return {
            title: 'Delete FAQ Categories',
            description: `Are you sure you want to delete ${selectedIds.length} selected categor${selectedIds.length > 1 ? 'ies' : 'y'
                }? This action cannot be undone.`,
        };
    };

    const deleteMessage = getDeleteMessage();

    const bulkActions: BulkAction<FAQCategory>[] = [
        {
            label: "Update Status",
            icon: <RefreshCw size={16} />,
            variant: "default",
            options: [
                {
                    label: "Active",
                    icon: <CheckCircle2 size={14} />,
                    onClick: async (selected) => {
                        try {
                            await Promise.all(
                                selected.map(item =>
                                    updateMaster({ url: FAQ_CATEGORIES_URL, id: item.id, data: { is_active: true } }).unwrap()
                                )
                            );
                            setSelectedRows({});
                            toast.success('Categories activated');
                        } catch (error) {
                            console.error('Failed to update status:', error);
                            toast.error('Failed to update status');
                        }
                    }
                },
                {
                    label: "Inactive",
                    icon: <XCircle size={14} />,
                    onClick: async (selected) => {
                        try {
                            await Promise.all(
                                selected.map(item =>
                                    updateMaster({ url: FAQ_CATEGORIES_URL, id: item.id, data: { is_active: false } }).unwrap()
                                )
                            );
                            setSelectedRows({});
                            toast.success('Categories deactivated');
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
            onClick: (selected) => {
                const csvContent = "data:text/csv;charset=utf-8,"
                    + "Order,Category,Code,Status\n"
                    + selected.map(c => `${c.order},"${c.name}","${c.code}",${c.is_active ? 'Active' : 'Inactive'}`).join("\n");
                const encodedUri = encodeURI(csvContent);
                const link = document.createElement("a");
                link.setAttribute("href", encodedUri);
                link.setAttribute("download", `faq_categories_report_${selected.length}.csv`);
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">FAQ Categories</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Manage FAQ category classifications
                    </p>
                </div>
            </div>

            <TableHeaderComponent
                entriesPerPage={pageSize}
                onEntriesChange={setPageSize}
                searchValue={search}
                onSearchChange={handleSearchChange}
                searchPlaceholder="Search FAQ categories..."
                showDelete={true}
                deleteDisabled={selectedIds.length === 0}
                onDelete={handleDeleteClick}
                actionButton={{
                    label: 'Create FAQ Category',
                    onClick: () => navigate('/master/faq-categories/create'),
                    icon: <Plus size={18} />,
                }}
            />

            <DataTable
                columns={columns}
                data={categories}
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

            <ConfirmationDialog
                open={deleteConfirmOpen}
                onOpenChange={(open) => {
                    setDeleteConfirmOpen(open);
                    if (!open) setCategoryToDelete(null);
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
