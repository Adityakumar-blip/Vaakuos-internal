import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Check, Globe, Loader2, Lock, Plus, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useGetMastersQuery } from '@/store/api/mastersApi';
import { useGetBrandsQuery, useAssignLicenceMutation } from '@/store/api/brandApi';
import { ModuleStrip } from '@/components/licensing/ModuleStrip';
import { modulesUnset, resolveSlots, useModuleSlots } from '@/components/licensing/modules';
import { formatPaise } from '@/utils/format';

const PLANS_URL = '/subscriptions/plans';
const FEATURES_DROPDOWN_URL = '/plan-features/features-dropdown';
const UNLIMITED = -1;

interface Plan {
    id: string;
    name: string;
    amount: number;
    is_published?: boolean;
    is_active?: boolean;
    features?: Record<string, string | number | boolean>;
}

interface FeatureOption {
    id: string;
    name: string;
    code: string;
    type: 'string' | 'number' | 'boolean';
    module_key?: string | null;
}

interface Tenant {
    id: string;
    name: string;
    status?: string;
    planName?: string;
}

const NO_TENANTS: Tenant[] = [];
const nf = new Intl.NumberFormat('en-IN');

const singular = (word: string) =>
    word.endsWith('ies') ? `${word.slice(0, -3)}y` : word.replace(/s$/, '');

function unwrap<T>(data: unknown): T[] {
    if (Array.isArray(data)) return data as T[];
    const inner = (data as { data?: unknown })?.data;
    if (Array.isArray(inner)) return inner as T[];
    const nested = (inner as { data?: unknown })?.data;
    return Array.isArray(nested) ? (nested as T[]) : [];
}

/**
 * The headline numbers a licence carries. Until modules are set on a plan these
 * limits are the only thing that actually separates one licence from another,
 * so the list would be unreadable without them.
 */
function limitSummary(plan: Plan, features: FeatureOption[]): string[] {
    return features
        .filter((f) => f.type === 'number' && !f.code.startsWith('module.'))
        .map((f) => {
            const raw = plan.features?.[f.code];
            if (typeof raw !== 'number') return null;
            const noun = f.name.replace(/^(max|monthly)\s+/i, '').toLowerCase();
            if (raw === UNLIMITED) return `Unlimited ${noun}`;
            return `${nf.format(raw)} ${raw === 1 ? singular(noun) : noun}`;
        })
        .filter(Boolean)
        .slice(0, 3) as string[];
}

