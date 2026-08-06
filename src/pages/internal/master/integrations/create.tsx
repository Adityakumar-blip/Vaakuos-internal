import { useEffect } from 'react';
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
import { toast } from 'sonner';
import { z } from 'zod';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    useGetIntegrationQuery,
    useCreateIntegrationMutation,
    useUpdateIntegrationMutation,
    IntegrationStatus,
    INTEGRATION_STATUS_OPTIONS,
} from '@/store/api/integrationsApi';

const integrationSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    provider: z
        .string()
        .min(1, 'Provider is required')
        .regex(/^[a-z0-9_-]+$/, 'Provider must contain only lowercase letters, numbers, hyphens and underscores'),
    description: z.string().optional(),
    icon_url: z.string().url('Must be a valid URL').or(z.literal('')).optional(),
    status: z.nativeEnum(IntegrationStatus),
    is_enabled: z.boolean().default(true),
    config: z
        .string()
        .optional()
        .refine((v) => {
            if (!v?.trim()) return true;
            try {
                return typeof JSON.parse(v) === 'object';
            } catch {
                return false;
            }
        }, 'Config must be a valid JSON object'),
});

type IntegrationFormValues = z.infer<typeof integrationSchema>;

export default function IntegrationCreatePage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const action = searchParams.get('action');
    const id = searchParams.get('id');
    const isView = action === 'view';
    const isEdit = action === 'edit';

    const { data: integration, isLoading: isFetching } = useGetIntegrationQuery(id || '', {
        skip: !id,
    });

    const [createIntegration, { isLoading: isCreating }] = useCreateIntegrationMutation();
    const [updateIntegration, { isLoading: isUpdating }] = useUpdateIntegrationMutation();

    const {
        register,
        handleSubmit: handleFormSubmit,
        control,
        reset,
        formState: { errors },
    } = useForm<IntegrationFormValues>({
        resolver: zodResolver(integrationSchema),
        defaultValues: {
            name: '',
            provider: '',
            description: '',
            icon_url: '',
            status: IntegrationStatus.DISCONNECTED,
            is_enabled: true,
            config: '',
        },
    });

    useEffect(() => {
        if (integration) {
            reset({
                name: integration.name,
                provider: integration.provider,
                description: integration.description || '',
                icon_url: integration.icon_url || '',
                status: integration.status,
                is_enabled: integration.is_enabled,
                config: integration.config ? JSON.stringify(integration.config, null, 2) : '',
            });
        }
    }, [integration, reset]);

    const handleSubmit = async (data: IntegrationFormValues) => {
        try {
            const payload = {
                name: data.name,
                provider: data.provider,
                description: data.description || undefined,
                icon_url: data.icon_url || undefined,
                status: data.status,
                is_enabled: data.is_enabled,
                config: data.config?.trim() ? JSON.parse(data.config) : undefined,
            };

            if (isEdit && id) {
                await updateIntegration({ id, body: payload }).unwrap();
                toast.success('Integration updated successfully');
            } else {
                await createIntegration(payload).unwrap();
                toast.success('Integration created successfully');
            }

            navigate('/master/integrations');
        } catch (error: any) {
            toast.error(error?.data?.message || 'Failed to save integration');
        }
    };

    const isLoading = isCreating || isUpdating;

    return (
        <div className="space-y-6 pt-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/master/integrations')}>
                        <ArrowLeft size={20} />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-semibold text-foreground">
                            {isView ? 'View' : isEdit ? 'Edit' : 'Add'} Integration
                        </h1>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => navigate('/master/integrations')}>
                        {isView ? 'Back' : 'Cancel'}
                    </Button>

                    {!isView && (
                        <Button onClick={handleFormSubmit(handleSubmit)} disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isEdit ? 'Update' : 'Add'} Integration
                        </Button>
                    )}

                    {isView && id && (
                        <Button onClick={() => navigate(`/master/integrations/create?id=${id}&action=edit`)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Integration
                        </Button>
                    )}
                </div>
            </div>

            {isFetching ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="bg-card border border-border rounded-lg p-6 space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name *</Label>
                            <Input
                                id="name"
                                {...register('name')}
                                placeholder="Enter integration name (e.g., WooCommerce)"
                                disabled={isView}
                            />
                            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="provider">Provider *</Label>
                            <Input
                                id="provider"
                                {...register('provider')}
                                placeholder="Enter provider key (e.g., woocommerce)"
                                disabled={isView || isEdit}
                            />
                            <p className="text-xs text-muted-foreground">
                                Unique identifier used by the backend — cannot be changed once created
                            </p>
                            {errors.provider && (
                                <p className="text-sm text-destructive">{errors.provider.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                {...register('description')}
                                placeholder="Enter integration description"
                                disabled={isView}
                                rows={3}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="icon_url">Icon URL</Label>
                            <Input
                                id="icon_url"
                                {...register('icon_url')}
                                placeholder="https://cdn.example.com/woocommerce.svg"
                                disabled={isView}
                            />
                            {errors.icon_url && (
                                <p className="text-sm text-destructive">{errors.icon_url.message}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="status">Status *</Label>
                                <Controller
                                    control={control}
                                    name="status"
                                    render={({ field }) => (
                                        <Select
                                            value={field.value}
                                            onValueChange={field.onChange}
                                            disabled={isView}
                                        >
                                            <SelectTrigger id="status">
                                                <SelectValue placeholder="Select status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {INTEGRATION_STATUS_OPTIONS.map((option) => (
                                                    <SelectItem key={option.value} value={option.value}>
                                                        {option.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                {errors.status && (
                                    <p className="text-sm text-destructive">{errors.status.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="is_enabled">Enabled</Label>
                                <Controller
                                    control={control}
                                    name="is_enabled"
                                    render={({ field }) => (
                                        <div className="flex items-center gap-3 p-3 border border-border rounded-lg bg-muted/30">
                                            <Switch
                                                id="is_enabled"
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                                disabled={isView}
                                            />
                                            <p className="text-sm font-medium">
                                                {field.value ? 'Available to users' : 'Hidden from users'}
                                            </p>
                                        </div>
                                    )}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="config">Config (JSON)</Label>
                            <Textarea
                                id="config"
                                {...register('config')}
                                placeholder='{ "api_url": "https://..." }'
                                disabled={isView}
                                rows={6}
                                className="font-mono text-sm"
                            />
                            <p className="text-xs text-muted-foreground">
                                Optional provider-specific settings
                            </p>
                            {errors.config && (
                                <p className="text-sm text-destructive">{errors.config.message}</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
