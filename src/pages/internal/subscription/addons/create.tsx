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
import { StatusSwitch } from '@/components/ui/status-switch';
import { ArrowLeft, Loader2, Edit, X, GripVertical } from 'lucide-react';
import {
    useGetMasterByIdQuery,
    useAddMasterMutation,
    useUpdateMasterMutation,
    useGetMastersQuery,
} from '@/store/api/mastersApi';
import { z } from 'zod';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const ADDONS_URL = '/subscriptions/addons';
const FEATURES_DROPDOWN_URL = '/plan-features/features-dropdown';

// Interfaces
interface FeatureOption {
    id: string;
    name: string;
    code: string;
    type: 'string' | 'number' | 'boolean';
}

interface DynamicField {
    id: string;
    code: string;
    value: string | number | boolean;
    type: 'string' | 'number' | 'boolean';
    name: string;
}

interface Addon {
    id: string;
    name: string;
    description?: string;
    type?: 'recurring' | 'one_time';
    amount?: number;
    is_active: boolean;
    features?: Record<string, string | number | boolean>;
}

// Zod Schema
const addonSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
    type: z.enum(['recurring', 'one_time'], {
        errorMap: () => ({ message: 'Please select a type' }),
    }),
    amount: z.coerce.number().min(0, 'Amount must be a positive number'),
    is_active: z.boolean().default(true),
});

type AddonFormValues = z.infer<typeof addonSchema>;

