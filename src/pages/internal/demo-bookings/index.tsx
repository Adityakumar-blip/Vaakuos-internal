import React, { useMemo, useState } from 'react';
import { usePaginationState } from '@/hooks/usePaginationState';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { CircleDot } from 'lucide-react';
import { ShowEntriesSelect } from '@/components/table';
import { DataTable, type Column } from '@/components/ui/data-table';
import {
    useGetDemoBookingsQuery,
    useUpdateDemoBookingStatusMutation,
    type DemoBooking,
    type DemoBookingStatus,
} from '@/store/api/demoBookingsApi';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { AddFilterButton, FilterPills, useDataFilters, type FilterField } from '@/components/common/filters';

const STATUS_OPTIONS: { value: DemoBookingStatus; label: string }[] = [
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
];

const STATUS_VARIANT: Record<DemoBookingStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
    pending: 'secondary',
    confirmed: 'default',
    completed: 'outline',
    cancelled: 'destructive',
};

export default function DemoBookingsPage() {
    const { pageSize, pageIndex, setPageSize, setPageIndex } = usePaginationState({
        defaultPageSize: 10,
        defaultPageIndex: 0,
    });

    const filterFields: FilterField<DemoBooking>[] = useMemo(() => [
        {
            id: 'status',
            label: 'Status',
            icon: CircleDot,
            type: 'select',
            accessor: (b) => b.status,
            options: [
                { label: 'Pending', value: 'pending', dot: 'bg-amber-500' },
                { label: 'Confirmed', value: 'confirmed', dot: 'bg-emerald-500' },
                { label: 'Completed', value: 'completed', dot: 'bg-blue-500' },
                { label: 'Cancelled', value: 'cancelled', dot: 'bg-red-500' },
            ],
        },
    ], []);

    const filters = useDataFilters<DemoBooking>(filterFields);
    const statusParam = filters.filters.find((f) => f.fieldId === 'status')?.values[0] as DemoBookingStatus | undefined;

    const { data: result, isLoading, isFetching } = useGetDemoBookingsQuery({
        page: pageIndex + 1,
        perPage: pageSize,
        status: statusParam,
    });
    const bookings = result?.data ?? [];
    const totalItems = result?.total ?? 0;

    const [updateStatus] = useUpdateDemoBookingStatusMutation();

    React.useEffect(() => { setPageIndex(0); }, [statusParam]);

    const handleStatusChange = async (id: string, status: DemoBookingStatus) => {
        try {
            await updateStatus({ id, status }).unwrap();
            toast.success('Status updated');
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const columns: Column<DemoBooking>[] = [
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
            accessorKey: 'order_volume',
            header: 'Order Volume',
            cell: ({ row }) => <Badge variant="outline" className="font-normal">{row.original.order_volume}</Badge>,
        },
        {
            accessorKey: 'selected_date',
            header: 'Requested Slot',
            cell: ({ row }) => {
                const { selected_date, selected_time } = row.original;
                return (
                    <div className="text-sm">
                        <p className="text-foreground">{selected_date ? format(new Date(selected_date), 'MMM dd, yyyy') : '-'}</p>
                        <p className="text-xs text-muted-foreground">{selected_time || '-'}</p>
                    </div>
                );
            },
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => {
                const booking = row.original;
                return (
                    <Select value={booking.status} onValueChange={(value) => handleStatusChange(booking.id, value as DemoBookingStatus)}>
                        <SelectTrigger className="h-8 w-[140px]">
                            <SelectValue>
                                <Badge variant={STATUS_VARIANT[booking.status]} className="capitalize">
                                    {booking.status}
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
            header: 'Booked At',
            cell: ({ row }) => (
                <span className="text-sm text-muted-foreground">{format(new Date(row.original.created_at), 'MMM dd, yyyy')}</span>
            ),
        },
    ];

    return (
        <div className="space-y-6 pt-4">
            <div>
                <h1 className="text-2xl font-semibold text-foreground">Demo Bookings</h1>
                <p className="text-sm text-muted-foreground mt-1">Demo requests booked through the website.</p>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <ShowEntriesSelect value={pageSize} onChange={(s) => { setPageSize(s); setPageIndex(0); }} />
                <div className="flex items-center gap-2">
                    <AddFilterButton fields={filterFields} active={filters.filters} onSet={filters.setFilter} />
                    {filters.activeCount > 0 && <FilterPills controller={filters} />}
                </div>
            </div>

            <DataTable
                columns={columns}
                data={bookings}
                isLoading={isLoading || isFetching}
                showPagination={true}
                totalItems={totalItems}
                pageSize={pageSize}
                initialPageIndex={pageIndex}
                onPageIndexChange={setPageIndex}
                onPageSizeChange={(size) => { setPageSize(size); setPageIndex(0); }}
                emptyMessage="No demo bookings yet"
                emptyDescription="Demo requests booked through the website will show up here."
            />
        </div>
    );
}
