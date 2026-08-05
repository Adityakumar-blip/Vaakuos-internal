import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePaginationState } from '@/hooks/usePaginationState';
import { useDebounce } from '@/hooks/useDebounce';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Tag, Folder, Download, Trash2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { TableHeader as TableHeaderComponent, RowActions } from '@/components/table';
import { DataTable, type Column, type BulkAction } from '@/components/ui/data-table';
import { useGetCategoriesQuery, useCreateCategoryMutation, BlogCategory } from '@/store/api/blogApi';
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from 'sonner';

export default function BlogCategoriesPage() {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 400);
    const [createCategory] = useCreateCategoryMutation();

    // Selection state
    const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>({});

    // Pagination state
    const { pageSize, pageIndex, setPageSize, setPageIndex } = usePaginationState({
        defaultPageSize: 10,
        defaultPageIndex: 0,
    });

    const { data: categoriesResult, isLoading } = useGetCategoriesQuery({
        page: pageIndex + 1,
        perPage: pageSize,
        search: debouncedSearch || undefined,
    });
    const categories = categoriesResult?.data ?? [];
    const totalCategories = categoriesResult?.total ?? 0;

    // Reset to first page on search change
    React.useEffect(() => { setPageIndex(0); }, [debouncedSearch]);

    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [newCategory, setNewCategory] = useState({
        name: '',
        slug: '',
        description: '',
    });

    // Auto-generate slug from name
    const handleNameChange = (name: string) => {
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        setNewCategory({ ...newCategory, name, slug });
    };

    const handleCreateCategory = async () => {
        try {
            await createCategory(newCategory).unwrap();
            setIsCreateDialogOpen(false);
            setNewCategory({ name: '', slug: '', description: '' });
        } catch (error) {
            // Error is handled by global toast
        }
    };

    const columns: Column<BlogCategory>[] = [
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
            header: "Name",
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <Folder size={16} />
                    </div>
                    <div>
                        <p className="font-medium text-foreground">{row.original.name}</p>
                        <p className="text-xs text-muted-foreground">{row.original.slug}</p>
                    </div>
                </div>
            )
        },
        {
            accessorKey: "description",
            header: "Description",
            cell: ({ row }) => (
                <p className="text-sm text-muted-foreground line-clamp-1 max-w-[300px]">
                    {row.original.description || '-'}
                </p>
            )
        },
        {
            accessorKey: "_count.blogs",
            header: "Blogs Count",
            cell: ({ row }) => (
                <Badge variant="secondary">
                    {row.original._count?.blogs || 0}
                </Badge>
            )
        },
        {
            id: "actions",
            header: () => <div className="text-right">Actions</div>,
            cell: ({ row }) => (
                <div className="text-right">
                    <RowActions
                        onEdit={() => {
                            // Implement edit if needed
                            toast.info("Edit category coming soon");
                        }}
                        onDelete={() => {
                            // Implement delete if needed
                            toast.info("Delete category coming soon");
                        }}
                    />
                </div>
            ),
        },
    ];

    const selectedIds = Object.keys(selectedRows);

    // Bulk actions configuration
    const bulkActions: BulkAction<BlogCategory>[] = [
        {
            label: "Download CSV",
            icon: <Download size={16} />,
            onClick: (selected) => {
                const csvContent = "data:text/csv;charset=utf-8,"
                    + "Name,Slug,Blogs Count\n"
                    + selected.map(c => `"${c.name}",${c.slug},${c._count?.blogs || 0}`).join("\n");
                const encodedUri = encodeURI(csvContent);
                const link = document.createElement("a");
                link.setAttribute("href", encodedUri);
                link.setAttribute("download", `blog_categories_report_${selected.length}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            },
            variant: "default",
        },
        {
            label: "Delete Selected",
            icon: <Trash2 size={16} />,
            onClick: (selected) => {
                // Implement delete if needed
                console.log('Deleting categories:', selected.map(c => c.name));
                toast.info(`${selected.length} categories delete coming soon`);
                setSelectedRows({});
            },
            variant: "destructive",
            shortcut: "d",
        },
    ];

    return (
        <div className="space-y-6 pt-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate('/blog')}
                    >
                        <Tag size={20} />
                    </Button>
                    <h1 className="text-2xl font-semibold text-foreground">Blog Categories</h1>
                </div>
            </div>

            <TableHeaderComponent
                entriesPerPage={pageSize}
                onEntriesChange={setPageSize}
                searchValue={search}
                onSearchChange={setSearch}
                searchPlaceholder="Search categories..."
                showDelete={true}
                deleteDisabled={selectedIds.length === 0}
                onDelete={() => {
                    console.log('Deleting categories:', selectedIds);
                    toast.info(`${selectedIds.length} categories delete coming soon`);
                    setSelectedRows({});
                }}
                actionButton={{
                    label: 'Add Category',
                    onClick: () => setIsCreateDialogOpen(true),
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
                totalItems={totalCategories}
                pageSize={pageSize}
                initialPageIndex={pageIndex}
                onPageIndexChange={setPageIndex}
                onPageSizeChange={(size) => { setPageSize(size); setPageIndex(0); }}
            />

            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Category</DialogTitle>
                        <DialogDescription>
                            Add a new category to organize your blog posts.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                value={newCategory.name}
                                onChange={(e) => handleNameChange(e.target.value)}
                                placeholder="e.g. Technology"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="slug">Slug</Label>
                            <Input
                                id="slug"
                                value={newCategory.slug}
                                onChange={(e) => setNewCategory({ ...newCategory, slug: e.target.value })}
                                placeholder="e.g. technology"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="description">Description (Optional)</Label>
                            <Textarea
                                id="description"
                                value={newCategory.description}
                                onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                                placeholder="Describe this category"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreateCategory} disabled={!newCategory.name || !newCategory.slug}>
                            Create Category
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
