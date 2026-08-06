import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/ui/data-table';
import { SearchInput } from '@/components/common/SearchInput';
import {
    AddFilterButton,
    FilterPills,
    useDataFilters,
    type FilterField,
} from '@/components/common/filters';
import { Building2, CircleDot, CreditCard } from 'lucide-react';
import { useSearch } from '@/hooks/useSearch';
import { usePaginationState } from '@/hooks/usePaginationState';
import { useGetBrandsQuery } from '@/store/api/brandApi';
import { formatNumber } from '@/utils/format';
import type { BrandOverview } from '@/types/owner.types';

const LOCALE = 'en-IN';

// Subscription statuses, as written by the subscriptions module.
const LIVE_STATUSES = ['active', 'trialing'];
const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    active: 'default',
    trialing: 'secondary',
    halted: 'destructive',
    cancelled: 'destructive',
    expired: 'outline',
    inactive: 'outline',
};

export default function BrandsManagement() {
    const { pageSize, pageIndex, setPageSize, setPageIndex } = usePaginationState({
        defaultPageSize: 10,
        defaultPageIndex: 0,
    });

    const { search, handleSearchChange, debouncedSearch } = useSearch({
        onSearchChange: () => setPageIndex(0),
    });

    const { data: brands = [], isLoading, error, refetch } = useGetBrandsQuery({
        search: debouncedSearch || undefined,
    });

    const filterFields: FilterField<BrandOverview>[] = useMemo(() => [
        {
            id: 'agency',
            label: 'Agency',
            icon: Building2,
            type: 'select',
            searchable: true,
            accessor: (b) => b.agencyId ?? 'direct',
            options: Array.from(
                new Map(brands.map((b) => [b.agencyId ?? 'direct', b.agencyName])).entries(),
            ).map(([value, label]) => ({ label, value })),
        },
        {
            id: 'plan',
            label: 'Plan',
            icon: CreditCard,
            type: 'select',
            searchable: true,
            accessor: (b) => b.planName,
            options: Array.from(new Set(brands.map((b) => b.planName))).map((name) => ({
                label: name,
                value: name,
            })),
        },
        {
            id: 'status',
            label: 'Status',
            icon: CircleDot,
            type: 'select',
            accessor: (b) => b.status,
            options: [
                { label: 'Active', value: 'active', dot: 'bg-emerald-500' },
                { label: 'Trialing', value: 'trialing', dot: 'bg-sky-500' },
                { label: 'Halted', value: 'halted', dot: 'bg-amber-500' },
                { label: 'Cancelled', value: 'cancelled', dot: 'bg-red-500' },
                { label: 'Inactive', value: 'inactive', dot: 'bg-zinc-400' },
            ],
        },
    ], [brands]);

    const filters = useDataFilters<BrandOverview>(filterFields);
    const filtered = useMemo(() => filters.apply(brands), [brands, filters.predicate]);

    const stats = useMemo(
        () => ({
            total: brands.length,
            live: brands.filter((b) => LIVE_STATUSES.includes(b.status)).length,
            unsubscribed: brands.filter((b) => !LIVE_STATUSES.includes(b.status)).length,
            credits: brands.reduce((sum, b) => sum + (b.creditsBalance || 0), 0),
        }),
        [brands],
    );

    const columns: Column<BrandOverview>[] = [
        {
            accessorKey: 'name',
            header: 'Brand',
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/10 text-primary">
                        <Building2 size={16} />
                    </div>
                    <div>
                        <p className="font-medium text-foreground">{row.original.name}</p>
                        <p className="text-xs text-muted-foreground">{row.original.agencyName}</p>
                    </div>
                </div>
            ),
        },
        {
            accessorKey: 'planName',
            header: 'Plan',
            cell: ({ row }) => <span className="text-sm">{row.original.planName}</span>,
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => (
                <Badge
                    variant={STATUS_VARIANT[row.original.status] ?? 'outline'}
                    className="capitalize font-normal"
                >
                    {row.original.status}
                </Badge>
            ),
        },
        {
            accessorKey: 'creditsBalance',
            header: 'Credits',
            cell: ({ row }) => (
                <span className="tabular-nums">{formatNumber(row.original.creditsBalance || 0, LOCALE)}</span>
            ),
        },
        {
            accessorKey: 'slug',
            header: 'Slug',
            cell: ({ row }) => (
                <code className="text-sm bg-muted px-2 py-1 rounded">{row.original.slug || '—'}</code>
            ),
        },
        {
            accessorKey: 'createdAt',
            header: 'Created',
            cell: ({ row }) => (
                <span className="text-sm text-muted-foreground">
                    {new Date(row.original.createdAt).toLocaleDateString()}
                </span>
            ),
        },
    ];

    return (
        <div className="space-y-6 pt-4">
            <div>
                <h1 className="text-2xl font-semibold text-foreground">Brands</h1>
                <p className="text-sm text-muted-foreground mt-1">Monitor all brands across agencies</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Total Brands" value={formatNumber(stats.total, LOCALE)} />
                <StatCard label="Active / Trialing" value={formatNumber(stats.live, LOCALE)} className="text-green-600" />
                <StatCard label="Not Subscribed" value={formatNumber(stats.unsubscribed, LOCALE)} />
                <StatCard
                    label="Credits Held"
                    value={formatNumber(stats.credits, LOCALE)}
                    icon={<CreditCard className="h-4 w-4 text-muted-foreground" />}
                />
            </div>

            {/* Search + Filters */}
            <div className="flex items-center gap-2">
                <SearchInput
                    value={search}
                    onValueChange={handleSearchChange}
                    placeholder="Search brands..."
                />
                <AddFilterButton fields={filterFields} active={filters.filters} onSet={filters.setFilter} />
            </div>

            <DataTable
                columns={columns}
                data={filtered}
                toolbar={filters.activeCount > 0 ? <FilterPills controller={filters} /> : undefined}
                isLoading={isLoading}
                error={error}
                onRetry={refetch}
                emptyMessage="No brands found"
                emptyDescription="Brands created by agencies will appear here."
                showPagination
                pageSize={pageSize}
                initialPageIndex={pageIndex}
                onPageIndexChange={setPageIndex}
                onPageSizeChange={(size) => {
                    setPageSize(size);
                    setPageIndex(0);
                }}
            />
        </div>
    );
}

function StatCard({
    label,
    value,
    className,
    icon,
}: {
    label: string;
    value: string;
    className?: string;
    icon?: React.ReactNode;
}) {
    return (
        <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                <div className={`text-2xl font-bold ${className ?? ''}`}>{value}</div>
            </CardContent>
        </Card>
    );
}
