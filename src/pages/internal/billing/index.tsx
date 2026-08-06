import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { DataTable, type Column } from '@/components/ui/data-table';
import { SearchInput } from '@/components/common/SearchInput';
import {
    AddFilterButton,
    FilterPills,
    useDataFilters,
    type FilterField,
} from '@/components/common/filters';
import {
    ArrowDownRight,
    ArrowUpRight,
    Building2,
    CircleDot,
    CreditCard,
    Download,
    FileText,
    IndianRupee,
} from 'lucide-react';
import { useSearch } from '@/hooks/useSearch';
import { usePaginationState } from '@/hooks/usePaginationState';
import {
    useGetBrandBillingQuery,
    useGetFinanceStatsQuery,
    useGetOwnerInvoicesQuery,
    type BrandBilling,
} from '@/store/api/financeApi';
import { formatCurrency, formatNumber } from '@/utils/format';

const LOCALE = 'en-IN';

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    paid: 'default',
    pending: 'secondary',
    failed: 'destructive',
    void: 'outline',
};

export default function OwnerBilling() {
    const [openBrand, setOpenBrand] = useState<BrandBilling | null>(null);

    const { pageSize, pageIndex, setPageSize, setPageIndex } = usePaginationState({
        defaultPageSize: 10,
        defaultPageIndex: 0,
    });

    const { search, handleSearchChange, debouncedSearch } = useSearch({
        onSearchChange: () => setPageIndex(0),
    });

    const { data: stats, isLoading: statsLoading } = useGetFinanceStatsQuery();
    const { data: billing, isLoading, error, refetch } = useGetBrandBillingQuery({
        search: debouncedSearch || undefined,
    });

    const currency = billing?.currency || stats?.totalRevenue.currency || 'INR';
    const money = (value: number) => formatCurrency(value, currency, LOCALE);

    const brands = useMemo(() => billing?.brands ?? [], [billing]);

    const filterFields: FilterField<BrandBilling>[] = useMemo(() => [
        {
            id: 'agency',
            label: 'Agency',
            icon: Building2,
            type: 'select',
            searchable: true,
            accessor: (r) => r.agencyId ?? 'direct',
            options: Array.from(
                new Map(brands.map((b) => [b.agencyId ?? 'direct', b.agencyName])).entries(),
            ).map(([value, label]) => ({ label, value })),
        },
        {
            id: 'billing',
            label: 'Billing',
            icon: CircleDot,
            type: 'select',
            accessor: (r) => (r.outstanding > 0 ? 'outstanding' : r.invoiceCount ? 'settled' : 'none'),
            options: [
                { label: 'Outstanding', value: 'outstanding', dot: 'bg-red-500' },
                { label: 'Settled', value: 'settled', dot: 'bg-emerald-500' },
                { label: 'Not billed', value: 'none', dot: 'bg-zinc-400' },
            ],
        },
    ], [brands]);

    const filters = useDataFilters<BrandBilling>(filterFields);
    const visibleRows = useMemo(() => filters.apply(brands), [brands, filters.predicate]);

    // Server totals cover every brand; recompute when a filter narrows the set.
    const totals = useMemo(() => {
        if (filters.activeCount === 0 && billing) return billing.totals;
        return visibleRows.reduce(
            (acc, r) => ({
                billed: acc.billed + r.billed,
                collected: acc.collected + r.collected,
                outstanding: acc.outstanding + r.outstanding,
                brands: acc.brands + 1,
            }),
            { billed: 0, collected: 0, outstanding: 0, brands: 0 },
        );
    }, [billing, visibleRows, filters.activeCount]);

    const summary = [
        {
            label: 'Revenue This Month',
            icon: IndianRupee,
            value: statsLoading ? '—' : money(stats?.totalRevenue.value || 0),
            growth: stats?.totalRevenue.growth,
        },
        {
            label: 'Collected',
            icon: IndianRupee,
            value: money(totals.collected),
        },
        {
            label: 'Outstanding',
            icon: FileText,
            value: money(totals.outstanding),
            className: totals.outstanding > 0 ? 'text-red-600' : undefined,
        },
        {
            label: 'Active Subscriptions',
            icon: CreditCard,
            value: statsLoading ? '—' : formatNumber(stats?.activeSubscriptions.value || 0, LOCALE),
            growth: stats?.activeSubscriptions.growth,
        },
    ];

    const columns: Column<BrandBilling>[] = [
        {
            accessorKey: 'brandName',
            header: 'Brand',
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/10 text-primary">
                        <Building2 size={16} />
                    </div>
                    <div>
                        <p className="font-medium text-foreground">{row.original.brandName}</p>
                        <p className="text-xs text-muted-foreground">{row.original.agencyName}</p>
                    </div>
                </div>
            ),
        },
        {
            accessorKey: 'planName',
            header: 'Plan',
            cell: ({ row }) => (
                <div className="space-y-1">
                    <p className="text-sm">{row.original.planName}</p>
                    <Badge variant="outline" className="capitalize font-normal">
                        {row.original.subscriptionStatus}
                    </Badge>
                </div>
            ),
        },
        {
            accessorKey: 'invoiceCount',
            header: 'Invoices',
            cell: ({ row }) => <span className="tabular-nums">{row.original.invoiceCount}</span>,
        },
        {
            accessorKey: 'billed',
            header: 'Billed',
            cell: ({ row }) => <span className="tabular-nums">{money(row.original.billed)}</span>,
        },
        {
            accessorKey: 'collected',
            header: 'Collected',
            cell: ({ row }) => (
                <span className="tabular-nums text-green-600">{money(row.original.collected)}</span>
            ),
        },
        {
            accessorKey: 'outstanding',
            header: 'Outstanding',
            cell: ({ row }) => (
                <span className={`tabular-nums ${row.original.outstanding > 0 ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                    {money(row.original.outstanding)}
                </span>
            ),
        },
        {
            accessorKey: 'lastInvoiceAt',
            header: 'Last Invoice',
            cell: ({ row }) => (
                <span className="text-sm text-muted-foreground">
                    {row.original.lastInvoiceAt
                        ? new Date(row.original.lastInvoiceAt).toLocaleDateString()
                        : '—'}
                </span>
            ),
        },
        {
            id: 'actions',
            header: () => <div className="text-right">Actions</div>,
            enableSorting: false,
            cell: ({ row }) => (
                <div className="flex justify-end">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={row.original.invoiceCount === 0}
                        onClick={() => setOpenBrand(row.original)}
                    >
                        View invoices
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6 pt-4">
            <div>
                <h1 className="text-2xl font-semibold text-foreground">Billing &amp; Finance</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Revenue and invoices per brand across all agencies.
                </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {summary.map(({ label, icon: Icon, value, growth, className }) => (
                    <Card key={label}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{label}</CardTitle>
                            <Icon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold ${className ?? ''}`}>{value}</div>
                            {growth !== undefined && <GrowthNote growth={growth} />}
                        </CardContent>
                    </Card>
                ))}
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

            <p className="text-sm text-muted-foreground">
                {formatNumber(totals.brands, LOCALE)} brands · Billed{' '}
                <span className="font-medium text-foreground">{money(totals.billed)}</span> · Collected{' '}
                <span className="font-medium text-green-600">{money(totals.collected)}</span> · Outstanding{' '}
                <span className={`font-medium ${totals.outstanding > 0 ? 'text-red-600' : 'text-foreground'}`}>
                    {money(totals.outstanding)}
                </span>
            </p>

            <DataTable
                columns={columns}
                data={visibleRows}
                toolbar={filters.activeCount > 0 ? <FilterPills controller={filters} /> : undefined}
                isLoading={isLoading}
                error={error}
                onRetry={refetch}
                emptyMessage="No brands found"
                emptyDescription="Brands billed through the platform will appear here."
                showPagination
                pageSize={pageSize}
                initialPageIndex={pageIndex}
                onPageIndexChange={setPageIndex}
                onPageSizeChange={(size) => {
                    setPageSize(size);
                    setPageIndex(0);
                }}
            />

            <BrandInvoicesSheet brand={openBrand} currency={currency} onClose={() => setOpenBrand(null)} />
        </div>
    );
}

