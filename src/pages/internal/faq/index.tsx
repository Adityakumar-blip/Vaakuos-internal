import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePaginationState } from '@/hooks/usePaginationState';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, HelpCircle, Download, Trash2, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { TableHeader as TableHeaderComponent, RowActions } from '@/components/table';
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog';
import { DataTable, type Column, type BulkAction } from '@/components/ui/data-table';

interface FAQ {
    id: string;
    question: string;
    answer: string;
    category: string;
    status: 'published' | 'draft';
    order: number;
}

// Mock data
const faqsData: FAQ[] = [
    {
        id: '1',
        question: 'How do I create a new subscription?',
        answer: 'Navigate to Subscription menu and click Create Subscription button.',
        category: 'Subscriptions',
        status: 'published',
        order: 1,
    },
    {
        id: '2',
        question: 'How do I manage user roles?',
        answer: 'Go to Team > Roles to create and manage user roles and permissions.',
        category: 'Users',
        status: 'published',
        order: 2,
    },
];

export default function FAQPage() {
    const navigate = useNavigate();

    // Search state
    const [search, setSearch] = useState('');

    // Selection state
    const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>({});

    // Delete confirmation state
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [faqToDelete, setFaqToDelete] = useState<string | null>(null);

    // Pagination state with URL persistence
    const { pageSize, pageIndex, setPageSize, setPageIndex } = usePaginationState({
        defaultPageSize: 10,
        defaultPageIndex: 0,
    });

    const handleSearchChange = (value: string) => {
        setSearch(value);
    };

    const handleDeleteClick = () => {
        setDeleteConfirmOpen(true);
    };

    const handleDeleteSingle = (faqId: string) => {
        setFaqToDelete(faqId);
        setDeleteConfirmOpen(true);
    };

    const handleConfirmDelete = () => {
        if (faqToDelete) {
            console.log('Deleting FAQ:', faqToDelete);
            setFaqToDelete(null);
        } else {
            console.log('Deleting FAQs:', Object.keys(selectedRows));
            setSelectedRows({});
        }
        setDeleteConfirmOpen(false);
    };

    // Filter FAQs based on search
    const filteredFAQs = useMemo(() => {
        return faqsData.filter(
            (faq) => faq.question.toLowerCase().includes(search.toLowerCase()) ||
                faq.answer.toLowerCase().includes(search.toLowerCase()) ||
                faq.category.toLowerCase().includes(search.toLowerCase())
        );
    }, [search]);

    // Define columns
    const columns: Column<FAQ>[] = [
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
            accessorKey: "order",
            header: "Order",
            cell: ({ row }) => {
                return (
                    <span className="text-sm font-medium">{row.original.order}</span>
                );
            }
        },
        {
            accessorKey: "question",
            header: "Question",
            cell: ({ row }) => {
                const faq = row.original;
                return (
                    <div className="flex items-start gap-3 max-w-md">
                        <div className="p-2 rounded-full bg-primary/10 text-primary flex-shrink-0">
                            <HelpCircle size={16} />
                        </div>
                        <div>
                            <p className="font-medium text-foreground">{faq.question}</p>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{faq.answer}</p>
                        </div>
                    </div>
                );
            }
        },
        {
            accessorKey: "category",
            header: "Category",
            cell: ({ row }) => {
                return (
                    <Badge variant="outline" className="font-normal">
                        {row.original.category}
                    </Badge>
                );
            }
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const status = row.getValue("status") as string;
                return (
                    <Badge variant={status === 'published' ? 'default' : 'secondary'} className="capitalize">
                        {status}
                    </Badge>
                );
            }
        },
        {
            id: "actions",
            header: () => <div className="text-right">Actions</div>,
            cell: ({ row }) => {
                const faq = row.original;
                return (
                    <RowActions
                        onEdit={() => navigate(`/faq/create?id=${faq.id}&action=edit`)}
                        onDelete={() => handleDeleteSingle(faq.id)}
                        onView={() => navigate(`/faq/create?id=${faq.id}&action=view`)}
                    />
                );
            },
        },
    ];

    const selectedIds = Object.keys(selectedRows);

    // Get delete confirmation message
    const getDeleteMessage = () => {
        if (faqToDelete) {
            const faq = faqsData.find(f => f.id === faqToDelete);
            return {
                title: 'Delete FAQ',
                description: `Are you sure you want to delete "${faq?.question}"? This action cannot be undone.`,
            };
        }
        return {
            title: 'Delete FAQs',
            description: `Are you sure you want to delete ${selectedIds.length} selected FAQ${selectedIds.length > 1 ? 's' : ''}? This action cannot be undone.`,
        };
    };

    const deleteMessage = getDeleteMessage();

    // Bulk actions configuration
    const bulkActions: BulkAction<FAQ>[] = [
        {
            label: "Update Status",
            icon: <RefreshCw size={16} />,
            variant: "default",
            options: [
                {
                    label: "Published",
                    icon: <CheckCircle2 size={14} />,
                    onClick: (selectedFaqs) => {
                        // In a real app, this would be an API call
                        console.log('Publishing FAQs:', selectedFaqs.map(f => f.question));
                        setSelectedRows({});
                        toast.success(`${selectedFaqs.length} FAQs published`);
                    }
                },
                {
                    label: "Draft",
                    icon: <XCircle size={14} />,
                    onClick: (selectedFaqs) => {
                        // In a real app, this would be an API call
                        console.log('Moving FAQs to Draft:', selectedFaqs.map(f => f.question));
                        setSelectedRows({});
                        toast.success(`${selectedFaqs.length} FAQs moved to Draft`);
                    }
                }
            ]
        },
        {
            label: "Download CSV",
            icon: <Download size={16} />,
            onClick: (faqs) => {
                const csvContent = "data:text/csv;charset=utf-8,"
                    + "Order,Question,Category,Status\n"
                    + faqs.map(f => `${f.order},"${f.question}","${f.category}",${f.status}`).join("\n");
                const encodedUri = encodeURI(csvContent);
                const link = document.createElement("a");
                link.setAttribute("href", encodedUri);
                link.setAttribute("download", `faqs_report_${faqs.length}.csv`);
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
                    <h1 className="text-2xl font-semibold text-foreground">FAQ Management</h1>
                </div>
            </div>

            {/* Table Header with Search, Entries, Delete, Add */}
            <TableHeaderComponent
                entriesPerPage={pageSize}
                onEntriesChange={setPageSize}
                searchValue={search}
                onSearchChange={handleSearchChange}
                searchPlaceholder="Search FAQs..."
                showDelete={true}
                deleteDisabled={selectedIds.length === 0}
                onDelete={handleDeleteClick}
                actionButton={{
                    label: 'Create FAQ',
                    onClick: () => navigate('/faq/create'),
                    icon: <Plus size={18} />,
                }}
            />

            {/* Data Table */}
            <DataTable
                columns={columns}
                data={filteredFAQs}
                rowSelection={selectedRows}
                onRowSelectionChange={setSelectedRows}
                bulkActions={bulkActions}
                showPagination={true}
                pageSize={pageSize}
                initialPageIndex={pageIndex}
                onPageIndexChange={setPageIndex}
            />

            {/* Delete Confirmation Modal */}
            <ConfirmationDialog
                open={deleteConfirmOpen}
                onOpenChange={(open) => {
                    setDeleteConfirmOpen(open);
                    if (!open) setFaqToDelete(null);
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
