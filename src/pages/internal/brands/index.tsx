import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Building2, KeyRound, Loader2, RotateCcw, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { DataTable, type Column } from '@/components/ui/data-table';
import { RowActions, TableHeader } from '@/components/table';
import { cn } from '@/lib/utils';
import { formatDate } from '@/utils/format';
import {
    useGetBrandsQuery,
    useRevokeLicenceMutation,
} from '@/store/api/brandApi';
import { ModuleStrip } from '@/components/licensing/ModuleStrip';
import { resolveSlots, useModuleSlots } from '@/components/licensing/modules';
import type { BrandOverview } from '@/types/owner.types';

const NO_BRANDS: BrandOverview[] = [];

/** Statuses where the workspace is read-only. Mirrors hasActiveSubscription(). */
const REVOKED = ['cancelled', 'expired', 'halted', 'completed'];

function licenceLabel(brand: BrandOverview) {
    if (REVOKED.includes(brand.status)) return 'Revoked';
    if (brand.status === 'trialing') return 'On trial';
    if (brand.status === 'active') return 'Active';
    if (brand.status === 'inactive') return 'No licence';
    return brand.status;
}

function daysLeft(iso?: string | null) {
    if (!iso) return null;
    const diff = new Date(iso).getTime() - Date.now();
    return diff > 0 ? Math.ceil(diff / 86_400_000) : 0;
}

