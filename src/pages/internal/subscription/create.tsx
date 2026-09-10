import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { ArrowLeft, Loader2, Edit, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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

/** Feature code that licenses a whole module. */
const MODULE_PREFIX = 'module.';
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

export default function SubscriptionCreatePage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const action = searchParams.get('action');
    const id = searchParams.get('id');
    const isView = action === 'view';
    const isEdit = action === 'edit';

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
    const yearlyPrice = Math.round(Number(watchedAmount || 0) * 12 * (1 - Number(watchedDiscount || 0) / 100));

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

    return (
        <div className="space-y-6 pt-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate('/subscription')}
                    >
                        <ArrowLeft size={20} />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-semibold text-foreground">
                            {isView ? 'View' : isEdit ? 'Edit' : 'Create'} Plan
                        </h1>
                    </div>
                </div>
                {isView && (
                    <Button onClick={() => navigate(`/subscription/create?id=${id}&action=edit`)}>
                        <Edit size={16} className="mr-2" />
                        Edit Subscription
                    </Button>
                )}
            </div>

            {/* Form */}
            <form onSubmit={handleFormSubmit(onSubmit)} className="space-y-6">
                <div className="bg-card border border-border rounded-lg p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Name */}
                        <div className="space-y-2">
                            <Label htmlFor="name">Plan Name *</Label>
                            <Input
                                id="name"
                                {...register('name')}
                                placeholder="e.g. Pro, Business, Enterprise"
                                disabled={isView}
                            />
                            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                        </div>

                        {/* Subtitle */}
                        <div className="space-y-2">
                            <Label htmlFor="subtitle">Subtitle *</Label>
                            <Input
                                id="subtitle"
                                {...register('subtitle')}
                                placeholder="e.g. Best for growing teams"
                                disabled={isView}
                            />
                            {errors.subtitle && <p className="text-sm text-destructive">{errors.subtitle.message}</p>}
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Description *</Label>
                        <Textarea
                            id="description"
                            {...register('description')}
                            placeholder="Detailed description of the plan"
                            disabled={isView}
                            rows={4}
                        />
                        {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
                    </div>

                    {/* Pricing — single row per tier, monthly + yearly */}
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="amount">Monthly Amount (₹) *</Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    {...register('amount')}
                                    placeholder="e.g. 2499"
                                    disabled={isView}
                                />
                                <p className="text-xs text-muted-foreground">Base monthly price in INR</p>
                                {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="yearly_discount">Yearly Discount (%)</Label>
                                <Input
                                    id="yearly_discount"
                                    type="number"
                                    {...register('yearly_discount')}
                                    placeholder="0"
                                    disabled={isView}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Discount applied to annual billing (0–100).{' '}
                                    {yearlyPrice > 0 && (
                                        <span className="text-green-600 font-medium">
                                            Yearly price: ₹{yearlyPrice.toLocaleString('en-IN')}/yr
                                        </span>
                                    )}
                                </p>
                                {errors.yearly_discount && <p className="text-sm text-destructive">{errors.yearly_discount.message}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="razorpay_monthly_plan_id">Razorpay Monthly Plan ID</Label>
                                <Input
                                    id="razorpay_monthly_plan_id"
                                    {...register('razorpay_monthly_plan_id')}
                                    placeholder="plan_XXXXXXXXXX"
                                    disabled={isView}
                                    className="font-mono text-sm"
                                />
                                <p className="text-xs text-muted-foreground">Razorpay plan ID for monthly billing</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="razorpay_yearly_plan_id">Razorpay Yearly Plan ID</Label>
                                <Input
                                    id="razorpay_yearly_plan_id"
                                    {...register('razorpay_yearly_plan_id')}
                                    placeholder="plan_XXXXXXXXXX"
                                    disabled={isView}
                                    className="font-mono text-sm"
                                />
                                <p className="text-xs text-muted-foreground">Razorpay plan ID for annual billing</p>
                            </div>
                        </div>
                    </div>

                    {/* Modules and allowances */}
                    <div className="space-y-4 pt-4 border-t">
                        <div>
                            <Label className="text-lg">Modules and allowances</Label>
                            <p className="text-sm text-muted-foreground mt-1">
                                Switch a module off and it is locked for every tenant on this plan.
                                Leave a limit blank for no ceiling, or tick Unlimited to say so
                                explicitly.
                            </p>
                        </div>

                        <div className="space-y-3">
                            {moduleGroups.length === 0 && (
                                <p className="text-sm text-muted-foreground italic">
                                    No modules in the feature catalogue yet.
                                </p>
                            )}

                            {moduleGroups.map((g) => {
                                const on = moduleOn[g.key] ?? false;
                                return (
                                    <div
                                        key={g.key}
                                        className={cn(
                                            'rounded-lg border transition-colors',
                                            on ? 'border-primary/40 bg-primary/5' : 'border-border bg-muted/20',
                                        )}
                                    >
                                        <div className="flex items-center gap-3 p-4">
                                            <Switch
                                                checked={on}
                                                onCheckedChange={(checked) =>
                                                    setModuleOn((prev) => ({ ...prev, [g.key]: checked }))
                                                }
                                                disabled={isView}
                                                aria-label={`${titleCase(g.key)} module`}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium">
                                                    {g.gate?.name?.replace(/ module$/i, '') || titleCase(g.key)}
                                                </p>
                                                <p className="text-xs text-muted-foreground font-mono">
                                                    {g.gate?.code ?? `${MODULE_PREFIX}${g.key}`}
                                                </p>
                                            </div>
                                            {on ? (
                                                <Badge variant="secondary" className="font-mono text-[10px]">
                                                    {limitsSetIn(g)}/{g.limits.length} limits set
                                                </Badge>
                                            ) : (
                                                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                    <Lock size={12} /> locked
                                                </span>
                                            )}
                                        </div>

                                        {on && g.limits.length > 0 && (
                                            <div className="border-t border-border/60 px-4 py-3 space-y-3">
                                                {g.limits.map((f) => (
                                                    <div
                                                        key={f.code}
                                                        className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center"
                                                    >
                                                        <div className="min-w-0">
                                                            <p className="text-sm">{f.name}</p>
                                                            <p className="text-xs text-muted-foreground font-mono truncate">
                                                                {f.code}
                                                                {f.count_model ? ` · counts ${f.count_model}` : ''}
                                                            </p>
                                                        </div>

                                                        {f.type === 'boolean' ? (
                                                            <div className="flex items-center gap-2">
                                                                <Switch
                                                                    checked={values[f.code] === true}
                                                                    onCheckedChange={(c) => setValue(f.code, c)}
                                                                    disabled={isView}
                                                                />
                                                                <span className="text-sm text-muted-foreground">
                                                                    {values[f.code] === true ? 'Included' : 'Not included'}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-3">
                                                                <Input
                                                                    type={f.type === 'number' ? 'number' : 'text'}
                                                                    value={isUnlimited(f.code) ? '' : String(values[f.code] ?? '')}
                                                                    onChange={(e) => setValue(f.code, e.target.value)}
                                                                    placeholder={isUnlimited(f.code) ? 'Unlimited' : 'No limit'}
                                                                    disabled={isView || isUnlimited(f.code)}
                                                                    className="flex-1"
                                                                />
                                                                {f.type === 'number' && (
                                                                    <label className="flex items-center gap-2 text-xs text-muted-foreground whitespace-nowrap cursor-pointer">
                                                                        <Checkbox
                                                                            checked={isUnlimited(f.code)}
                                                                            onCheckedChange={(c) =>
                                                                                toggleUnlimited(f.code, c === true)
                                                                            }
                                                                            disabled={isView}
                                                                        />
                                                                        Unlimited
                                                                    </label>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {accountWide.length > 0 && (
                            <div className="pt-2 space-y-3">
                                <div>
                                    <Label>Account-wide</Label>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Applies to the whole tenant. These never lock a module.
                                    </p>
                                </div>
                                <div className="rounded-lg border border-border bg-muted/20 px-4 py-3 space-y-3">
                                    {accountWide.map((f) => (
                                        <div
                                            key={f.code}
                                            className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center"
                                        >
                                            <div className="min-w-0">
                                                <p className="text-sm">{f.name}</p>
                                                <p className="text-xs text-muted-foreground font-mono truncate">
                                                    {f.code}
                                                </p>
                                            </div>
                                            {f.type === 'boolean' ? (
                                                <div className="flex items-center gap-2">
                                                    <Switch
                                                        checked={values[f.code] === true}
                                                        onCheckedChange={(c) => setValue(f.code, c)}
                                                        disabled={isView}
                                                    />
                                                    <span className="text-sm text-muted-foreground">
                                                        {values[f.code] === true ? 'Included' : 'Not included'}
                                                    </span>
                                                </div>
                                            ) : (
                                                <Input
                                                    type={f.type === 'number' ? 'number' : 'text'}
                                                    value={String(values[f.code] ?? '')}
                                                    onChange={(e) => setValue(f.code, e.target.value)}
                                                    placeholder="Not set"
                                                    disabled={isView}
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions */}
                {!isView && (
                    <div className="flex justify-end gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => navigate('/subscription')}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isAdding || isUpdating}>
                            {isAdding || isUpdating ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                            ) : (
                                isEdit ? 'Update Plan' : 'Create Plan'
                            )}
                        </Button>
                    </div>
                )}
            </form>
        </div>
    );
}