export default function IssueLicencePage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const moduleSlots = useModuleSlots();

    // Arriving from a brand row means the tenant is already decided.
    const [tenantId, setTenantId] = useState(searchParams.get('tenant') ?? '');
    const [picking, setPicking] = useState(!searchParams.get('tenant'));
    const [tenantQuery, setTenantQuery] = useState('');
    const [planId, setPlanId] = useState('');
    const [overrides, setOverrides] = useState<Record<string, string | boolean>>({});
    const [note, setNote] = useState('');

    const { data: brandsData, isLoading: loadingTenants } = useGetBrandsQuery();
    const { data: plansData } = useGetMastersQuery({ url: PLANS_URL, params: '?limit=100' });
    const { data: featuresData } = useGetMastersQuery({ url: FEATURES_DROPDOWN_URL });
    const [assign, { isLoading: isIssuing }] = useAssignLicenceMutation();

    const tenants = (brandsData ?? NO_TENANTS) as unknown as Tenant[];
    const plans = unwrap<Plan>(plansData).filter((p) => p.is_active !== false);
    const features = unwrap<FeatureOption>(featuresData);

    const filteredTenants = useMemo(() => {
        const q = tenantQuery.trim().toLowerCase();
        if (!q) return tenants;
        return tenants.filter((t) => t.name?.toLowerCase().includes(q));
    }, [tenants, tenantQuery]);

    const tenant = tenants.find((t) => t.id === tenantId);
    const plan = plans.find((p) => p.id === planId);
    const currentPlan = plans.find((p) => p.name === tenant?.planName);

    const before = resolveSlots(moduleSlots, currentPlan?.features);
    const after = resolveSlots(moduleSlots, plan?.features, overrides);
    const gained = after.filter((s, i) => s.granted && !before[i]?.granted);
    const lost = after.filter((s, i) => !s.granted && before[i]?.granted);
    const bothUnset = modulesUnset(before) && modulesUnset(after);

    const overrideEntries = Object.entries(overrides);
    const availableOverrides = features.filter((f) => overrides[f.code] === undefined);

    const addOverride = (code: string) => {
        const def = features.find((f) => f.code === code);
        if (!def) return;
        setOverrides((prev) => ({ ...prev, [code]: def.type === 'boolean' ? true : '' }));
    };

    const removeOverride = (code: string) =>
        setOverrides((prev) => {
            const next = { ...prev };
            delete next[code];
            return next;
        });

    const handleIssue = async () => {
        if (!tenantId || !planId) return;
        const custom: Record<string, number | boolean | string> = {};
        overrideEntries.forEach(([code, raw]) => {
            const def = features.find((f) => f.code === code);
            if (!def) return;
            if (def.type === 'boolean') {
                custom[code] = !!raw;
                return;
            }
            if (String(raw).trim() === '') return;
            custom[code] = def.type === 'number' ? Number(raw) : String(raw);
        });

        try {
            await assign({
                tenant_id: tenantId,
                plan_id: planId,
                custom_limits: custom,
                note: note.trim() || undefined,
            }).unwrap();
            toast.success(`${plan?.name} issued to ${tenant?.name}`);
            navigate('/brands');
        } catch {
            toast.error('Could not issue the licence. Check the overrides and try again.');
        }
    };

    return (
        <div className="space-y-5 pt-4 pb-12 max-w-6xl">
            <div className="flex items-start gap-3">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                    <ArrowLeft size={20} />
                </Button>
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">Issue a licence</h1>
                    <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                        Grant a plan to one tenant straight away. Private licences never appear on
                        the pricing page, so this is the only way they reach a customer.
                    </p>
                </div>
            </div>

            {/* Who — a bar, not a column: once the tenant is chosen it is one line of fact. */}
            <section className="bg-card border border-border rounded-lg">
                {tenant && !picking ? (
                    <div className="flex items-center gap-3 px-4 py-3">
                        <span className="text-xs text-muted-foreground w-14 shrink-0">Tenant</span>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{tenant.name}</p>
                            <p className="text-xs text-muted-foreground font-mono truncate">
                                {tenant.planName || 'no plan'} · {tenant.status || 'inactive'}
                            </p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setPicking(true)}>
                            Change
                        </Button>
                    </div>
                ) : (
                    <div className="p-4 space-y-3">
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-muted-foreground w-14 shrink-0">Tenant</span>
                            <div className="relative flex-1">
                                <Search
                                    size={14}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                                />
                                <Input
                                    autoFocus
                                    value={tenantQuery}
                                    onChange={(e) => setTenantQuery(e.target.value)}
                                    placeholder="Find a tenant by name"
                                    className="pl-9"
                                />
                            </div>
                        </div>

                        {loadingTenants ? (
                            <div className="flex justify-center py-6">
                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                            </div>
                        ) : filteredTenants.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-6 text-center">
                                No tenant matches that name.
                            </p>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-56 overflow-y-auto">
                                {filteredTenants.map((t) => (
                                    <button
                                        key={t.id}
                                        type="button"
                                        onClick={() => {
                                            setTenantId(t.id);
                                            setPicking(false);
                                        }}
                                        className={cn(
                                            'text-left px-3 py-2 rounded-md border transition-colors',
                                            tenantId === t.id
                                                ? 'border-primary bg-primary/10'
                                                : 'border-border hover:bg-muted',
                                        )}
                                    >
                                        <p className="text-sm truncate">{t.name}</p>
                                        <p className="text-xs text-muted-foreground font-mono truncate">
                                            {t.planName || 'no plan'} · {t.status || 'inactive'}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-4 items-start">
                {/* What */}
                <section className="bg-card border border-border rounded-lg">
                    <div className="px-4 py-3 border-b border-border">
                        <Label className="text-sm">Licence</Label>
                    </div>
                    <div className="divide-y divide-border">
                        {plans.length === 0 && (
                            <p className="text-sm text-muted-foreground px-4 py-10 text-center">
                                No plans yet. Create one, then come back.
                            </p>
                        )}
                        {plans.map((p) => {
                            const slots = resolveSlots(moduleSlots, p.features);
                            const limits = limitSummary(p, features);
                            const selected = planId === p.id;
                            return (
                                <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => setPlanId(p.id)}
                                    className={cn(
                                        'w-full text-left px-4 py-3 flex gap-3 items-start transition-colors',
                                        selected ? 'bg-primary/10' : 'hover:bg-muted/50',
                                    )}
                                >
                                    <span
                                        className={cn(
                                            'mt-0.5 h-4 w-4 rounded-full border shrink-0 grid place-items-center',
                                            selected ? 'border-primary bg-primary' : 'border-muted-foreground/40',
                                        )}
                                    >
                                        {selected && <Check size={11} className="text-primary-foreground" />}
                                    </span>

                                    <span className="flex-1 min-w-0 space-y-1.5">
                                        <span className="flex items-center gap-2">
                                            <span className="text-sm font-medium truncate">{p.name}</span>
                                            {p.is_published ? (
                                                <Globe size={11} className="text-primary shrink-0" />
                                            ) : (
                                                <Lock size={11} className="text-muted-foreground shrink-0" />
                                            )}
                                        </span>
                                        <ModuleStrip slots={slots} />
                                        {limits.length > 0 && (
                                            <span className="block text-xs text-muted-foreground truncate">
                                                {limits.join(' · ')}
                                            </span>
                                        )}
                                    </span>

                                    <span className="font-mono text-sm tabular-nums shrink-0">
                                        {formatPaise(p.amount)}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* What changes */}
                <section className="bg-card border border-border rounded-lg lg:sticky lg:top-4">
                    <div className="px-4 py-3 border-b border-border">
                        <Label className="text-sm">What changes</Label>
                    </div>

                    {!tenant || !plan ? (
                        <p className="text-sm text-muted-foreground px-4 py-10 text-center">
                            {!tenant ? 'Choose a tenant to begin.' : 'Choose a licence to see what changes.'}
                        </p>
                    ) : (
                        <div className="p-4 space-y-4">
                            <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                    <span className="w-11 text-xs text-muted-foreground shrink-0">Now</span>
                                    <span className="text-xs text-muted-foreground truncate flex-1">
                                        {tenant.planName || 'No plan'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="w-11 text-xs text-muted-foreground shrink-0">After</span>
                                    <span className="text-sm truncate flex-1">{plan.name}</span>
                                    <span className="font-mono text-sm tabular-nums">
                                        {formatPaise(plan.amount)}
                                    </span>
                                </div>
                            </div>

                            {bothUnset ? (
                                <p className="text-xs text-muted-foreground border-t border-border pt-3">
                                    Neither licence has its modules set, so nothing is locked either
                                    way. Set them on the plan to control module access.
                                </p>
                            ) : (
                                (gained.length > 0 || lost.length > 0) && (
                                    <div className="space-y-1.5 text-xs border-t border-border pt-3">
                                        {gained.length > 0 && (
                                            <p>
                                                <span className="text-primary">Gains</span>{' '}
                                                {gained.map((s) => s.label).join(', ')}
                                            </p>
                                        )}
                                        {lost.length > 0 && (
                                            <p>
                                                <span className="text-[hsl(var(--brand-secondary))]">Loses</span>{' '}
                                                {lost.map((s) => s.label).join(', ')}
                                            </p>
                                        )}
                                    </div>
                                )
                            )}

                            <div className="border-t border-border pt-3 space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                    <Label className="text-xs">Overrides for this tenant only</Label>
                                    {overrideEntries.length > 0 && (
                                        <span className="font-mono text-[10px] text-[hsl(var(--brand-secondary))]">
                                            {overrideEntries.length}
                                        </span>
                                    )}
                                </div>

                                {overrideEntries.map(([code, value]) => {
                                    const def = features.find((f) => f.code === code);
                                    return (
                                        <div key={code} className="flex items-center gap-2">
                                            <span className="flex-1 min-w-0 font-mono text-[11px] text-muted-foreground truncate">
                                                {code}
                                            </span>
                                            {def?.type === 'boolean' ? (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-7 w-24 text-xs"
                                                    onClick={() =>
                                                        setOverrides((p) => ({ ...p, [code]: !value }))
                                                    }
                                                >
                                                    {value ? 'Granted' : 'Locked'}
                                                </Button>
                                            ) : (
                                                <Input
                                                    type={def?.type === 'number' ? 'number' : 'text'}
                                                    value={String(value)}
                                                    onChange={(e) =>
                                                        setOverrides((p) => ({ ...p, [code]: e.target.value }))
                                                    }
                                                    placeholder="-1 = unlimited"
                                                    className="h-7 w-24 text-xs"
                                                />
                                            )}
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-muted-foreground shrink-0"
                                                onClick={() => removeOverride(code)}
                                                aria-label={`Remove ${code}`}
                                            >
                                                <X size={12} />
                                            </Button>
                                        </div>
                                    );
                                })}

                                <Select value="" onValueChange={addOverride}>
                                    <SelectTrigger className="h-8 text-xs justify-start gap-1.5 text-muted-foreground [&>svg:last-child]:ml-auto">
                                        <Plus size={12} />
                                        Add an override
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableOverrides.map((f) => (
                                            <SelectItem key={f.code} value={f.code} className="text-xs">
                                                {f.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="border-t border-border pt-3 space-y-2">
                                <Label htmlFor="note" className="text-xs">
                                    Note
                                </Label>
                                <Textarea
                                    id="note"
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    placeholder="Why this licence was issued."
                                    rows={2}
                                    className="text-xs resize-none"
                                />
                            </div>

                            <Button className="w-full" onClick={handleIssue} disabled={isIssuing}>
                                {isIssuing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Issue licence
                            </Button>
                            <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
                                Applies immediately. Overrides replace any the tenant already has.
                            </p>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
