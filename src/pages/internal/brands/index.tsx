import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Ban, Eye, KeyRound, Loader2, RotateCcw } from 'lucide-react';
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
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { DataTable, type Column } from '@/components/ui/data-table';
import { RowActions, TableHeader } from '@/components/table';
import { Pill } from '@/components/ui/pill';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { formatDate } from '@/utils/format';
import { useGetBrandsQuery, useRevokeLicenceMutation } from '@/store/api/brandApi';
import { ModuleStrip } from '@/components/licensing/ModuleStrip';
import { ModuleRoster } from '@/components/licensing/ModuleRoster';
import { resolveSlots, useModuleSlots, type ModuleSlot } from '@/components/licensing/modules';
import type { BrandOverview } from '@/types/owner.types';
import type { PillTone } from '@/components/ui/pill';

const NO_BRANDS: BrandOverview[] = [];

/** Statuses where the workspace is read-only. Mirrors hasActiveSubscription(). */
const REVOKED = ['cancelled', 'expired', 'halted', 'completed'];

type LicenceFilter = 'all' | 'active' | 'trial' | 'attention';

type LicenceKind = 'active' | 'trial' | 'revoked' | 'none';

function kindOf(brand: BrandOverview): LicenceKind {
    if (REVOKED.includes(brand.status)) return 'revoked';
    if (brand.status === 'trialing') return 'trial';
    if (brand.status === 'inactive') return 'none';
    return 'active';
}

function daysLeft(iso?: string | null) {
    if (!iso) return null;
    const diff = new Date(iso).getTime() - Date.now();
    return diff > 0 ? Math.ceil(diff / 86_400_000) : 0;
}

function isAttention(brand: BrandOverview) {
    const kind = kindOf(brand);
    if (kind === 'revoked' || kind === 'none') return true;
    if (kind === 'trial') {
        const left = daysLeft(brand.trialEndsAt);
        return left !== null && left <= 7;
    }
    return false;
}

function licenceCopy(kind: LicenceKind) {
    const map: Record<LicenceKind, { label: string; tone: PillTone }> = {
        active: { label: 'Active', tone: 'success' },
        trial: { label: 'On trial', tone: 'warning' },
        revoked: { label: 'Revoked', tone: 'danger' },
        none: { label: 'No licence', tone: 'neutral' },
    };
    return map[kind];
}

function initials(name: string) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function termLabel(brand: BrandOverview) {
    const kind = kindOf(brand);
    if (kind === 'none' || kind === 'revoked') return { primary: '—', hint: null as string | null, urgent: false };
    if (kind === 'trial') {
        const left = daysLeft(brand.trialEndsAt);
        if (left === null) {
            return { primary: formatDate(brand.trialEndsAt), hint: 'Trial', urgent: false };
        }
        if (left === 0) return { primary: 'Ends today', hint: 'Trial', urgent: true };
        return {
            primary: `${left} day${left === 1 ? '' : 's'} left`,
            hint: `Trial · ${formatDate(brand.trialEndsAt)}`,
            urgent: left <= 7,
        };
    }
    return {
        primary: formatDate(brand.currentPeriodEnd),
        hint: brand.currentPeriodEnd ? 'Renews' : null,
        urgent: false,
    };
}

