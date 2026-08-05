import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePaginationState } from '@/hooks/usePaginationState';
import { useDebounce } from '@/hooks/useDebounce';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, LayoutGrid, Tag, Eye, MessageSquare, Calendar, Download, Trash2, RefreshCw, CheckCircle2, XCircle, Archive } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { TableHeader as TableHeaderComponent, RowActions } from '@/components/table';
import { DataTable, type Column, type BulkAction } from '@/components/ui/data-table';
import { useGetAdminBlogsQuery, useDeleteBlogMutation, useUpdateBlogMutation, Blog } from '@/store/api/blogApi';
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function BlogsPage() {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 400);
    const [deleteBlog] = useDeleteBlogMutation();
    const [updateBlog] = useUpdateBlogMutation();

    // Selection state
    const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>({});

    // Pagination state
    const { pageSize, pageIndex, setPageSize, setPageIndex } = usePaginationState({
        defaultPageSize: 10,
        defaultPageIndex: 0,
    });

    const { data: blogsResult, isLoading } = useGetAdminBlogsQuery({
        page: pageIndex + 1,
        perPage: pageSize,
        search: debouncedSearch || undefined,
    });
    const blogs = blogsResult?.data ?? [];
    const totalBlogs = blogsResult?.total ?? 0;

    // Reset to first page on search change
    React.useEffect(() => { setPageIndex(0); }, [debouncedSearch]);

    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [blogToDelete, setBlogToDelete] = useState<string | null>(null);

    const handleDeleteSingle = (id: string) => {
        setBlogToDelete(id);
        setDeleteConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (blogToDelete) {
            try {
                await deleteBlog(blogToDelete).unwrap();
                toast.success('Blog deleted successfully');
                setBlogToDelete(null);
                setDeleteConfirmOpen(false);
            } catch (error) {
                // Error handled by global toast
            }
        } else {
            const selectedIds = Object.keys(selectedRows);
            try {
                await Promise.all(selectedIds.map(id => deleteBlog(id).unwrap()));
                toast.success(`${selectedIds.length} blogs deleted successfully`);
                setSelectedRows({});
                setDeleteConfirmOpen(false);
            } catch (error) {
                // Error handled by global toast
            }
        }
    };

    const columns: Column<Blog>[] = [
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
            accessorKey: "title",
            header: "Blog Post",
            cell: ({ row }) => {
                const blog = row.original;
                return (
                    <div className="flex items-center gap-3 max-w-[400px]">
                        {blog.featured_image ? (
                            <img
                                src={blog.featured_image}
                                alt={blog.title}
                                className="w-12 h-12 rounded-lg object-cover bg-muted"
                            />
                        ) : (
                            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                <LayoutGrid size={20} />
                            </div>
                        )}
                        <div className="truncate">
                            <p className="font-medium text-foreground truncate">{blog.title}</p>
                            <p className="text-xs text-muted-foreground">/{blog.slug}</p>
                        </div>
                    </div>
                );
            }
        },
        {
            accessorKey: "category.name",
            header: "Category",
            cell: ({ row }) => (
                <Badge variant="outline" className="font-normal">
                    {row.original.category?.name || 'Uncategorized'}
                </Badge>
            )
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const status = row.original.status;
                const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
                    published: "default",
                    draft: "secondary",
                    archived: "outline",
                };
                return (
                    <Badge variant={variants[status]} className="capitalize">
                        {status}
                    </Badge>
                );
            }
        },
        {
            header: "Stats",
            cell: ({ row }) => (
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                        <Eye size={14} />
                        {row.original.view_count || 0}
                    </div>
                    <div className="flex items-center gap-1">
                        <MessageSquare size={14} />
                        {row.original._count?.comments || 0}
                    </div>
                </div>
            )
        },
        {
            accessorKey: "created_at",
            header: "Created",
            cell: ({ row }) => (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar size={14} />
                    {format(new Date(row.original.created_at), 'MMM dd, yyyy')}
                </div>
            )
        },
        {
            id: "actions",
            header: () => <div className="text-right">Actions</div>,
            cell: ({ row }) => (
                <div className="text-right">
                    <RowActions
                        onEdit={() => navigate(`/blog/create?id=${row.original.id}&action=edit`)}
                        onDelete={() => handleDeleteSingle(row.original.id)}
                        onView={() => window.open(`/blog/post/${row.original.slug}`, '_blank')}
                    />
                </div>
            ),
        },
    ];

    const selectedIds = Object.keys(selectedRows);

    // Bulk actions configuration
    const bulkActions: BulkAction<Blog>[] = [
        {
            label: "Update Status",
            icon: <RefreshCw size={16} />,
            variant: "default",
            options: [
                {
                    label: "Published",
                    icon: <CheckCircle2 size={14} />,
                    onClick: async (selected) => {
                        try {
                            await Promise.all(
                                selected.map(blog =>
                                    updateBlog({ id: blog.id, body: { status: 'published' } }).unwrap()
                                )
                            );
                            setSelectedRows({});
                            toast.success('Blogs published');
                        } catch (error) {
                            console.error('Failed to update status:', error);
                        }
                    }
                },
                {
                    label: "Draft",
                    icon: <XCircle size={14} />,
                    onClick: async (selected) => {
                        try {
                            await Promise.all(
                                selected.map(blog =>
                                    updateBlog({ id: blog.id, body: { status: 'draft' } }).unwrap()
                                )
                            );
                            setSelectedRows({});
                            toast.success('Blogs moved to Draft');
                        } catch (error) {
                            console.error('Failed to update status:', error);
                        }
                    }
                },
                {
                    label: "Archived",
                    icon: <Archive size={14} />,
                    onClick: async (selected) => {
                        try {
                            await Promise.all(
                                selected.map(blog =>
                                    updateBlog({ id: blog.id, body: { status: 'archived' } }).unwrap()
                                )
                            );
                            setSelectedRows({});
                            toast.success('Blogs archived');
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
            onClick: (selected) => {
                const csvContent = "data:text/csv;charset=utf-8,"
                    + "Title,Category,Status,Views,Created\n"
                    + selected.map(b => `"${b.title}","${b.category?.name || 'Uncategorized'}",${b.status},${b.view_count || 0},${format(new Date(b.created_at), 'yyyy-MM-dd')}`).join("\n");
                const encodedUri = encodeURI(csvContent);
                const link = document.createElement("a");
                link.setAttribute("href", encodedUri);
                link.setAttribute("download", `blogs_report_${selected.length}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            },
            variant: "default",
        },
        {
            label: "Delete Selected",
            icon: <Trash2 size={16} />,
            onClick: () => setDeleteConfirmOpen(true),
            variant: "destructive",
            shortcut: "d",
        },
    ];

    const getDeleteMessage = () => {
        if (blogToDelete) {
            return "Are you sure you want to delete this blog post? This action cannot be undone.";
        }
        return `Are you sure you want to delete ${selectedIds.length} selected blog post${selectedIds.length > 1 ? 's' : ''}? This action cannot be undone.`;
    };

    return (
        <div className="space-y-6 pt-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h1 className="text-2xl font-semibold text-foreground">Blog Management</h1>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={() => navigate('/blog/categories')}
                        className="gap-2"
                    >
                        <Tag size={18} />
                        Categories
                    </Button>
                    <Button
                        onClick={() => navigate('/blog/create')}
                        className="gap-2"
                    >
                        <Plus size={18} />
                        Create Blog
                    </Button>
                </div>
            </div>

            <TableHeaderComponent
                entriesPerPage={pageSize}
                onEntriesChange={setPageSize}
                searchValue={search}
                onSearchChange={setSearch}
                searchPlaceholder="Search blogs..."
                showDelete={true}
                deleteDisabled={selectedIds.length === 0}
                onDelete={() => {
                    setBlogToDelete(null);
                    setDeleteConfirmOpen(true);
                }}
            />

            <DataTable
                columns={columns}
                data={blogs}
                isLoading={isLoading}
                rowSelection={selectedRows}
                onRowSelectionChange={setSelectedRows}
                bulkActions={bulkActions}
                showPagination={true}
                totalItems={totalBlogs}
                pageSize={pageSize}
                initialPageIndex={pageIndex}
                onPageIndexChange={setPageIndex}
                onPageSizeChange={(size) => { setPageSize(size); setPageIndex(0); }}
            />

            <ConfirmationDialog
                open={deleteConfirmOpen}
                onOpenChange={setDeleteConfirmOpen}
                onConfirm={handleConfirmDelete}
                title={blogToDelete ? "Delete Blog Post" : "Delete Selected Blogs"}
                description={getDeleteMessage()}
                confirmText="Delete"
                cancelText="Cancel"
                variant="destructive"
            />
        </div>
    );
}