function BrandInvoicesSheet({
    brand,
    currency,
    onClose,
}: {
    brand: BrandBilling | null;
    currency: string;
    onClose: () => void;
}) {
    const { data, isLoading } = useGetOwnerInvoicesQuery(
        { brandId: brand?.brandId, perPage: 100 },
        { skip: !brand },
    );
    const invoices = data?.data ?? [];

    return (
        <Sheet open={!!brand} onOpenChange={(open) => !open && onClose()}>
            <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>{brand?.brandName}</SheetTitle>
                    <SheetDescription>
                        {brand?.agencyName} · Billed{' '}
                        {formatCurrency(brand?.billed || 0, currency, LOCALE)} · Outstanding{' '}
                        {formatCurrency(brand?.outstanding || 0, currency, LOCALE)}
                    </SheetDescription>
                </SheetHeader>

                <Table className="mt-6">
                    <TableHeader>
                        <TableRow>
                            <TableHead>Invoice</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Due</TableHead>
                            <TableHead className="text-right">PDF</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-muted-foreground">
                                    Loading invoices…
                                </TableCell>
                            </TableRow>
                        )}
                        {invoices.map((invoice) => (
                            <TableRow key={invoice.id}>
                                <TableCell>
                                    <p className="font-mono text-sm">{invoice.invoice_number}</p>
                                    {invoice.plan_name && (
                                        <p className="text-xs text-muted-foreground">{invoice.plan_name}</p>
                                    )}
                                </TableCell>
                                <TableCell className="tabular-nums">
                                    {formatCurrency(invoice.amount, invoice.currency || currency, LOCALE)}
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        variant={STATUS_VARIANT[invoice.status?.toLowerCase()] ?? 'outline'}
                                        className="capitalize font-normal"
                                    >
                                        {invoice.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                    {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : '—'}
                                </TableCell>
                                <TableCell className="text-right">
                                    {invoice.pdf_url ? (
                                        <Button variant="ghost" size="icon" asChild>
                                            <a
                                                href={invoice.pdf_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                aria-label="Download invoice PDF"
                                            >
                                                <Download className="h-4 w-4" />
                                            </a>
                                        </Button>
                                    ) : (
                                        <span className="text-muted-foreground">—</span>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </SheetContent>
        </Sheet>
    );
}

function GrowthNote({ growth }: { growth: number }) {
    const up = growth >= 0;
    return (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
            <span className={`flex items-center ${up ? 'text-green-600' : 'text-red-600'}`}>
                {up ? '+' : ''}{Math.round(growth)}%
                {up ? <ArrowUpRight className="h-3 w-3 ml-0.5" /> : <ArrowDownRight className="h-3 w-3 ml-0.5" />}
            </span>
            from last month
        </p>
    );
}
