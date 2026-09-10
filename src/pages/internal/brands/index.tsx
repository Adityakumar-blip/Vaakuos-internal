import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Building2, KeyRound, Loader2, RotateCcw, Search, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { cn } from '@/lib/utils';
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

    if (isLoading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6 pt-4 pb-12">
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">Brands</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        What each brand is licensed for, and how to change it.
                    </p>
                </div>
                <Button onClick={() => navigate('/subscription/issue-licence')}>
                    <KeyRound size={16} className="mr-2" />
                    Issue a licence
                </Button>
            </div>

            <div className="relative max-w-sm">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Find a brand, agency or plan"
                    className="pl-9"
                />
            </div>

            {filtered.length === 0 ? (
                <div className="border border-dashed border-border rounded-lg py-16 text-center">
                    <p className="text-sm text-muted-foreground">
                        {brands.length === 0
                            ? 'No brands yet. They appear here once an agency signs one up.'
                            : 'No brand matches that search.'}
                    </p>
                </div>
            ) : (
                <div className="border border-border rounded-lg overflow-hidden bg-card divide-y divide-border">
                    {filtered.map((brand) => {
                        const revoked = REVOKED.includes(brand.status);
                        const unlicensed = brand.status === 'inactive';
                        const slots = resolveSlots(moduleSlots, brand.planFeatures, brand.customLimits);
                        const trial = brand.status === 'trialing' ? daysLeft(brand.trialEndsAt) : null;
                        const overrideCount = Object.keys(brand.customLimits ?? {}).length;

                        return (
                            <div
                                key={brand.id}
                                className={cn(
                                    'grid grid-cols-1 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1.6fr)_auto] gap-4 items-center px-4 py-3.5',
                                    (revoked || unlicensed) && 'bg-muted/30',
                                )}
                            >
                                <div className="min-w-0">
                                    <p className="text-sm font-medium truncate flex items-center gap-2">
                                        <Building2 size={14} className="text-muted-foreground shrink-0" />
                                        {brand.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                                        {brand.agencyName}
                                    </p>
                                </div>

                                <div className="min-w-0 space-y-1.5">
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
                                                'font-mono text-[10px] px-1.5 py-0.5 rounded',
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
                                            <span className="font-mono text-[10px] text-[hsl(var(--brand-secondary))]">
                                                {overrideCount} override{overrideCount > 1 ? 's' : ''}
                                            </span>
                                        )}
                                    </div>
                                    {!unlicensed && (
                                        <ModuleStrip
                                            slots={slots}
                                            className={cn(revoked && 'opacity-40')}
                                        />
                                    )}
                                </div>

                                <div className="flex items-center gap-2 justify-start md:justify-end">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            navigate(`/subscription/issue-licence?tenant=${brand.id}`)
                                        }
                                    >
                                        {revoked || unlicensed ? (
                                            <>
                                                <RotateCcw size={13} className="mr-1.5" />
                                                {revoked ? 'Restore' : 'Give a licence'}
                                            </>
                                        ) : (
                                            'Change licence'
                                        )}
                                    </Button>
                                    {!revoked && !unlicensed && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-muted-foreground hover:text-destructive"
                                            onClick={() => setRevoking(brand)}
                                        >
                                            <Ban size={13} className="mr-1.5" />
                                            Revoke
                                        </Button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

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
