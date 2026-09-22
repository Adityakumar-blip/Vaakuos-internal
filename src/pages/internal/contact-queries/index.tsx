import React, { useMemo, useState } from 'react';
import { usePaginationState } from '@/hooks/usePaginationState';
import { useDebounce } from '@/hooks/useDebounce';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { CircleDot, Eye } from 'lucide-react';
import { TableHeader as TableHeaderComponent } from '@/components/table';
import { DataTable, type Column } from '@/components/ui/data-table';
import {
    useGetContactQueriesQuery,
    useUpdateContactQueryStatusMutation,
    type ContactQuery,
    type ContactQueryStatus,
} from '@/store/api/contactQueriesApi';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { AddFilterButton, FilterPills, useDataFilters, type FilterField } from '@/components/common/filters';

const STATUS_OPTIONS: { value: ContactQueryStatus; label: string }[] = [
    { value: 'new', label: 'New' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'closed', label: 'Closed' },
];

const STATUS_VARIANT: Record<ContactQueryStatus, 'default' | 'secondary' | 'outline'> = {
    new: 'default',
    in_progress: 'secondary',
    closed: 'outline',
};

export default function ContactQueriesPage() {
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 400);
    const [viewQuery, setViewQuery] = useState<ContactQuery | null>(null);

    const { pageSize, pageIndex, setPageSize, setPageIndex } = usePaginationState({
        defaultPageSize: 10,
        defaultPageIndex: 0,
    });

    const filterFields: FilterField<ContactQuery>[] = useMemo(() => [
        {
            id: 'status',
            label: 'Status',
            icon: CircleDot,
            type: 'select',
            accessor: (q) => q.status,
            options: [
                { label: 'New', value: 'new', dot: 'bg-blue-500' },
                { label: 'In Progress', value: 'in_progress', dot: 'bg-amber-500' },
                { label: 'Closed', value: 'closed', dot: 'bg-zinc-400' },
            ],
        },
    ], []);

    const filters = useDataFilters<ContactQuery>(filterFields);
    const statusParam = filters.filters.find((f) => f.fieldId === 'status')?.values[0] as ContactQueryStatus | undefined;

    const { data: result, isLoading, isFetching } = useGetContactQueriesQuery({
        page: pageIndex + 1,
        perPage: pageSize,
        search: debouncedSearch || undefined,
        status: statusParam,
    });
    const queries = result?.data ?? [];
    const totalItems = result?.total ?? 0;

    const [updateStatus] = useUpdateContactQueryStatusMutation();

    React.useEffect(() => { setPageIndex(0); }, [debouncedSearch, statusParam]);

    const handleStatusChange = async (id: string, status: ContactQueryStatus) => {
        try {
            await updateStatus({ id, status }).unwrap();
            toast.success('Status updated');
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const columns: Column<ContactQuery>[] = [
        {
            accessorKey: 'first_name',
            header: 'Name',
            cell: ({ row }) => (
                <div>
                    <p className="font-medium text-foreground">{row.original.first_name} {row.original.last_name}</p>
                    <p className="text-xs text-muted-foreground">{row.original.email}</p>
                </div>
            ),
        },
        {
            accessorKey: 'company',
            header: 'Company',
            cell: ({ row }) => row.original.company || <span className="text-muted-foreground">-</span>,
        },
        {
            accessorKey: 'intent',
            header: 'Intent',
            cell: ({ row }) => row.original.intent ? (
                <Badge variant="outline" className="font-normal capitalize">{row.original.intent}</Badge>
            ) : <span className="text-muted-foreground">-</span>,
        },
        {
            accessorKey: 'message',
            header: 'Message',
            cell: ({ row }) => (
                <div className="flex items-center gap-2 max-w-[280px]">
                    <p className="truncate text-sm text-muted-foreground">{row.original.message}</p>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0 text-muted-foreground hover:text-primary"
                        onClick={() => setViewQuery(row.original)}
                    >
                        <Eye size={14} />
                    </Button>
                </div>
            ),
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => {
                const query = row.original;
                return (
                    <Select value={query.status} onValueChange={(value) => handleStatusChange(query.id, value as ContactQueryStatus)}>
                        <SelectTrigger className="h-8 w-[140px]">
                            <SelectValue>
                                <Badge variant={STATUS_VARIANT[query.status]} className="capitalize">
                                    {query.status.replace('_', ' ')}
                                </Badge>
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            {STATUS_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                );
            },
        },
        {
            accessorKey: 'created_at',
            header: 'Received',
            cell: ({ row }) => (
                <span className="text-sm text-muted-foreground">{format(new Date(row.original.created_at), 'MMM dd, yyyy')}</span>
            ),
        },
    ];

    return (
        <div className="space-y-6 pt-4">
            <div>
                <h1 className="text-2xl font-semibold text-foreground">Contact Queries</h1>
                <p className="text-sm text-muted-foreground mt-1">Messages submitted through the website contact form.</p>
            </div>

            <TableHeaderComponent
                entriesPerPage={pageSize}
                onEntriesChange={(s) => { setPageSize(s); setPageIndex(0); }}
                searchValue={search}
                onSearchChange={setSearch}
                searchPlaceholder="Search by name or email..."
            />

            <div className="flex items-center gap-2">
                <AddFilterButton fields={filterFields} active={filters.filters} onSet={filters.setFilter} />
                {filters.activeCount > 0 && <FilterPills controller={filters} />}
            </div>

            <DataTable
                columns={columns}
                data={queries}
                isLoading={isLoading || isFetching}
                showPagination={true}
                totalItems={totalItems}
                pageSize={pageSize}
                initialPageIndex={pageIndex}
                onPageIndexChange={setPageIndex}
                onPageSizeChange={(size) => { setPageSize(size); setPageIndex(0); }}
                emptyMessage="No contact queries yet"
                emptyDescription="Submissions from the website contact form will show up here."
            />

            <Dialog open={!!viewQuery} onOpenChange={(open) => !open && setViewQuery(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{viewQuery?.first_name} {viewQuery?.last_name}</DialogTitle>
                        <DialogDescription>{viewQuery?.email}{viewQuery?.company ? ` · ${viewQuery.company}` : ''}</DialogDescription>
                    </DialogHeader>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{viewQuery?.message}</p>
                </DialogContent>
            </Dialog>
        </div>
    );
}