export default function BrandsManagement() {
    const navigate = useNavigate();
    const moduleSlots = useModuleSlots();
    const { data, isLoading } = useGetBrandsQuery();
    const [revoke, { isLoading: isRevoking }] = useRevokeLicenceMutation();

    const [query, setQuery] = useState('');
    const [pageSize, setPageSize] = useState(10);
    const [filter, setFilter] = useState<LicenceFilter>('all');
    const [revoking, setRevoking] = useState<BrandOverview | null>(null);
    const [inspecting, setInspecting] = useState<BrandOverview | null>(null);
    const [reason, setReason] = useState('');

    const brands = (data ?? NO_BRANDS) as BrandOverview[];

    const stats = useMemo(() => {
        let active = 0;
        let trial = 0;
        let attention = 0;
        for (const b of brands) {
            const kind = kindOf(b);
            if (kind === 'active') active += 1;
            if (kind === 'trial') trial += 1;
            if (isAttention(b)) attention += 1;
        }
        return { total: brands.length, active, trial, attention };
    }, [brands]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return brands.filter((b) => {
            if (filter === 'active' && kindOf(b) !== 'active') return false;
            if (filter === 'trial' && kindOf(b) !== 'trial') return false;
            if (filter === 'attention' && !isAttention(b)) return false;
            if (!q) return true;
            return (
                b.name?.toLowerCase().includes(q) ||
                b.agencyName?.toLowerCase().includes(q) ||
                b.planName?.toLowerCase().includes(q)
            );
        });
    }, [brands, query, filter]);

    const inspectingSlots: ModuleSlot[] = inspecting
        ? resolveSlots(moduleSlots, inspecting.planFeatures, inspecting.customLimits)
        : [];

    const handleRevoke = async () => {
        if (!revoking) return;
        try {
            await revoke({ tenant_id: revoking.id, reason: reason.trim() || undefined }).unwrap();
            toast.success(`${revoking.name} moved to read-only`);
            setRevoking(null);
            setInspecting(null);
            setReason('');
        } catch {
            toast.error('Could not revoke the licence. Try again.');
        }
    };

    const openIssue = (brand?: BrandOverview) => {
        navigate(brand ? `/subscription/issue-licence?tenant=${brand.id}` : '/subscription/issue-licence');
    };

    const columns: Column<BrandOverview>[] = [
        {
            accessorKey: 'name',
            header: 'Brand',
            sortValue: (b) => b.name,
            cell: ({ row }) => {
                const brand = row.original;
                return (
                    <div className="flex items-center gap-3 min-w-0">
                        <span
                            className={cn(
                                'h-9 w-9 rounded-lg shrink-0 grid place-items-center text-[11px] font-semibold tracking-wide',
                                kindOf(brand) === 'revoked' || kindOf(brand) === 'none'
                                    ? 'bg-muted text-muted-foreground'
                                    : 'bg-primary/10 text-primary',
                            )}
                        >
                            {initials(brand.name)}
                        </span>
                        <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{brand.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{brand.agencyName}</p>
                        </div>
                    </div>
                );
            },
        },
        {
            id: 'licence',
            header: 'Licence',
            sortValue: (b) => b.planName ?? '',
            cell: ({ row }) => {
                const brand = row.original;
                const kind = kindOf(brand);
                const copy = licenceCopy(kind);
                const overrideCount = Object.keys(brand.customLimits ?? {}).length;
                const trial = kind === 'trial' ? daysLeft(brand.trialEndsAt) : null;

                return (
                    <div className="space-y-1.5 min-w-[11rem]">
                        <p
                            className={cn(
                                'text-sm font-medium truncate',
                                (kind === 'none' || kind === 'revoked') && 'text-muted-foreground',
                            )}
                        >
                            {kind === 'none' ? 'Unlicensed' : brand.planName || 'Untitled plan'}
                        </p>
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <Pill tone={copy.tone} size="sm" dot>
                                {copy.label}
                                {trial !== null && ` · ${trial}d`}
                            </Pill>
                            {overrideCount > 0 && (
                                <Pill tone="orange" size="sm">
                                    {overrideCount} override{overrideCount > 1 ? 's' : ''}
                                </Pill>
                            )}
                        </div>
                    </div>
                );
            },
        },
        {
            id: 'modules',
            header: 'Modules',
            cell: ({ row }) => {
                const brand = row.original;
                if (kindOf(brand) === 'none') {
                    return <span className="text-xs text-muted-foreground">No modules until licensed</span>;
                }
                return (
                    <ModuleStrip
                        variant="full"
                        slots={resolveSlots(moduleSlots, brand.planFeatures, brand.customLimits)}
                        className={cn(kindOf(brand) === 'revoked' && 'opacity-40')}
                    />
                );
            },
        },
        {
            id: 'renews',
            header: 'Term',
            sortValue: (b) => b.currentPeriodEnd ?? b.trialEndsAt ?? '',
            cell: ({ row }) => {
                const term = termLabel(row.original);
                return (
                    <div className="whitespace-nowrap">
                        <p
                            className={cn(
                                'text-sm tabular-nums',
                                term.urgent ? 'text-amber-600 dark:text-amber-400 font-medium' : 'text-foreground',
                            )}
                        >
                            {term.primary}
                        </p>
                        {term.hint && <p className="text-[11px] text-muted-foreground mt-0.5">{term.hint}</p>}
                    </div>
                );
            },
        },
        {
            id: 'actions',
            header: () => <div className="text-right">Actions</div>,
            headerClassName: 'text-right',
            className: 'text-right',
            cell: ({ row }) => {
                const brand = row.original;
                const kind = kindOf(brand);
                const licenceAction =
                    kind === 'revoked'
                        ? { label: 'Restore licence', icon: <RotateCcw className="w-4 h-4" /> }
                        : kind === 'none'
                          ? { label: 'Give a licence', icon: <KeyRound className="w-4 h-4" /> }
                          : { label: 'Change licence', icon: <KeyRound className="w-4 h-4" /> };

                return (
                    <div onClick={(e) => e.stopPropagation()}>
                        <RowActions
                            extraActions={[
                                {
                                    label: 'View licence',
                                    icon: <Eye className="w-4 h-4" />,
                                    onClick: () => setInspecting(brand),
                                },
                                {
                                    ...licenceAction,
                                    onClick: () => openIssue(brand),
                                },
                                ...(kind === 'revoked' || kind === 'none'
                                    ? []
                                    : [
                                          {
                                              label: 'Revoke licence',
                                              icon: <Ban className="w-4 h-4" />,
                                              className: 'text-destructive focus:text-destructive',
                                              onClick: () => setRevoking(brand),
                                          },
                                      ]),
                            ]}
                        />
                    </div>
                );
            },
        },
    ];

    const inspectingKind = inspecting ? kindOf(inspecting) : 'none';
    const inspectingCopy = licenceCopy(inspectingKind);
    const inspectingTerm = inspecting ? termLabel(inspecting) : null;
    const inspectingOverrides = Object.keys(inspecting?.customLimits ?? {}).length;

    return (
        <div className="space-y-6 pt-4 pb-12">
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">Brands</h1>
                    <p className="text-sm text-muted-foreground mt-1 max-w-xl">
                        Licence ledger for every tenant — what they can use, when it renews, and how to change it.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {(
                    [
                        { id: 'all', label: 'All brands', value: stats.total, hint: 'In the ledger' },
                        { id: 'active', label: 'Licensed', value: stats.active, hint: 'Paying / granted' },
                        { id: 'trial', label: 'On trial', value: stats.trial, hint: 'Clock still running' },
                        {
                            id: 'attention',
                            label: 'Needs attention',
                            value: stats.attention,
                            hint: 'Revoked, unlicensed, or trial ending',
                        },
                    ] as const
                ).map((tile) => (
                    <button
                        key={tile.id}
                        type="button"
                        onClick={() => setFilter(tile.id)}
                        className={cn(
                            'text-left rounded-xl border bg-card px-4 py-3.5 transition-colors',
                            'hover:border-primary/40 hover:bg-muted/30',
                            filter === tile.id
                                ? 'border-primary ring-1 ring-primary/30 bg-primary/[0.04]'
                                : 'border-border',
                        )}
                    >
                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{tile.label}</p>
                        <p
                            className={cn(
                                'text-2xl font-semibold tabular-nums mt-1',
                                tile.id === 'attention' && stats.attention > 0 && 'text-amber-600 dark:text-amber-400',
                                tile.id === 'active' && 'text-primary',
                            )}
                        >
                            {isLoading ? '—' : tile.value}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-1">{tile.hint}</p>
                    </button>
                ))}
            </div>

            <TableHeader
                entriesPerPage={pageSize}
                onEntriesChange={setPageSize}
                searchValue={query}
                onSearchChange={setQuery}
                searchPlaceholder="Find a brand, agency or plan"
                actionButton={{
                    label: 'Issue a licence',
                    onClick: () => openIssue(),
                    icon: <KeyRound size={16} />,
                }}
            />

            <DataTable
                columns={columns}
                data={filtered}
                isLoading={isLoading}
                pageSize={pageSize}
                showPagination
                onRowClick={setInspecting}
                rowClassName={(b) =>
                    cn((kindOf(b) === 'revoked' || kindOf(b) === 'none') && 'bg-muted/20')
                }
                emptyMessage={
                    brands.length === 0
                        ? 'No brands yet'
                        : filter !== 'all'
                          ? 'Nothing in this slice'
                          : 'No brand matches that search'
                }
                emptyDescription={
                    brands.length === 0
                        ? 'They appear here once an agency signs one up.'
                        : filter !== 'all'
                          ? 'Try another filter, or issue a licence.'
                          : 'Try a different name, agency or plan.'
                }
            />

            <Sheet open={!!inspecting} onOpenChange={(open) => !open && setInspecting(null)}>
                <SheetContent side="right" className="sm:max-w-md overflow-y-auto">
                    {inspecting && (
                        <>
                            <SheetHeader className="text-left pr-6">
                                <div className="flex items-center gap-3">
                                    <span className="h-10 w-10 rounded-lg shrink-0 grid place-items-center text-xs font-semibold bg-primary/10 text-primary">
                                        {initials(inspecting.name)}
                                    </span>
                                    <div className="min-w-0">
                                        <SheetTitle className="truncate">{inspecting.name}</SheetTitle>
                                        <SheetDescription className="truncate">
                                            {inspecting.agencyName}
                                        </SheetDescription>
                                    </div>
                                </div>
                            </SheetHeader>

                            <div className="mt-6 space-y-5">
                                <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                                                Current licence
                                            </p>
                                            <p className="text-base font-semibold mt-1 truncate">
                                                {inspectingKind === 'none'
                                                    ? 'Unlicensed'
                                                    : inspecting.planName || 'Untitled plan'}
                                            </p>
                                        </div>
                                        <Pill tone={inspectingCopy.tone} size="sm" dot>
                                            {inspectingCopy.label}
                                        </Pill>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <p className="text-[11px] text-muted-foreground">Term</p>
                                            <p className="tabular-nums mt-0.5">
                                                {inspectingTerm?.primary}
                                            </p>
                                            {inspectingTerm?.hint && (
                                                <p className="text-[11px] text-muted-foreground">
                                                    {inspectingTerm.hint}
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-[11px] text-muted-foreground">Overrides</p>
                                            <p className="mt-0.5">
                                                {inspectingOverrides === 0
                                                    ? 'Plan defaults'
                                                    : `${inspectingOverrides} custom`}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-3">
                                        Modules on this licence
                                    </p>
                                    {inspectingKind === 'none' ? (
                                        <p className="text-sm text-muted-foreground">
                                            Give this brand a licence to decide which modules they can use.
                                        </p>
                                    ) : (
                                        <ModuleRoster slots={inspectingSlots} />
                                    )}
                                </div>
                            </div>

                            <Separator className="my-6" />

                            <SheetFooter className="flex-col sm:flex-col gap-2">
                                <Button className="w-full" onClick={() => openIssue(inspecting)}>
                                    {inspectingKind === 'revoked' ? (
                                        <RotateCcw className="h-4 w-4 mr-2" />
                                    ) : (
                                        <KeyRound className="h-4 w-4 mr-2" />
                                    )}
                                    {inspectingKind === 'revoked'
                                        ? 'Restore licence'
                                        : inspectingKind === 'none'
                                          ? 'Give a licence'
                                          : 'Change licence'}
                                </Button>
                                {inspectingKind !== 'revoked' && inspectingKind !== 'none' && (
                                    <Button
                                        variant="outline"
                                        className="w-full text-destructive hover:text-destructive"
                                        onClick={() => {
                                            setRevoking(inspecting);
                                        }}
                                    >
                                        <Ban className="h-4 w-4 mr-2" />
                                        Revoke licence
                                    </Button>
                                )}
                            </SheetFooter>
                        </>
                    )}
                </SheetContent>
            </Sheet>

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
