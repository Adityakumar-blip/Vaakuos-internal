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
import { type PlanFeature, FeatureType, FEATURE_TYPE_OPTIONS } from './types';
import { z } from 'zod';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const PLAN_FEATURES_URL = '/plan-features';

// Zod Schema
const featureSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    code: z.string()
        .min(1, 'Code is required')
        .regex(/^[a-z0-9_]+$/, 'Code must contain only lowercase letters, numbers, and underscores'),
    description: z.string().optional(),
    type: z.nativeEnum(FeatureType, {
        errorMap: () => ({ message: 'Please select a valid feature type' }),
    }),
    is_active: z.boolean().default(true),
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
        formState: { errors },
    } = useForm<FeatureFormValues>({
        resolver: zodResolver(featureSchema),
        defaultValues: {
            name: '',
            code: '',
            description: '',
            type: FeatureType.STRING,
            is_active: true,
        },
    });

    // Populate form when data is fetched
    useEffect(() => {
        if (feature) {
            reset({
                name: feature.name,
                code: feature.code,
                description: feature.description || '',
                type: feature.type,
                is_active: feature.is_active,
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