export default function BrandsManagement() {
    const navigate = useNavigate();
    const moduleSlots = useModuleSlots();
    const { data, isLoading } = useGetBrandsQuery();
    const [revoke, { isLoading: isRevoking }] = useRevokeLicenceMutation();

    const [query, setQuery] = useState('');
    const [pageSize, setPageSize] = useState(10);
    const [revoking, setRevoking] = useState<BrandOverview | null>(null);
    const [reason, setReason] = useState('');

    const brands = (data ?? NO_BRANDS) as BrandOverview[];

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return brands;
        return brands.filter(
            (b) =>
                b.name?.toLowerCase().includes(q) ||
                b.agencyName?.toLowerCase().includes(q) ||
                b.planName?.toLowerCase().includes(q),
        );
    }, [brands, query]);

    const handleRevoke = async () => {
        if (!revoking) return;
        try {
            await revoke({ tenant_id: revoking.id, reason: reason.trim() || undefined }).unwrap();
            toast.success(`${revoking.name} moved to read-only`);
            setRevoking(null);
            setReason('');
        } catch {
            toast.error('Could not revoke the licence. Try again.');
        }
    };

    const columns: Column<BrandOverview>[] = [
        {
            accessorKey: 'name',
            header: 'Brand',
            sortValue: (b) => b.name,
            cell: ({ row }) => (
                <div className="min-w-0">
                    <p className="text-sm font-medium truncate flex items-center gap-2">
                        <Building2 size={14} className="text-muted-foreground shrink-0" />
                        {row.original.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5 pl-6">
                        {row.original.agencyName}
                    </p>
                </div>
            ),
        },
        {
            id: 'licence',
            header: 'Licence',
            sortValue: (b) => b.planName ?? '',
            cell: ({ row }) => {
                const brand = row.original;
                const unlicensed = brand.status === 'inactive';
                const revoked = REVOKED.includes(brand.status);
                const trial = brand.status === 'trialing' ? daysLeft(brand.trialEndsAt) : null;
                const overrideCount = Object.keys(brand.customLimits ?? {}).length;

                return (
                    <div className="flex items-center gap-2 flex-wrap">
                        <span
                            className={cn(
                                'text-sm truncate',
                                revoked || unlicensed ? 'text-muted-foreground' : 'text-foreground',
                            )}
                        >
                            {unlicensed ? 'No licence' : brand.planName}
                        </span>
                        <span
                            className={cn(
                                'font-mono text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap',
                                revoked && 'text-destructive bg-destructive/10',
                                brand.status === 'trialing' &&
                                    'text-[hsl(var(--brand-secondary))] bg-[hsl(var(--brand-secondary))]/10',
                                brand.status === 'active' && 'text-primary bg-primary/10',
                                unlicensed && 'text-muted-foreground bg-muted',
                            )}
                        >
                            {licenceLabel(brand)}
                            {trial !== null && ` · ${trial}d`}
                        </span>
                        {overrideCount > 0 && (
                            <span className="font-mono text-[10px] text-[hsl(var(--brand-secondary))] whitespace-nowrap">
                                {overrideCount} override{overrideCount > 1 ? 's' : ''}
                            </span>
                        )}
                    </div>
                );
            },
        },
        {
            id: 'modules',
            header: 'Modules',
            cell: ({ row }) => {
                const brand = row.original;
                if (brand.status === 'inactive') {
                    return <span className="text-xs text-muted-foreground">—</span>;
                }
                return (
                    <ModuleStrip
                        variant="full"
                        slots={resolveSlots(moduleSlots, brand.planFeatures, brand.customLimits)}
                        className={cn(REVOKED.includes(brand.status) && 'opacity-40')}
                    />
                );
            },
        },
        {
            id: 'renews',
            header: 'Renews',
            sortValue: (b) => b.currentPeriodEnd ?? b.trialEndsAt ?? '',
            cell: ({ row }) => {
                const brand = row.original;
                const trialEnd = brand.status === 'trialing' ? brand.trialEndsAt : null;
                return (
                    <span className="text-sm text-muted-foreground tabular-nums whitespace-nowrap">
                        {formatDate(trialEnd ?? brand.currentPeriodEnd)}
                        {trialEnd && <span className="text-xs"> (trial)</span>}
                    </span>
                );
            },
        },
        {
            id: 'actions',
            header: () => <div className="text-right">Actions</div>,
            cell: ({ row }) => {
                const brand = row.original;
                const revoked = REVOKED.includes(brand.status);
                const unlicensed = brand.status === 'inactive';
                const licenceAction = revoked
                    ? { label: 'Restore licence', icon: <RotateCcw className="w-4 h-4 mr-2" /> }
                    : unlicensed
                        ? { label: 'Give a licence', icon: <KeyRound className="w-4 h-4 mr-2" /> }
                        : { label: 'Change licence', icon: <KeyRound className="w-4 h-4 mr-2" /> };

                return (
                    <RowActions
                        extraActions={[
                            {
                                ...licenceAction,
                                onClick: () =>
                                    navigate(`/subscription/issue-licence?tenant=${brand.id}`),
                            },
                            ...(revoked || unlicensed
                                ? []
                                : [
                                      {
                                          label: 'Revoke licence',
                                          icon: <Ban className="w-4 h-4 mr-2" />,
                                          className: 'text-destructive focus:text-destructive',
                                          onClick: () => setRevoking(brand),
                                      },
                                  ]),
                        ]}
                    />
                );
            },
        },
    ];

    return (
        <div className="space-y-6 pt-4 pb-12">
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">Brands</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        What each brand is licensed for, and how to change it.
                    </p>
                </div>
            </div>

            <TableHeader
                entriesPerPage={pageSize}
                onEntriesChange={setPageSize}
                searchValue={query}
                onSearchChange={setQuery}
                searchPlaceholder="Find a brand, agency or plan"
                actionButton={{
                    label: 'Issue a licence',
                    onClick: () => navigate('/subscription/issue-licence'),
                    icon: <KeyRound size={16} />,
                }}
            />

            <DataTable
                columns={columns}
                data={filtered}
                isLoading={isLoading}
                pageSize={pageSize}
                showPagination
                rowClassName={(b) =>
                    cn((REVOKED.includes(b.status) || b.status === 'inactive') && 'bg-muted/30')
                }
                emptyMessage={
                    brands.length === 0 ? 'No brands yet' : 'No brand matches that search'
                }
                emptyDescription={
                    brands.length === 0
                        ? 'They appear here once an agency signs one up.'
                        : 'Try a different name, agency or plan.'
                }
            />

            <Dialog
                open={!!revoking}
                onOpenChange={(open) => {
                    if (!open) {
                        setRevoking(null);
                        setReason('');
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Revoke {revoking?.name}&rsquo;s licence?</DialogTitle>
                        <DialogDescription>
                            Their workspace becomes read-only straight away. Everything they have
                            stays readable and exportable, and nothing is deleted — you can give
                            them a licence again at any time.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-2">
                        <Label htmlFor="reason" className="text-xs">
                            Reason
                        </Label>
                        <Textarea
                            id="reason"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Kept with the brand's billing record."
                            rows={2}
                        />
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRevoking(null)}>
                            Keep the licence
                        </Button>
                        <Button variant="destructive" onClick={handleRevoke} disabled={isRevoking}>
                            {isRevoking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Revoke licence
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