export default function SubscriptionAddonCreatePage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const id = searchParams.get('id');
    const action = searchParams.get('action');
    const isView = action === 'view';
    const isEdit = action === 'edit';

    // API Hooks
    const { data: response, isLoading: isFetching } = useGetMasterByIdQuery(
        { url: ADDONS_URL, id: id || '' },
        { skip: !id }
    );

    const addon = (response as { data?: Addon })?.data || (response as Addon);

    const { data: featuresCommonData } = useGetMastersQuery({
        url: FEATURES_DROPDOWN_URL,
    });

    const [addAddon, { isLoading: isCreating }] = useAddMasterMutation();
    const [updateAddon, { isLoading: isUpdating }] = useUpdateMasterMutation();

    // Dynamic Features State
    const [dynamicFields, setDynamicFields] = useState<DynamicField[]>([]);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

    // Form setup
    const {
        register,
        handleSubmit: handleFormSubmit,
        control,
        reset,
        formState: { errors },
    } = useForm<AddonFormValues>({
        resolver: zodResolver(addonSchema),
        defaultValues: {
            name: '',
            description: '',
            type: 'recurring',
            amount: 0,
            is_active: true,
        },
    });

    // Ensure featuresData is an array
    const featuresData = useMemo(() => {
        if (Array.isArray(featuresCommonData)) return featuresCommonData as FeatureOption[];
        return (featuresCommonData as { data: FeatureOption[] })?.data || [];
    }, [featuresCommonData]);

    // Populate form
    useEffect(() => {
        if (addon && (isEdit || isView)) {
            reset({
                name: addon.name,
                description: addon.description || '',
                type: addon.type || 'recurring',
                // Stored in paise (what Razorpay bills); the form edits rupees.
                amount: (addon.amount || 0) / 100,
                is_active: addon.is_active,
            });

            // Populate features if available
            if (addon.features && featuresData.length > 0) {
                const mappedFields: DynamicField[] = [];
                // If features is an Object/Record (like Plans)
                if (typeof addon.features === 'object' && !Array.isArray(addon.features)) {
                    Object.entries(addon.features).forEach(([code, value]) => {
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
                }
                setDynamicFields(mappedFields);
            }
        }
    }, [addon, isEdit, isView, reset, featuresData]);

    // Dynamic Field Handlers
    const handleAddFeature = (featureCode: string) => {
        if (!featureCode) return;
        const featureDef = featuresData.find(f => f.code === featureCode);
        if (featureDef) {
            if (dynamicFields.some(f => f.code === featureCode)) return;

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

    const handleDragStart = (index: number) => setDraggedIndex(index);
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
    const handleDragEnd = () => setDraggedIndex(null);


    const handleSubmit = async (data: AddonFormValues) => {
        try {
            const featuresMap: Record<string, string | number | boolean> = {};
            dynamicFields.forEach(field => {
                let val = field.value;
                if (field.type === 'number') val = Number(val);
                featuresMap[field.code] = val;
            });

            const payload = {
                ...data,
                amount: Math.round(Number(data.amount) * 100),
                features: featuresMap,
            };

            if (isEdit && id) {
                await updateAddon({
                    url: ADDONS_URL,
                    id,
                    data: payload,
                }).unwrap();
                toast.success('Add-on updated successfully');
            } else {
                await addAddon({
                    url: ADDONS_URL,
                    data: payload,
                }).unwrap();
                toast.success('Add-on created successfully');
            }
            navigate('/subscription?tab=addons');
        } catch (error) {
            console.error('Failed to save add-on:', error);
            // toast.error('Failed to save add-on');
        }
    };

    const isLoading = isCreating || isUpdating;
    const availableFeatures = featuresData.filter(f => !dynamicFields.some(df => df.code === f.code));

    const getTitle = () => {
        if (isView) return 'View Add-on';
        if (isEdit) return 'Edit Add-on';
        return 'Create Add-on';
    };

    return (
        <div className="p-6 space-y-6 max-w-4xl mx-auto pt-10">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate('/subscription?tab=addons')}
                    >
                        <ArrowLeft size={20} />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">{getTitle()}</h1>
                    </div>
                </div>
                <div className="flex gap-2">
                    {isView && id && (
                        <Button onClick={() => navigate(`/subscription/addons/create?id=${id}&action=edit`)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                        </Button>
                    )}
                </div>
            </div>

            {isFetching ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Main Info */}
                        <div className="md:col-span-2 space-y-6">
                            <Card>
                                <CardContent className="p-6 space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Name <span className="text-destructive">*</span></Label>
                                        <Input
                                            id="name"
                                            placeholder="e.g. AI Copilot"
                                            {...register('name')}
                                            disabled={isView}
                                        />
                                        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="description">Description</Label>
                                        <Textarea
                                            id="description"
                                            placeholder="Short description of the add-on"
                                            {...register('description')}
                                            disabled={isView}
                                            rows={3}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Dynamic Features */}
                            <Card>
                                <CardContent className="p-6 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-base font-semibold">Features</Label>
                                    </div>

                                    {!isView && (
                                        <div className="flex gap-2 items-end max-w-md">
                                            <div className="flex-1 space-y-2">
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
                                            <p className="text-sm text-muted-foreground italic text-center py-4">
                                                No features key-values added/linked yet.
                                            </p>
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
                                                        className="text-destructive"
                                                        onClick={() => handleRemoveField(field.id)}
                                                    >
                                                        <X size={18} />
                                                    </Button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Sidebar / Configuration */}
                        <div className="space-y-6">
                            <Card>
                                <CardContent className="p-6 space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="amount">Amount (₹) <span className="text-destructive">*</span></Label>
                                        <Input
                                            id="amount"
                                            type="number"
                                            placeholder="0.00"
                                            {...register('amount')}
                                            disabled={isView}
                                        />
                                        {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="type">Type <span className="text-destructive">*</span></Label>
                                        <Controller
                                            control={control}
                                            name="type"
                                            render={({ field }) => (
                                                <Select
                                                    value={field.value}
                                                    onValueChange={field.onChange}
                                                    disabled={isView}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select type" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="recurring">Recurring (Monthly)</SelectItem>
                                                        <SelectItem value="one_time">One-time</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                        {errors.type && <p className="text-sm text-destructive">{errors.type.message}</p>}
                                    </div>

                                    <div className="pt-2">
                                        <Controller
                                            control={control}
                                            name="is_active"
                                            render={({ field }) => (
                                                <StatusSwitch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                    label="Active Status"
                                                    description="Visible to customers"
                                                    disabled={isView}
                                                />
                                            )}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {!isView && (
                        <div className="flex justify-end gap-3">
                            <Button
                                variant="outline"
                                onClick={() => navigate('/subscription?tab=addons')}
                            >
                                Cancel
                            </Button>

                            <Button
                                onClick={handleFormSubmit(handleSubmit)}
                                disabled={isLoading}
                            >
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isEdit ? 'Save Changes' : 'Create Add-on'}
                            </Button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
