import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Globe, Loader2, Lock, Plus, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useGetMastersQuery, useAddMasterMutation } from '@/store/api/mastersApi';
import { useGetBrandsQuery } from '@/store/api/brandApi';
import { ModuleStrip } from '@/components/licensing/ModuleStrip';
import { resolveSlots, useModuleSlots } from '@/components/licensing/modules';
import { formatCurrency } from '@/utils/format';

const PLANS_URL = '/subscriptions/plans';
const ASSIGN_URL = '/subscriptions/licences/assign';
const FEATURES_DROPDOWN_URL = '/plan-features/features-dropdown';

interface Plan {
    id: string;
    name: string;
    subtitle?: string;
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

function unwrap<T>(data: unknown): T[] {
    if (Array.isArray(data)) return data as T[];
    const inner = (data as { data?: unknown })?.data;
    if (Array.isArray(inner)) return inner as T[];
    const nested = (inner as { data?: unknown })?.data;
    return Array.isArray(nested) ? (nested as T[]) : [];
}

export default function IssueLicencePage() {
    const navigate = useNavigate();
    const moduleSlots = useModuleSlots();

    const [tenantQuery, setTenantQuery] = useState('');
    const [tenantId, setTenantId] = useState<string>('');
    const [planId, setPlanId] = useState<string>('');
    const [overrides, setOverrides] = useState<Record<string, string | boolean>>({});
    const [note, setNote] = useState('');

    const { data: brandsData, isLoading: loadingTenants } = useGetBrandsQuery();
    const { data: plansData } = useGetMastersQuery({ url: PLANS_URL, params: '?limit=100' });
    const { data: featuresData } = useGetMastersQuery({ url: FEATURES_DROPDOWN_URL });

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

    const [assign, { isLoading: isIssuing }] = useAddMasterMutation();

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
                url: ASSIGN_URL,
                data: {
                    tenant_id: tenantId,
                    plan_id: planId,
                    custom_limits: custom,
                    note: note.trim() || undefined,
                },
                skipToast: true,
            }).unwrap();
            toast.success(`${plan?.name} issued to ${tenant?.name}`);
            navigate('/subscription');
        } catch {
            toast.error('Could not issue the licence. Check the overrides and try again.');
        }
    };

    return (
        <div className="space-y-6 pt-4 pb-12">
            <div className="flex items-start gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/subscription')}>
                    <ArrowLeft size={20} />
                </Button>
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">Issue a licence</h1>
                    <p className="text-sm text-muted-foreground mt-1 max-w-xl">
                        Grant a plan to one tenant straight away. Private licences never appear on
                        the pricing page, so this is the only way they reach a customer.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_minmax(0,380px)] gap-4 items-start">
                {/* Who */}
                <section className="bg-card border border-border rounded-lg">
                    <div className="p-4 border-b border-border">
                        <Label className="text-sm">Tenant</Label>
                        <div className="relative mt-2">
                            <Search
                                size={14}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                            />
                            <Input
                                value={tenantQuery}
                                onChange={(e) => setTenantQuery(e.target.value)}
                                placeholder="Find a tenant"
                                className="pl-9"
                            />
                        </div>
                    </div>
                    <div className="max-h-[340px] overflow-y-auto p-2">
                        {loadingTenants && (
                            <div className="flex justify-center py-8">
                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                            </div>
                        )}
                        {!loadingTenants && filteredTenants.length === 0 && (
                            <p className="text-sm text-muted-foreground px-3 py-8 text-center">
                                No tenant matches that name.
                            </p>
                        )}
                        {filteredTenants.map((t) => (
                            <button
                                key={t.id}
                                type="button"
                                onClick={() => setTenantId(t.id)}
                                className={cn(
                                    'w-full text-left px-3 py-2.5 rounded-md transition-colors',
                                    tenantId === t.id ? 'bg-primary/10 ring-1 ring-primary/30' : 'hover:bg-muted',
                                )}
                            >
                                <p className="text-sm font-medium truncate">{t.name}</p>
                                <p className="text-xs text-muted-foreground font-mono truncate">
                                    {t.planName || 'no plan'} · {t.status || 'inactive'}
                                </p>
                            </button>
                        ))}
                    </div>
                </section>

                {/* What */}
                <section className="bg-card border border-border rounded-lg">
                    <div className="p-4 border-b border-border">
                        <Label className="text-sm">Licence</Label>
                        <p className="text-xs text-muted-foreground mt-1">
                            Filled slots are the modules this licence grants.
                        </p>
                    </div>
                    <div className="max-h-[340px] overflow-y-auto p-2">
                        {plans.length === 0 && (
                            <p className="text-sm text-muted-foreground px-3 py-8 text-center">
                                No plans yet. Create one first, then come back.
                            </p>
                        )}
                        {plans.map((p) => (
                            <button
                                key={p.id}
                                type="button"
                                onClick={() => setPlanId(p.id)}
                                className={cn(
                                    'w-full text-left px-3 py-2.5 rounded-md transition-colors',
                                    planId === p.id ? 'bg-primary/10 ring-1 ring-primary/30' : 'hover:bg-muted',
                                )}
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium truncate flex-1">{p.name}</span>
                                    {p.is_published ? (
                                        <Globe size={12} className="text-primary shrink-0" />
                                    ) : (
                                        <Lock size={12} className="text-muted-foreground shrink-0" />
                                    )}
                                    <span className="font-mono text-xs text-muted-foreground tabular-nums">
                                        {formatCurrency(p.amount)}
                                    </span>
                                </div>
                                <ModuleStrip slots={resolveSlots(moduleSlots, p.features)} className="mt-1.5" />
                            </button>
                        ))}
                    </div>
                </section>

                {/* What changes */}
                <section className="bg-card border border-border rounded-lg lg:sticky lg:top-4">
                    <div className="p-4 border-b border-border">
                        <Label className="text-sm">What changes</Label>
                    </div>

                    {!tenant || !plan ? (
                        <p className="text-sm text-muted-foreground p-6 text-center">
                            Pick a tenant and a licence to see what they gain or lose.
                        </p>
                    ) : (
                        <div className="p-4 space-y-4">
                            <p className="text-sm font-medium">{tenant.name}</p>

                            <div className="space-y-2.5">
                                <div className="flex items-center gap-3">
                                    <span className="w-11 text-xs text-muted-foreground">Now</span>
                                    <ModuleStrip slots={before} />
                                    <span className="text-xs text-muted-foreground truncate">
                                        {tenant.planName || 'no plan'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="w-11 text-xs text-muted-foreground">After</span>
                                    <ModuleStrip slots={after} />
                                    <span className="text-xs text-foreground truncate">{plan.name}</span>
                                </div>
                            </div>

                            {(gained.length > 0 || lost.length > 0) && (
                                <div className="space-y-1.5 text-xs border-t border-border pt-3">
                                    {gained.length > 0 && (
                                        <p className="text-foreground">
                                            <span className="text-primary">Gains</span>{' '}
                                            {gained.map((s) => s.label).join(', ')}
                                        </p>
                                    )}
                                    {lost.length > 0 && (
                                        <p className="text-foreground">
                                            <span className="text-[hsl(var(--brand-secondary))]">Loses</span>{' '}
                                            {lost.map((s) => s.label).join(', ')}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Overrides */}
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
                                                <Select
                                                    value={value ? 'true' : 'false'}
                                                    onValueChange={(v) =>
                                                        setOverrides((p) => ({ ...p, [code]: v === 'true' }))
                                                    }
                                                >
                                                    <SelectTrigger className="h-8 w-28 text-xs">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="true">Granted</SelectItem>
                                                        <SelectItem value="false">Locked</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            ) : (
                                                <Input
                                                    type={def?.type === 'number' ? 'number' : 'text'}
                                                    value={String(value)}
                                                    onChange={(e) =>
                                                        setOverrides((p) => ({ ...p, [code]: e.target.value }))
                                                    }
                                                    placeholder="-1 for unlimited"
                                                    className="h-8 w-28 text-xs"
                                                />
                                            )}
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 text-muted-foreground"
                                                onClick={() => removeOverride(code)}
                                                aria-label={`Remove override ${code}`}
                                            >
                                                <X size={13} />
                                            </Button>
                                        </div>
                                    );
                                })}

                                <Select value="" onValueChange={addOverride}>
                                    <SelectTrigger className="h-8 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1.5">
                                            <Plus size={12} /> Add an override
                                        </span>
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
                                    placeholder="Why this licence was issued. Kept with the tenant's billing record."
                                    rows={2}
                                    className="text-xs"
                                />
                            </div>

                            <Button className="w-full" onClick={handleIssue} disabled={isIssuing}>
                                {isIssuing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Issue licence
                                {!isIssuing && <ArrowRight size={15} className="ml-1.5" />}
                            </Button>
                            <p className="text-[11px] text-muted-foreground text-center">
                                Applies immediately. Overrides replace any the tenant already has.
                            </p>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
