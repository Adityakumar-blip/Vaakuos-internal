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
import { X, ArrowLeft, Loader2, Edit, GripVertical } from 'lucide-react';
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
}

interface DynamicField {
    id: string; // unique internal id for list rendering
    code: string;
    value: string | number | boolean;
    type: 'string' | 'number' | 'boolean';
    name: string; // Display name
}


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

    // Dynamic Features State (kept separate for now as it involves complex UI/logic)
    const [dynamicFields, setDynamicFields] = useState<DynamicField[]>([]);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

    // Features Dropdown Data
    const { data: featuresCommonData } = useGetMastersQuery({
        url: FEATURES_DROPDOWN_URL,
    });

    // Ensure featuresData is an array
    const featuresData = useMemo(() => {
        if (Array.isArray(featuresCommonData)) return featuresCommonData as FeatureOption[];
        return (featuresCommonData as { data: FeatureOption[] })?.data || [];
    }, [featuresCommonData]);

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
                razorpay_monthly_plan_id: (subscriptionData as any).razorpay_monthly_plan_id || '',
                razorpay_yearly_plan_id: (subscriptionData as any).razorpay_yearly_plan_id || '',
            });

            // Map existing features to dynamicFields
            if (subscriptionData.features && featuresData.length > 0) {
                const mappedFields: DynamicField[] = [];
                Object.entries(subscriptionData.features).forEach(([code, value]) => {
                    const featureDef = featuresData.find(f => f.code === code);
                    if (featureDef) {
                        mappedFields.push({
                            id: Date.now().toString() + Math.random(),
                            code: featureDef.code,
                            name: featureDef.name,
                            type: featureDef.type,
                            value: value as string | number | boolean
                        });
                    }
                });
                setDynamicFields(mappedFields);
            }
        }
    }, [existingSubscriptionData, isEdit, isView, featuresData, reset]);


    const handleAddFeature = (featureCode: string) => {
        if (!featureCode) return;
        const featureDef = featuresData.find(f => f.code === featureCode);
        if (featureDef) {
            // Check if already added
            if (dynamicFields.some(f => f.code === featureCode)) {
                // Optionally show toast: already exists
                return;
            }

            let initialValue: string | number | boolean = '';
            if (featureDef.type === 'boolean') initialValue = true;
            if (featureDef.type === 'number') initialValue = 0;

            setDynamicFields([...dynamicFields, {
                id: Date.now().toString() + Math.random(),
                code: featureDef.code,
                name: featureDef.name,
                type: featureDef.type,
                value: initialValue
            }]);
        }
    };

    const handleRemoveField = (id: string) => {
        setDynamicFields(dynamicFields.filter(field => field.id !== id));
    };

    const handleFieldChange = (id: string, value: string | number | boolean) => {
        setDynamicFields(dynamicFields.map(field =>
            field.id === id ? { ...field, value } : field
        ));
    };

    // Drag and drop handlers
    const handleDragStart = (index: number) => {
        setDraggedIndex(index);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === index) return;

        const newFields = [...dynamicFields];
        const draggedItem = newFields[draggedIndex];
        newFields.splice(draggedIndex, 1);
        newFields.splice(index, 0, draggedItem);

        setDynamicFields(newFields);
        setDraggedIndex(index);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
    };

    const onSubmit = async (data: SubscriptionFormValues) => {
        // Construct features object
        const featuresMap: Record<string, string | number | boolean> = {};
        dynamicFields.forEach(field => {
            let val = field.value;
            if (field.type === 'number') val = Number(val);
            featuresMap[field.code] = val;
        });

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

    const availableFeatures = featuresData.filter(f => !dynamicFields.some(df => df.code === f.code));

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

                    {/* Dynamic Features */}
                    <div className="space-y-4 pt-4 border-t">
                        <div className="flex items-center justify-between">
                            <Label className="text-lg">Plan Features</Label>
                        </div>

                        {!isView && (
                            <div className="flex gap-2 items-end max-w-md">
                                <div className="flex-1 space-y-2">
                                    <Label>Add Feature</Label>
                                    <Select onValueChange={handleAddFeature}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a feature to add" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableFeatures.map(feature => (
                                                <SelectItem key={feature.id} value={feature.code}>
                                                    {feature.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        )}

                        <div className="space-y-4 mt-4">
                            {dynamicFields.length === 0 && (
                                <p className="text-sm text-muted-foreground italic">No features added yet.</p>
                            )}
                            {dynamicFields.map((field, index) => (
                                <div
                                    key={field.id}
                                    draggable={!isView}
                                    onDragStart={() => handleDragStart(index)}
                                    onDragOver={(e) => handleDragOver(e, index)}
                                    onDragEnd={handleDragEnd}
                                    className={cn(
                                        "flex items-center gap-4 p-4 bg-muted/30 rounded-lg border border-border transition-all",
                                        !isView && "cursor-move hover:bg-muted",
                                        draggedIndex === index && "opacity-50"
                                    )}
                                >
                                    {!isView && (
                                        <GripVertical size={20} className="text-muted-foreground flex-shrink-0 cursor-grab active:cursor-grabbing" />
                                    )}

                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                                        <div>
                                            <Label className="text-muted-foreground">{field.name}</Label>
                                            <p className="text-xs text-muted-foreground font-mono">{field.code}</p>
                                        </div>

                                        <div>
                                            {field.type === 'boolean' ? (
                                                <div className="flex items-center gap-2">
                                                    <Switch
                                                        checked={field.value as boolean}
                                                        onCheckedChange={(checked) => handleFieldChange(field.id, checked)}
                                                        disabled={isView}
                                                    />
                                                    <span className="text-sm">{field.value ? 'Enabled' : 'Disabled'}</span>
                                                </div>
                                            ) : field.type === 'number' ? (
                                                <Input
                                                    type="number"
                                                    value={field.value as number}
                                                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                                    placeholder="Enter number"
                                                    disabled={isView}
                                                />
                                            ) : (
                                                <Input
                                                    value={field.value as string}
                                                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                                    placeholder="Enter value"
                                                    disabled={isView}
                                                />
                                            )}
                                        </div>
                                    </div>

                                    {!isView && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleRemoveField(field.id)}
                                            className="text-destructive hover:text-destructive"
                                        >
                                            <X size={18} />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
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
