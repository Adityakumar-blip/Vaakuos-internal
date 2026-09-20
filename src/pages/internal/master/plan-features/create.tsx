import React, { useState, useEffect } from 'react';
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
import { ArrowLeft, Loader2, Edit } from 'lucide-react';
import {
    useGetMasterByIdQuery,
    useAddMasterMutation,
    useUpdateMasterMutation,
} from '@/store/api/mastersApi';
import {
    type PlanFeature,
    FeatureType,
    FEATURE_TYPE_OPTIONS,
    COUNT_MODEL_OPTIONS,
    MODULE_PREFIX,
} from './types';
import { useGetMastersQuery } from '@/store/api/mastersApi';
import { z } from 'zod';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const PLAN_FEATURES_URL = '/plan-features';

/**
 * Empty means "no default", which the backend stores as NULL and treats as
 * fail-open — deliberately different from a default of 0 or false.
 */
function parseDefaultValue(raw: string | undefined, type: FeatureType) {
    const value = (raw ?? '').trim();
    if (value === '') return null;
    if (type === FeatureType.BOOLEAN) return value === 'true';
    if (type === FeatureType.NUMBER) return Number(value);
    return value;
}

// Zod Schema
const featureSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    code: z.string()
        .min(1, 'Code is required')
        .regex(
            /^[a-z0-9_]+(\.[a-z0-9_]+)*$/,
            'Lowercase letters, numbers and underscores, optionally dot-separated (e.g. module.campaigns)',
        ),
    description: z.string().optional(),
    type: z.nativeEnum(FeatureType, {
        errorMap: () => ({ message: 'Please select a valid feature type' }),
    }),
    is_active: z.boolean().default(true),
    module_key: z.string().optional(),
    count_model: z.string().optional(),
    // Kept as text so "no default" and "0" stay distinguishable; coerced on submit.
    default_value: z.string().optional(),
});

type FeatureFormValues = z.infer<typeof featureSchema>;

