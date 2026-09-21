import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
    ArrowLeft,
    Loader2,
    Edit,
    Lock,
    ChevronDown,
    Infinity as InfinityIcon,
    CreditCard,
    Users,
    FileText,
    Megaphone,
    Inbox,
    Workflow,
    Target,
    Ticket,
    ShoppingBag,
    ShoppingCart,
    Plug,
    Shield,
    Layers,
    type LucideIcon,
} from 'lucide-react';
import { ModuleStrip } from '@/components/licensing/ModuleStrip';
import { ModuleRoster } from '@/components/licensing/ModuleRoster';
import { MODULE_PREFIX, resolveSlots, useModuleSlots } from '@/components/licensing/modules';
import { formatCurrency } from '@/utils/format';
import {
    useGetMastersQuery,
    useGetMasterByIdQuery,
    useAddMasterMutation,
    useUpdateMasterMutation,
} from '@/store/api/mastersApi';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';

const SUBSCRIPTIONS_URL = '/subscriptions/plans';
const FEATURES_DROPDOWN_URL = '/plan-features/features-dropdown';

interface FeatureOption {
    id: string;
    name: string;
    code: string;
    type: 'string' | 'number' | 'boolean';
    module_key?: string | null;
    count_model?: string | null;
}

const UNLIMITED = -1;

interface ModuleGroup {
    key: string;
    gate?: FeatureOption;
    limits: FeatureOption[];
}

const titleCase = (key: string) =>
    key.replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const MODULE_ICONS: Record<string, LucideIcon> = {
    contacts: Users,
    templates: FileText,
    campaigns: Megaphone,
    inbox: Inbox,
    automation: Workflow,
    leads: Target,
    tickets: Ticket,
    catalog: ShoppingBag,
    carts: ShoppingCart,
    integrations: Plug,
    team: Shield,
};

interface Subscription {
    name: string;
    subtitle: string;
    description: string;
    amount: string | number;
    yearly_discount: number;
    razorpay_monthly_plan_id?: string;
    razorpay_yearly_plan_id?: string;
    features?: Record<string, string | number | boolean>;
}

const subscriptionSchema = z.object({
    name: z.string().min(1, 'Plan name is required'),
    subtitle: z.string().min(1, 'Subtitle is required'),
    description: z.string().min(1, 'Description is required'),
    amount: z.coerce.number().min(0, 'Monthly amount is required'),
    yearly_discount: z.coerce.number().min(0).max(100).default(0),
    razorpay_monthly_plan_id: z.string().default(''),
    razorpay_yearly_plan_id: z.string().default(''),
});

type SubscriptionFormValues = z.infer<typeof subscriptionSchema>;

function Section({
    title,
    help,
    children,
    className,
    action,
}: {
    title: string;
    help?: string;
    children: React.ReactNode;
    className?: string;
    action?: React.ReactNode;
}) {
    return (
        <section className={cn('bg-card border border-border rounded-xl overflow-hidden', className)}>
            <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-border/80">
                <div>
                    <h2 className="text-sm font-semibold tracking-tight text-foreground">{title}</h2>
                    {help && <p className="text-xs text-muted-foreground mt-1 leading-relaxed max-w-[56ch]">{help}</p>}
                </div>
                {action}
            </div>
            <div className="p-6">{children}</div>
        </section>
    );
}

function Field({
    label,
    hint,
    htmlFor,
    children,
}: {
    label: string;
    hint?: string;
    htmlFor?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-1.5">
            <Label htmlFor={htmlFor} className="text-xs font-medium text-muted-foreground">
                {label}
            </Label>
            {children}
            {hint && <p className="text-[11px] text-muted-foreground leading-relaxed">{hint}</p>}
        </div>
    );
}

function apiErrorMessage(error: unknown): string {
    const data = (error as { data?: { message?: string | string[] } })?.data;
    const message = data?.message;
    if (Array.isArray(message)) return message.join(', ');
    if (typeof message === 'string') return message;
    return 'Failed to save plan';
}

