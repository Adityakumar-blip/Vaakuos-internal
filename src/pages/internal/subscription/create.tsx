import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { ArrowLeft, Loader2, Edit, Lock } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { ModuleStrip } from '@/components/licensing/ModuleStrip';
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

/** Sentinel matching the backend's UNLIMITED. */
const UNLIMITED = -1;

interface ModuleGroup {
    key: string;
    gate?: FeatureOption;
    limits: FeatureOption[];
}

const titleCase = (key: string) =>
    key.replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

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

// Zod Schema — one row per pricing tier with both monthly and yearly pricing
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
}: {
    title: string;
    help?: string;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <section className={cn('bg-card border border-border rounded-lg', className)}>
            <div className="px-5 py-4 border-b border-border">
                <h2 className="text-sm font-medium text-foreground">{title}</h2>
                {help && <p className="text-xs text-muted-foreground mt-1 max-w-[60ch]">{help}</p>}
            </div>
            <div className="p-5">{children}</div>
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
            <Label htmlFor={htmlFor} className="text-xs">
                {label}
            </Label>
            {children}
            {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
    );
}

export default function SubscriptionCreatePage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const action = searchParams.get('action');
    const id = searchParams.get('id');
    const isView = action === 'view';
    const isEdit = action === 'edit';
    const moduleSlots = useModuleSlots();

    // React Hook Form
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
    const monthlyPrice = Number(watchedAmount || 0);
    const yearlyPrice = Math.round(monthlyPrice * 12 * (1 - Number(watchedDiscount || 0) / 100));

    /**
     * The licence: which modules this plan grants, and the allowance on each.
     * Values are kept as raw strings so "no limit stated" ('') stays distinct
     * from a deliberate 0 — the backend treats those very differently.
     */
    const [moduleOn, setModuleOn] = useState<Record<string, boolean>>({});
    const [values, setValues] = useState<Record<string, string | boolean>>({});

    // Features Dropdown Data
    const { data: featuresCommonData } = useGetMastersQuery({
        url: FEATURES_DROPDOWN_URL,
    });

    // Ensure featuresData is an array
    const featuresData = useMemo(() => {
        if (Array.isArray(featuresCommonData)) return featuresCommonData as FeatureOption[];
        return (featuresCommonData as { data: FeatureOption[] })?.data || [];
    }, [featuresCommonData]);

    // Grouping comes from the catalogue's module_key, so a new module appears
    // here the moment it is seeded — no list to keep in step.
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

    // Fetch existing subscription data if edit/view
    const { data: existingSubscriptionData, isLoading: isLoadingSubscription } = useGetMasterByIdQuery({
        url: SUBSCRIPTIONS_URL,
        id: id || '',
    }, { skip: !id });

    // Mutation hooks
    const [addSubscription, { isLoading: isAdding }] = useAddMasterMutation();
    const [updateSubscription, { isLoading: isUpdating }] = useUpdateMasterMutation();

    // Populate form on load
    useEffect(() => {
        if (existingSubscriptionData && (isEdit || isView)) {
            // Fix: Check if data is nested in a 'data' property or direct
            const subscriptionData = (existingSubscriptionData as { data: Subscription }).data || (existingSubscriptionData as Subscription);

            reset({
                name: subscriptionData.name || '',
                subtitle: subscriptionData.subtitle || '',
                description: subscriptionData.description || '',
                amount: Number(subscriptionData.amount) || 0,
                yearly_discount: subscriptionData.yearly_discount || 0,
                razorpay_monthly_plan_id: subscriptionData.razorpay_monthly_plan_id || '',
                razorpay_yearly_plan_id: subscriptionData.razorpay_yearly_plan_id || '',
            });

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

                // A limit set without its gate means a plan authored before module
                // gates existed. Treat the module as granted rather than silently
                // switching it off on the next save.
                featuresData.forEach((f) => {
                    if (f.module_key && vals[f.code] !== undefined && on[f.module_key] === undefined) {
                        on[f.module_key] = true;
                    }
                });

                setModuleOn(on);
                setValues(vals);
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

    // The rail reads the licence the same way the tenant pages do, so a plan
    // being authored and a plan already issued are compared with one glance.
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

    const onSubmit = async (data: SubscriptionFormValues) => {
        const featuresMap: Record<string, string | number | boolean> = {};

        const addValue = (f: FeatureOption) => {
            const raw = values[f.code];
            if (f.type === 'boolean') {
                if (raw !== undefined) featuresMap[f.code] = !!raw;
                return;
            }
            // Blank means no ceiling stated; writing 0 here would block everything.
            if (raw === undefined || String(raw).trim() === '') return;
            featuresMap[f.code] =
                f.type === 'number' ? Number(raw) : String(raw);
        };

        moduleGroups.forEach((g) => {
            const on = moduleOn[g.key] ?? false;
            // The gate is written either way: an explicit false is what locks a
            // module, and omitting it would leave the module open by default.
            if (g.gate) featuresMap[g.gate.code] = on;
            if (on) g.limits.forEach(addValue);
        });

        accountWide.forEach(addValue);

        const payload = {
            name: data.name,
            subtitle: data.subtitle,
            description: data.description,
            amount: Number(data.amount),
            yearly_discount: Number(data.yearly_discount),
            razorpay_monthly_plan_id: data.razorpay_monthly_plan_id || null,
            razorpay_yearly_plan_id: data.razorpay_yearly_plan_id || null,
            features: featuresMap,
        };

        try {
            if (isEdit && id) {
                await updateSubscription({ url: SUBSCRIPTIONS_URL, id, data: payload }).unwrap();
            } else {
                await addSubscription({ url: SUBSCRIPTIONS_URL, data: payload }).unwrap();
            }
            navigate('/subscription');
        } catch (error) {
            console.error('Failed to save subscription:', error);
        }
    };

    if ((isEdit || isView) && isLoadingSubscription) {
        return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;
    }

    const renderLimit = (f: FeatureOption) => (
        <div key={f.code} className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-3">
                <label htmlFor={f.code} className="text-xs text-foreground truncate">
                    {f.name}
                </label>
                {f.type === 'number' && (
                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap cursor-pointer">
                        <Checkbox
                            checked={isUnlimited(f.code)}
                            onCheckedChange={(c) => toggleUnlimited(f.code, c === true)}
                            disabled={isView}
                            className="h-3.5 w-3.5"
                        />
                        Unlimited
                    </label>
                )}
            </div>

            {f.type === 'boolean' ? (
                <div className="flex items-center gap-2 h-9">
                    <Switch
                        id={f.code}
                        checked={values[f.code] === true}
                        onCheckedChange={(c) => setValue(f.code, c)}
                        disabled={isView}
                    />
                    <span className="text-xs text-muted-foreground">
                        {values[f.code] === true ? 'Included' : 'Not included'}
                    </span>
                </div>
            ) : (
                <Input
                    id={f.code}
                    type={f.type === 'number' ? 'number' : 'text'}
                    value={isUnlimited(f.code) ? '' : String(values[f.code] ?? '')}
                    onChange={(e) => setValue(f.code, e.target.value)}
                    placeholder={isUnlimited(f.code) ? 'Unlimited' : 'No ceiling'}
                    disabled={isView || isUnlimited(f.code)}
                    className="h-9 tabular-nums"
                />
            )}

            <p className="text-[11px] text-muted-foreground font-mono truncate">
                {f.code}
                {f.count_model ? ` · counts ${f.count_model}` : ''}
            </p>
        </div>
    );

    return (
        <div className="pt-4 pb-12">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate('/subscription')}
                        aria-label="Back to plans"
                    >
                        <ArrowLeft size={20} />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-semibold text-foreground">
                            {isView ? watchedName || 'Plan' : isEdit ? 'Edit plan' : 'New plan'}
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1 max-w-[60ch]">
                            A plan is a licence you can sell. What you switch on here is what every
                            tenant on it gets.
                        </p>
                    </div>
                </div>
                {isView && (
                    <Button onClick={() => navigate(`/subscription/create?id=${id}&action=edit`)}>
                        <Edit size={16} className="mr-2" />
                        Edit plan
                    </Button>
                )}
            </div>

            <form
                onSubmit={handleFormSubmit(onSubmit)}
                className="mt-6 grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start max-w-[64rem]"
            >
                <div className="space-y-5">
                    <Section title="How the plan is sold" help="Shown on the pricing page and on the tenant's billing screen.">
                        <div className="space-y-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <Field label="Plan name" htmlFor="name">
                                    <Input
                                        id="name"
                                        {...register('name')}
                                        placeholder="Pro"
                                        disabled={isView}
                                        error={errors.name?.message}
                                    />
                                </Field>
                                <Field label="Subtitle" htmlFor="subtitle">
                                    <Input
                                        id="subtitle"
                                        {...register('subtitle')}
                                        placeholder="Best for growing teams"
                                        disabled={isView}
                                        error={errors.subtitle?.message}
                                    />
                                </Field>
                            </div>

                            <Field
                                label="Description"
                                htmlFor="description"
                                hint="A paragraph a buyer reads before choosing this plan."
                            >
                                <Textarea
                                    id="description"
                                    {...register('description')}
                                    placeholder="What a team on this plan can do."
                                    disabled={isView}
                                    rows={3}
                                />
                                {errors.description && (
                                    <p className="text-xs text-destructive">{errors.description.message}</p>
                                )}
                            </Field>
                        </div>
                    </Section>

                    <Section title="Price">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <Field label="Monthly amount (₹)" htmlFor="amount" hint="Base monthly price in INR.">
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

                            <Field
                                label="Yearly discount (%)"
                                htmlFor="yearly_discount"
                                hint="Taken off twelve months when a tenant pays annually."
                            >
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
                        </div>
                    </Section>

                    <Section
                        title="Modules and allowances"
                        help="Switch a module off and it is locked for every tenant on this plan. Leave a limit blank for no ceiling, or tick Unlimited to say so explicitly."
                    >
                        {moduleGroups.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                No modules in the feature catalogue yet. Seed one and it appears here.
                            </p>
                        ) : (
                            <div className="rounded-md border border-border divide-y divide-border overflow-hidden">
                                {moduleGroups.map((g) => {
                                    const on = moduleOn[g.key] ?? false;
                                    return (
                                        <div key={g.key} className={cn(!on && 'bg-muted/30')}>
                                            <div className="flex items-center gap-3 px-4 py-3">
                                                <Switch
                                                    checked={on}
                                                    onCheckedChange={(checked) =>
                                                        setModuleOn((prev) => ({ ...prev, [g.key]: checked }))
                                                    }
                                                    disabled={isView}
                                                    aria-label={`${titleCase(g.key)} module`}
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p
                                                        className={cn(
                                                            'text-sm truncate',
                                                            on ? 'font-medium text-foreground' : 'text-muted-foreground',
                                                        )}
                                                    >
                                                        {g.gate?.name?.replace(/ module$/i, '') || titleCase(g.key)}
                                                    </p>
                                                    <p className="text-[11px] text-muted-foreground font-mono truncate">
                                                        {g.gate?.code ?? `${MODULE_PREFIX}${g.key}`}
                                                    </p>
                                                </div>
                                                {on ? (
                                                    g.limits.length > 0 && (
                                                        <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
                                                            {limitsSetIn(g)}/{g.limits.length} limits set
                                                        </span>
                                                    )
                                                ) : (
                                                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                        <Lock size={12} /> locked
                                                    </span>
                                                )}
                                            </div>

                                            {on && g.limits.length > 0 && (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 px-4 sm:pl-[4.5rem] pb-4 pt-3 border-t border-border/50">
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
                                <p className="text-xs text-muted-foreground mt-1 max-w-[60ch]">
                                    Applies to the whole tenant. These never lock a module.
                                </p>
                                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                                    {accountWide.map(renderLimit)}
                                </div>
                            </div>
                        )}
                    </Section>

                    <Section
                        title="Razorpay"
                        help="Plan IDs from the Razorpay dashboard. Leave blank until the plan exists there."
                    >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <Field label="Monthly plan ID" htmlFor="razorpay_monthly_plan_id">
                                <Input
                                    id="razorpay_monthly_plan_id"
                                    {...register('razorpay_monthly_plan_id')}
                                    placeholder="plan_XXXXXXXXXX"
                                    disabled={isView}
                                    className="font-mono text-xs"
                                />
                            </Field>
                            <Field label="Yearly plan ID" htmlFor="razorpay_yearly_plan_id">
                                <Input
                                    id="razorpay_yearly_plan_id"
                                    {...register('razorpay_yearly_plan_id')}
                                    placeholder="plan_XXXXXXXXXX"
                                    disabled={isView}
                                    className="font-mono text-xs"
                                />
                            </Field>
                        </div>
                    </Section>
                </div>

                {/* The licence as it stands */}
                <aside className="bg-card border border-border rounded-lg xl:sticky xl:top-4">
                    <div className="px-5 py-4 border-b border-border">
                        <p className="text-sm font-medium truncate">{watchedName || 'Untitled plan'}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            {watchedSubtitle || 'What this licence grants'}
                        </p>
                    </div>

                    <div className="px-5 py-4 border-b border-border">
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-2xl font-semibold tabular-nums">
                                {formatCurrency(monthlyPrice)}
                            </span>
                            <span className="text-xs text-muted-foreground">a month</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 tabular-nums">
                            {formatCurrency(yearlyPrice)} a year
                            {Number(watchedDiscount) > 0 && ` · ${Number(watchedDiscount)}% off annually`}
                        </p>
                    </div>

                    <div className="px-5 py-4 space-y-2.5">
                        <div className="flex items-center justify-between gap-3">
                            <ModuleStrip slots={previewSlots} />
                            <span className="text-xs text-muted-foreground tabular-nums">
                                {grantedSlots.length} of {previewSlots.length} modules
                            </span>
                        </div>
                        <p className="text-xs text-foreground leading-relaxed">
                            {grantedSlots.length > 0
                                ? grantedSlots.map((s) => s.label).join(', ')
                                : 'Nothing granted yet — every module is locked.'}
                        </p>
                    </div>

                    {!isView && (
                        <div className="px-5 py-4 border-t border-border space-y-2">
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
                            <p className="text-[11px] text-muted-foreground text-center">
                                {isEdit
                                    ? 'Changes reach every tenant on this plan.'
                                    : 'A new plan stays private until you publish it.'}
                            </p>
                        </div>
                    )}
                </aside>
            </form>
        </div>
    );
}