export default function PlanFeatureCreatePage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const action = searchParams.get('action');
    const id = searchParams.get('id');
    const isView = action === 'view';
    const isEdit = action === 'edit';

    // Fetch feature data if editing or viewing
    const { data: response, isLoading: isFetching } = useGetMasterByIdQuery(
        { url: PLAN_FEATURES_URL, id: id || '' },
        { skip: !id }
    );

    const feature = (response as { data?: PlanFeature })?.data || (response as PlanFeature);

    // API mutations
    const [addFeature, { isLoading: isCreating }] = useAddMasterMutation();
    const [updateFeature, { isLoading: isUpdating }] = useUpdateMasterMutation();

    // React Hook Form
    const {
        register,
        handleSubmit: handleFormSubmit,
        control,
        reset,
        watch,
        formState: { errors },
    } = useForm<FeatureFormValues>({
        resolver: zodResolver(featureSchema),
        defaultValues: {
            name: '',
            code: '',
            description: '',
            type: FeatureType.STRING,
            is_active: true,
            module_key: '',
            count_model: '',
            default_value: '',
        },
    });

    const watchedType = watch('type');
    const watchedCode = watch('code');
    const isModuleGate = (watchedCode || '').startsWith(MODULE_PREFIX);

    // Existing module keys, so a new feature joins a module instead of coining
    // a near-miss spelling of one that already exists.
    const { data: dropdownData } = useGetMastersQuery({ url: '/plan-features/features-dropdown' });
    const knownModules = React.useMemo(() => {
        const rows = (Array.isArray(dropdownData)
            ? dropdownData
            : (dropdownData as { data?: PlanFeature[] })?.data) ?? [];
        return [...new Set(rows.map((r) => r.module_key).filter(Boolean))].sort() as string[];
    }, [dropdownData]);

    // Populate form when data is fetched
    useEffect(() => {
        if (feature) {
            reset({
                name: feature.name,
                code: feature.code,
                description: feature.description || '',
                type: feature.type,
                is_active: feature.is_active,
                module_key: feature.module_key ?? '',
                count_model: feature.count_model ?? '',
                default_value:
                    feature.default_value === null || feature.default_value === undefined
                        ? ''
                        : String(feature.default_value),
            });
        }
    }, [feature, reset]);

    const handleSubmit = async (data: FeatureFormValues) => {
        try {
            const payload = {
                name: data.name,
                code: data.code,
                description: data.description,
                type: data.type,
                is_active: data.is_active,
                module_key: data.module_key?.trim() || null,
                count_model: data.count_model || null,
                default_value: parseDefaultValue(data.default_value, data.type),
            };

            if (isEdit && id) {
                await updateFeature({
                    url: PLAN_FEATURES_URL,
                    id,
                    data: payload,
                }).unwrap();
            } else {
                await addFeature({
                    url: PLAN_FEATURES_URL,
                    data: payload,
                }).unwrap();
            }

            navigate('/master/plan-features');
        } catch (error) {
            console.error('Failed to save plan feature:', error);
        }
    };

    const isLoading = isCreating || isUpdating;

    return (
        <div className="space-y-6 pt-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate('/master/plan-features')}
                    >
                        <ArrowLeft size={20} />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-semibold text-foreground">
                            {isView ? 'View' : isEdit ? 'Edit' : 'Create'} Plan Feature
                        </h1>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => navigate('/master/plan-features')}
                    >
                        {isView ? 'Back' : 'Cancel'}
                    </Button>

                    {!isView && (
                        <Button
                            onClick={handleFormSubmit(handleSubmit)}
                            disabled={isLoading}
                        >
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isEdit ? 'Update' : 'Create'} Plan Feature
                        </Button>
                    )}

                    {isView && id && (
                        <Button onClick={() => navigate(`/master/plan-features/create?id=${id}&action=edit`)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Plan Feature
                        </Button>
                    )}
                </div>
            </div>

            {/* Loading State */}
            {isFetching ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                /* Form Content */
                <div className="space-y-6">
                    <div className="bg-card border border-border rounded-lg p-6 space-y-6">
                        {/* Name */}
                        <div className="space-y-2">
                            <Label htmlFor="name">Name *</Label>
                            <Input
                                id="name"
                                {...register('name')}
                                placeholder="Enter feature name (e.g., Team Members)"
                                disabled={isView}
                            />
                            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                        </div>

                        {/* Code */}
                        <div className="space-y-2">
                            <Label htmlFor="code">Code *</Label>
                            <Input
                                id="code"
                                {...register('code')}
                                placeholder="Enter feature code (e.g., max_team_members)"
                                disabled={isView}
                            />
                            <p className="text-xs text-muted-foreground">
                                This will be used as the internal identifier (lowercase, underscores)
                            </p>
                            {errors.code && <p className="text-sm text-destructive">{errors.code.message}</p>}
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                {...register('description')}
                                placeholder="Enter feature description"
                                disabled={isView}
                                rows={3}
                            />
                        </div>

                        {/* Type and Status */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Type */}
                            <div className="space-y-2">
                                <Label htmlFor="type">Type *</Label>
                                <Controller
                                    control={control}
                                    name="type"
                                    render={({ field }) => (
                                        <Select
                                            value={field.value}
                                            onValueChange={field.onChange}
                                            disabled={isView}
                                        >
                                            <SelectTrigger id="type">
                                                <SelectValue placeholder="Select feature type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {FEATURE_TYPE_OPTIONS.map((option) => (
                                                    <SelectItem key={option.value} value={option.value}>
                                                        {option.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Data type for this feature value
                                </p>
                                {errors.type && <p className="text-sm text-destructive">{errors.type.message}</p>}
                            </div>

                            {/* Module */}
                            <div className="space-y-2">
                                <Label htmlFor="module_key">Module</Label>
                                <Input
                                    id="module_key"
                                    list="known-modules"
                                    {...register('module_key')}
                                    placeholder="e.g. campaigns — leave blank for account-wide"
                                    disabled={isView}
                                />
                                <datalist id="known-modules">
                                    {knownModules.map((m) => (
                                        <option key={m} value={m} />
                                    ))}
                                </datalist>
                                <p className="text-xs text-muted-foreground">
                                    Groups this feature under a module. Blank means it applies to the
                                    whole account and never locks a module.
                                </p>
                            </div>
                        </div>

                        {/* Enforcement */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Count model */}
                            <div className="space-y-2">
                                <Label htmlFor="count_model">Counted from</Label>
                                <Controller
                                    control={control}
                                    name="count_model"
                                    render={({ field }) => (
                                        <Select
                                            value={field.value || 'none'}
                                            onValueChange={(v) => field.onChange(v === 'none' ? '' : v)}
                                            disabled={isView || watchedType !== FeatureType.NUMBER}
                                        >
                                            <SelectTrigger id="count_model">
                                                <SelectValue placeholder="Not counted" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">Not counted</SelectItem>
                                                {COUNT_MODEL_OPTIONS.map((m) => (
                                                    <SelectItem key={m} value={m}>
                                                        {m}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                <p className="text-xs text-muted-foreground">
                                    {watchedType === FeatureType.NUMBER
                                        ? 'Usage is a live row count in this table. Leave unset for metered limits, which read from usage records instead.'
                                        : 'Only applies to number features.'}
                                </p>
                            </div>

                            {/* Default value */}
                            <div className="space-y-2">
                                <Label htmlFor="default_value">Free-tier default</Label>
                                {watchedType === FeatureType.BOOLEAN ? (
                                    <Controller
                                        control={control}
                                        name="default_value"
                                        render={({ field }) => (
                                            <Select
                                                value={field.value || 'unset'}
                                                onValueChange={(v) => field.onChange(v === 'unset' ? '' : v)}
                                                disabled={isView}
                                            >
                                                <SelectTrigger id="default_value">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="unset">No default</SelectItem>
                                                    <SelectItem value="true">Enabled</SelectItem>
                                                    <SelectItem value="false">Disabled</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                ) : (
                                    <Input
                                        id="default_value"
                                        type={watchedType === FeatureType.NUMBER ? 'number' : 'text'}
                                        {...register('default_value')}
                                        placeholder="No default"
                                        disabled={isView}
                                    />
                                )}
                                <p className="text-xs text-muted-foreground">
                                    What a tenant gets with no active plan. Leaving it blank keeps the
                                    feature out of the defaults entirely, which allows rather than blocks
                                    {isModuleGate ? ' — the safe setting for a module gate until every live plan lists its modules.' : '.'}
                                </p>
                            </div>

                            {/* Status */}
                            {/* <div className="space-y-2">
                                <Label htmlFor="is_active">Status</Label>
                                <div className="flex items-center gap-3 p-3 border border-border rounded-lg bg-muted/30">
                                    <Switch
                                        id="is_active"
                                        checked={formData.is_active}
                                        onCheckedChange={(checked) => handleInputChange('is_active', checked)}
                                        disabled={isView}
                                    />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">
                                            {formData.is_active ? 'Active' : 'Inactive'}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {formData.is_active
                                                ? 'Feature is available for use'
                                                : 'Feature is disabled'}
                                        </p>
                                    </div>
                                </div>
                            </div> */}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