export default function SubscriptionCreatePage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const action = searchParams.get('action');
    const id = searchParams.get('id');
    const isView = action === 'view';
    const isEdit = action === 'edit';
    const moduleSlots = useModuleSlots();
    const [openModules, setOpenModules] = useState<Record<string, boolean>>({});
    const [razorpayOpen, setRazorpayOpen] = useState(false);

    const {
        register,
        handleSubmit: handleFormSubmit,
        watch,
        reset,
        formState: { errors },
    } = useForm<SubscriptionFormValues>({
        resolver: zodResolver(subscriptionSchema),
        defaultValues: {
            name: '',
            subtitle: '',
            description: '',
            amount: 0,
            yearly_discount: 0,
            razorpay_monthly_plan_id: '',
            razorpay_yearly_plan_id: '',
        },
    });

    const watchedAmount = watch('amount');
    const watchedDiscount = watch('yearly_discount');
    const watchedName = watch('name');
    const watchedSubtitle = watch('subtitle');
    const watchedMonthlyRz = watch('razorpay_monthly_plan_id');
    const watchedYearlyRz = watch('razorpay_yearly_plan_id');
    const monthlyPrice = Number(watchedAmount || 0);
    const yearlyPrice = Math.round(monthlyPrice * 12 * (1 - Number(watchedDiscount || 0) / 100));

    const [moduleOn, setModuleOn] = useState<Record<string, boolean>>({});
    const [values, setValues] = useState<Record<string, string | boolean>>({});

    const { data: featuresCommonData } = useGetMastersQuery({
        url: FEATURES_DROPDOWN_URL,
    });

    const featuresData = useMemo(() => {
        if (Array.isArray(featuresCommonData)) return featuresCommonData as FeatureOption[];
        return (featuresCommonData as { data: FeatureOption[] })?.data || [];
    }, [featuresCommonData]);

    const { moduleGroups, accountWide } = useMemo(() => {
        const groups = new Map<string, ModuleGroup>();
        const account: FeatureOption[] = [];

        featuresData.forEach((f) => {
            if (!f.module_key) {
                account.push(f);
                return;
            }
            if (!groups.has(f.module_key)) {
                groups.set(f.module_key, { key: f.module_key, limits: [] });
            }
            const g = groups.get(f.module_key)!;
            if (f.code.startsWith(MODULE_PREFIX)) g.gate = f;
            else g.limits.push(f);
        });

        return {
            moduleGroups: [...groups.values()].sort((a, b) => a.key.localeCompare(b.key)),
            accountWide: account,
        };
    }, [featuresData]);

    const { data: existingSubscriptionData, isLoading: isLoadingSubscription } = useGetMasterByIdQuery({
        url: SUBSCRIPTIONS_URL,
        id: id || '',
    }, { skip: !id });

    const [addSubscription, { isLoading: isAdding }] = useAddMasterMutation();
    const [updateSubscription, { isLoading: isUpdating }] = useUpdateMasterMutation();

    useEffect(() => {
        if (existingSubscriptionData && (isEdit || isView)) {
            const subscriptionData = (existingSubscriptionData as { data: Subscription }).data || (existingSubscriptionData as Subscription);

            reset({
                name: subscriptionData.name || '',
                subtitle: subscriptionData.subtitle || '',
                description: subscriptionData.description || '',
                // Stored in paise (what Razorpay bills); the form edits rupees.
                amount: (Number(subscriptionData.amount) || 0) / 100,
                yearly_discount: subscriptionData.yearly_discount || 0,
                razorpay_monthly_plan_id: subscriptionData.razorpay_monthly_plan_id || '',
                razorpay_yearly_plan_id: subscriptionData.razorpay_yearly_plan_id || '',
            });

            if (subscriptionData.razorpay_monthly_plan_id || subscriptionData.razorpay_yearly_plan_id) {
                setRazorpayOpen(true);
            }

            if (subscriptionData.features && featuresData.length > 0) {
                const on: Record<string, boolean> = {};
                const vals: Record<string, string | boolean> = {};

                Object.entries(subscriptionData.features).forEach(([code, value]) => {
                    const def = featuresData.find((f) => f.code === code);
                    if (!def) return;
                    if (def.module_key && code.startsWith(MODULE_PREFIX)) {
                        on[def.module_key] = value === true;
                        return;
                    }
                    vals[code] = def.type === 'boolean' ? !!value : String(value);
                });

                featuresData.forEach((f) => {
                    if (f.module_key && vals[f.code] !== undefined && on[f.module_key] === undefined) {
                        on[f.module_key] = true;
                    }
                });

                setModuleOn(on);
                setValues(vals);
                setOpenModules(
                    Object.fromEntries(Object.entries(on).filter(([, granted]) => granted)),
                );
            }
        }
    }, [existingSubscriptionData, isEdit, isView, featuresData, reset]);

    const setValue = (code: string, value: string | boolean) =>
        setValues((prev) => ({ ...prev, [code]: value }));

    const toggleUnlimited = (code: string, on: boolean) =>
        setValue(code, on ? String(UNLIMITED) : '');

    const isUnlimited = (code: string) => String(values[code] ?? '') === String(UNLIMITED);

    const limitsSetIn = (g: ModuleGroup) =>
        g.limits.filter((f) => {
            const v = values[f.code];
            return f.type === 'boolean' ? v === true : v !== undefined && v !== '';
        }).length;

    const previewSlots = useMemo(
        () =>
            resolveSlots(
                moduleSlots,
                Object.fromEntries(
                    moduleGroups.map((g) => [
                        g.gate?.code ?? `${MODULE_PREFIX}${g.key}`,
                        moduleOn[g.key] ?? false,
                    ]),
                ),
            ),
        [moduleSlots, moduleGroups, moduleOn],
    );
    const grantedSlots = previewSlots.filter((s) => s.granted);
    const grantedCount = moduleGroups.filter((g) => moduleOn[g.key]).length;
    const razorpayLinked = Boolean(watchedMonthlyRz?.trim() || watchedYearlyRz?.trim());

    const toggleModule = (key: string, checked: boolean) => {
        setModuleOn((prev) => ({ ...prev, [key]: checked }));
        setOpenModules((prev) => ({ ...prev, [key]: checked }));
    };

    const onSubmit = async (data: SubscriptionFormValues) => {
        const featuresMap: Record<string, string | number | boolean> = {};

        const addValue = (f: FeatureOption) => {
            const raw = values[f.code];
            if (f.type === 'boolean') {
                if (raw !== undefined) featuresMap[f.code] = !!raw;
                return;
            }
            if (raw === undefined || String(raw).trim() === '') return;
            featuresMap[f.code] =
                f.type === 'number' ? Number(raw) : String(raw);
        };

        moduleGroups.forEach((g) => {
            const on = moduleOn[g.key] ?? false;
            if (g.gate) featuresMap[g.gate.code] = on;
            if (on) g.limits.forEach(addValue);
        });

        accountWide.forEach(addValue);

        const monthlyRazorpayId = data.razorpay_monthly_plan_id?.trim() || null;
        const yearlyRazorpayId = data.razorpay_yearly_plan_id?.trim() || null;

        const payload: Record<string, unknown> = {
            name: data.name,
            subtitle: data.subtitle,
            description: data.description,
            amount: Math.round(Number(data.amount) * 100),
            yearly_discount: Number(data.yearly_discount),
            features: featuresMap,
        };

        if (isEdit) {
            payload.razorpay_monthly_plan_id = monthlyRazorpayId;
            payload.razorpay_yearly_plan_id = yearlyRazorpayId;
        } else {
            if (monthlyRazorpayId) payload.razorpay_monthly_plan_id = monthlyRazorpayId;
            if (yearlyRazorpayId) payload.razorpay_yearly_plan_id = yearlyRazorpayId;
        }

        try {
            if (isEdit && id) {
                await updateSubscription({ url: SUBSCRIPTIONS_URL, id, data: payload }).unwrap();
                toast.success('Plan saved');
            } else {
                await addSubscription({ url: SUBSCRIPTIONS_URL, data: payload }).unwrap();
                toast.success('Plan created');
            }
            navigate('/subscription');
        } catch (error) {
            toast.error(apiErrorMessage(error));
        }
    };

    if ((isEdit || isView) && isLoadingSubscription) {
        return (
            <div className="flex justify-center items-center min-h-[40vh]">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    const renderLimit = (f: FeatureOption) => (
        <div key={f.code} className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_11rem] gap-2 sm:gap-4 sm:items-center">
            <div className="min-w-0">
                <p className="text-sm text-foreground truncate">{f.name}</p>
            </div>

            {f.type === 'boolean' ? (
                <div className="flex items-center justify-between sm:justify-end gap-2">
                    <span className="text-xs text-muted-foreground sm:hidden">
                        {values[f.code] === true ? 'Included' : 'Not included'}
                    </span>
                    <Switch
                        id={f.code}
                        checked={values[f.code] === true}
                        onCheckedChange={(c) => setValue(f.code, c)}
                        disabled={isView}
                    />
                </div>
            ) : (
                <div className="flex items-center gap-1.5">
                    <Input
                        id={f.code}
                        type={f.type === 'number' ? 'number' : 'text'}
                        value={isUnlimited(f.code) ? '' : String(values[f.code] ?? '')}
                        onChange={(e) => setValue(f.code, e.target.value)}
                        placeholder={isUnlimited(f.code) ? '∞' : 'No limit'}
                        disabled={isView || isUnlimited(f.code)}
                        className="h-9 tabular-nums"
                    />
                    {f.type === 'number' && (
                        <Button
                            type="button"
                            variant={isUnlimited(f.code) ? 'secondary' : 'ghost'}
                            size="icon"
                            className="h-9 w-9 shrink-0"
                            disabled={isView}
                            title="Unlimited"
                            onClick={() => toggleUnlimited(f.code, !isUnlimited(f.code))}
                        >
                            <InfinityIcon className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            )}
        </div>
    );

    return (
        <div className="pt-4 pb-16">
            <div className="flex items-start justify-between gap-4 mb-8">
                <div className="flex items-start gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="mt-0.5"
                        onClick={() => navigate('/subscription')}
                        aria-label="Back to plans"
                    >
                        <ArrowLeft size={20} />
                    </Button>
                    <div>
                        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1">
                            Subscription
                        </p>
                        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                            {isView ? watchedName || 'Plan' : isEdit ? 'Edit plan' : 'New plan'}
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            {isView
                                ? 'What tenants on this plan can use.'
                                : 'Name it, price it, then switch on the modules you want to sell.'}
                        </p>
                    </div>
                </div>
                {isView && (
                    <Button onClick={() => navigate(`/subscription/create?id=${id}&action=edit`)}>
                        <Edit size={16} className="mr-2" />
                        Edit
                    </Button>
                )}
            </div>

            <form
                onSubmit={handleFormSubmit(onSubmit)}
                className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start"
            >
                <div className="space-y-5 min-w-0">
                    <Section title="Listing">
                        <div className="space-y-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <Field label="Name" htmlFor="name">
                                    <Input
                                        id="name"
                                        {...register('name')}
                                        placeholder="Growth"
                                        disabled={isView}
                                        error={errors.name?.message}
                                    />
                                </Field>
                                <Field label="Tagline" htmlFor="subtitle">
                                    <Input
                                        id="subtitle"
                                        {...register('subtitle')}
                                        placeholder="For scaling teams"
                                        disabled={isView}
                                        error={errors.subtitle?.message}
                                    />
                                </Field>
                            </div>

                            <Field label="Description" htmlFor="description">
                                <Textarea
                                    id="description"
                                    {...register('description')}
                                    placeholder="What a team on this plan can do."
                                    disabled={isView}
                                    rows={3}
                                    className="resize-none"
                                />
                                {errors.description && (
                                    <p className="text-xs text-destructive">{errors.description.message}</p>
                                )}
                            </Field>

                            <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-5 items-end pt-1">
                                <Field label="Monthly price (₹)" htmlFor="amount">
                                    <Input
                                        id="amount"
                                        type="number"
                                        {...register('amount')}
                                        placeholder="2499"
                                        disabled={isView}
                                        className="tabular-nums"
                                        error={errors.amount?.message}
                                    />
                                </Field>
                                <Field label="Yearly discount (%)" htmlFor="yearly_discount">
                                    <Input
                                        id="yearly_discount"
                                        type="number"
                                        {...register('yearly_discount')}
                                        placeholder="0"
                                        disabled={isView}
                                        className="tabular-nums"
                                        error={errors.yearly_discount?.message}
                                    />
                                </Field>
                                <div className="rounded-lg border border-border bg-muted/40 px-4 py-2.5 min-w-[9.5rem]">
                                    <p className="text-[11px] text-muted-foreground">Billed yearly</p>
                                    <p className="text-sm font-semibold tabular-nums mt-0.5">
                                        {formatCurrency(yearlyPrice)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Section>

                    <Section
                        title="Modules"
                        help="Off locks the module for every tenant on this plan. Leave a limit blank for no ceiling."
                        action={
                            moduleGroups.length > 0 && (
                                <Badge variant="secondary" className="font-normal tabular-nums">
                                    {grantedCount}/{moduleGroups.length} on
                                </Badge>
                            )
                        }
                    >
                        {moduleGroups.length === 0 ? (
                            <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center">
                                <Layers className="h-5 w-5 mx-auto text-muted-foreground mb-2" />
                                <p className="text-sm text-foreground">No modules in the catalogue</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Seed plan features, then they show up here.
                                </p>
                            </div>
                        ) : (
                            <div className="rounded-lg border border-border overflow-hidden divide-y divide-border">
                                {moduleGroups.map((g) => {
                                    const on = moduleOn[g.key] ?? false;
                                    const Icon = MODULE_ICONS[g.key] ?? Layers;
                                    const open = on && (openModules[g.key] ?? false);
                                    const label = g.gate?.name?.replace(/ module$/i, '') || titleCase(g.key);

                                    return (
                                        <div key={g.key} className={cn('bg-card', !on && 'bg-muted/20')}>
                                            <div className="flex items-center gap-3 px-4 py-3">
                                                <div
                                                    className={cn(
                                                        'flex h-8 w-8 items-center justify-center rounded-md shrink-0',
                                                        on
                                                            ? 'bg-primary/10 text-primary'
                                                            : 'bg-muted text-muted-foreground',
                                                    )}
                                                >
                                                    <Icon className="h-4 w-4" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={cn('text-sm truncate', on ? 'font-medium' : 'text-muted-foreground')}>
                                                        {label}
                                                    </p>
                                                    {on && g.limits.length > 0 && (
                                                        <p className="text-[11px] text-muted-foreground tabular-nums">
                                                            {limitsSetIn(g)} of {g.limits.length} limits set
                                                        </p>
                                                    )}
                                                </div>
                                                {on ? (
                                                    g.limits.length > 0 && (
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-muted-foreground"
                                                            onClick={() =>
                                                                setOpenModules((prev) => ({
                                                                    ...prev,
                                                                    [g.key]: !open,
                                                                }))
                                                            }
                                                            aria-label={open ? 'Hide limits' : 'Show limits'}
                                                        >
                                                            <ChevronDown
                                                                className={cn(
                                                                    'h-4 w-4 transition-transform',
                                                                    open && 'rotate-180',
                                                                )}
                                                            />
                                                        </Button>
                                                    )
                                                ) : (
                                                    <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                                                        <Lock size={11} />
                                                        Locked
                                                    </span>
                                                )}
                                                <Switch
                                                    checked={on}
                                                    onCheckedChange={(checked) => toggleModule(g.key, checked)}
                                                    disabled={isView}
                                                    aria-label={`${label} module`}
                                                />
                                            </div>

                                            {open && g.limits.length > 0 && (
                                                <div className="px-4 pb-4 pt-1 space-y-3 border-t border-border/60 bg-muted/15">
                                                    {g.limits.map(renderLimit)}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {accountWide.length > 0 && (
                            <div className="mt-6 pt-5 border-t border-border">
                                <h3 className="text-sm font-medium">Account-wide</h3>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Applies to the whole tenant. These never lock a module.
                                </p>
                                <div className="mt-4 space-y-3">
                                    {accountWide.map(renderLimit)}
                                </div>
                            </div>
                        )}
                    </Section>

                    <Collapsible open={razorpayOpen} onOpenChange={setRazorpayOpen}>
                        <section className="bg-card border border-border rounded-xl overflow-hidden">
                            <CollapsibleTrigger asChild>
                                <button
                                    type="button"
                                    className="flex w-full items-center gap-3 px-6 py-4 text-left hover:bg-muted/30 transition-colors"
                                >
                                    <CreditCard className="h-4 w-4 text-muted-foreground shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold tracking-tight">Razorpay</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            Optional. IDs are filled when you publish, or paste them if the SKU already exists.
                                        </p>
                                    </div>
                                    <Badge variant={razorpayLinked ? 'default' : 'secondary'} className="font-normal">
                                        {razorpayLinked ? 'Linked' : 'Not linked'}
                                    </Badge>
                                    <ChevronDown
                                        className={cn(
                                            'h-4 w-4 text-muted-foreground transition-transform',
                                            razorpayOpen && 'rotate-180',
                                        )}
                                    />
                                </button>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 px-6 pb-6 pt-1">
                                    <Field label="Monthly plan ID" htmlFor="razorpay_monthly_plan_id">
                                        <Input
                                            id="razorpay_monthly_plan_id"
                                            {...register('razorpay_monthly_plan_id')}
                                            placeholder="plan_…"
                                            disabled={isView}
                                            className="font-mono text-xs"
                                        />
                                    </Field>
                                    <Field label="Yearly plan ID" htmlFor="razorpay_yearly_plan_id">
                                        <Input
                                            id="razorpay_yearly_plan_id"
                                            {...register('razorpay_yearly_plan_id')}
                                            placeholder="plan_…"
                                            disabled={isView}
                                            className="font-mono text-xs"
                                        />
                                    </Field>
                                </div>
                            </CollapsibleContent>
                        </section>
                    </Collapsible>
                </div>

                <aside className="xl:sticky xl:top-4 space-y-3">
                    <div className="bg-card border border-border rounded-xl overflow-hidden">
                        <div className="px-5 py-4 border-b border-border">
                            <p className="text-sm font-semibold truncate">
                                {watchedName || 'Untitled plan'}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                {watchedSubtitle || 'Tagline'}
                            </p>
                        </div>

                        <div className="px-5 py-4 border-b border-border">
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-2xl font-semibold tabular-nums tracking-tight">
                                    {formatCurrency(monthlyPrice)}
                                </span>
                                <span className="text-xs text-muted-foreground">/ month</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 tabular-nums">
                                {formatCurrency(yearlyPrice)} / year
                                {Number(watchedDiscount) > 0 && ` · ${Number(watchedDiscount)}% off`}
                            </p>
                        </div>

                        <div className="px-5 py-4 space-y-3">
                            <div className="flex items-center justify-between gap-3">
                                <ModuleStrip slots={previewSlots} />
                                <span className="text-[11px] text-muted-foreground tabular-nums">
                                    {grantedSlots.length}/{previewSlots.length || 0}
                                </span>
                            </div>
                            <ModuleRoster slots={previewSlots} />
                        </div>

                        {!isView && (
                            <div className="px-5 py-4 border-t border-border space-y-2 bg-muted/20">
                                <Button type="submit" className="w-full" disabled={isAdding || isUpdating}>
                                    {isAdding || isUpdating ? (
                                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving</>
                                    ) : (
                                        isEdit ? 'Save plan' : 'Create plan'
                                    )}
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="w-full"
                                    onClick={() => navigate('/subscription')}
                                >
                                    Cancel
                                </Button>
                                <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
                                    {isEdit
                                        ? 'Saving updates every tenant on this plan.'
                                        : 'Stays private until you publish it.'}
                                </p>
                            </div>
                        )}
                    </div>
                </aside>
            </form>
        </div>
    );
}
