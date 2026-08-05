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
import { ArrowLeft, RefreshCw, Save } from 'lucide-react';
import { toast } from 'sonner';
import { 
    useCreateOfferMutation, 
    useUpdateOfferMutation, 
    useGetOfferQuery,
    type CreateOfferDto 
} from '@/store/api/offerApi';
import { format } from 'date-fns';

export default function OfferCreatePage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const action = searchParams.get('action');
    const id = searchParams.get('id');
    const isView = action === 'view';
    const isEdit = action === 'edit';

    // API Hooks
    const { data: offerData, isLoading: isFetching } = useGetOfferQuery(id!, { skip: !id });
    const [createOffer, { isLoading: isCreating }] = useCreateOfferMutation();
    const [updateOffer, { isLoading: isUpdating }] = useUpdateOfferMutation();

    // Form state
    const [formData, setFormData] = useState<CreateOfferDto>({
        name: '',
        description: '',
        type: 'discount',
        status: 'active',
        starts_at: '',
        expires_at: '',
        conditions: {},
        benefit: {},
        metadata: {},
    });

    useEffect(() => {
        if (offerData) {
            setFormData({
                name: offerData.name,
                description: offerData.description || '',
                type: offerData.type,
                status: offerData.status,
                starts_at: offerData.starts_at ? format(new Date(offerData.starts_at), 'yyyy-MM-dd') : '',
                expires_at: offerData.expires_at ? format(new Date(offerData.expires_at), 'yyyy-MM-dd') : '',
                conditions: offerData.conditions || {},
                benefit: offerData.benefit || {},
                metadata: offerData.metadata || {},
            });
        }
    }, [offerData]);

    const handleChange = (field: keyof CreateOfferDto, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Clean up data before sending
        const payload = { ...formData };
        if (!payload.starts_at) delete payload.starts_at;
        else payload.starts_at = new Date(payload.starts_at).toISOString();
        
        if (!payload.expires_at) delete payload.expires_at;
        else payload.expires_at = new Date(payload.expires_at).toISOString();

        try {
            if (isEdit && id) {
                await updateOffer({ id, body: payload }).unwrap();
                toast.success('Offer updated successfully');
            } else {
                await createOffer(payload).unwrap();
                toast.success('Offer created successfully');
            }
            navigate('/offer');
        } catch (error: any) {
            toast.error(error?.data?.message || 'Failed to save offer');
        }
    };

    if (isFetching) {
        return <div className="flex items-center justify-center h-[400px]">Loading...</div>;
    }

    return (
        <div className="space-y-6 pt-4 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate('/offer')}
                    >
                        <ArrowLeft size={20} />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-semibold text-foreground">
                            {isView ? 'View' : isEdit ? 'Edit' : 'Create'} Offer
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            {isView ? 'Review offer details.' : 'Create seasonal or promotional offers for your store.'}
                        </p>
                    </div>
                </div>
                {!isView && (
                    <div className="flex gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => navigate('/offer')}
                            disabled={isCreating || isUpdating}
                        >
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleSubmit}
                            disabled={isCreating || isUpdating}
                        >
                            {isCreating || isUpdating ? (
                                <RefreshCw size={16} className="mr-2 animate-spin" />
                            ) : (
                                <Save size={16} className="mr-2" />
                            )}
                            {isEdit ? 'Update' : 'Create'} Offer
                        </Button>
                    </div>
                )}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6">
                        <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">General Information</h3>
                        
                        <div className="space-y-2">
                            <Label htmlFor="name">Offer Name *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => handleChange('name', e.target.value)}
                                placeholder="e.g. Summer Sale, Diwali Special"
                                disabled={isView}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => handleChange('description', e.target.value)}
                                placeholder="Describe the offer..."
                                disabled={isView}
                                className="resize-none"
                                rows={3}
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="type">Offer Type</Label>
                                <Select 
                                    value={formData.type} 
                                    onValueChange={(v) => handleChange('type', v)} 
                                    disabled={isView}
                                >
                                    <SelectTrigger id="type">
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="discount">Discount</SelectItem>
                                        <SelectItem value="bogo">Buy One Get One (BOGO)</SelectItem>
                                        <SelectItem value="free_shipping">Free Shipping</SelectItem>
                                        <SelectItem value="buy_x_get_y">Buy X Get Y</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="status">Initial Status</Label>
                                <Select 
                                    value={formData.status} 
                                    onValueChange={(v) => handleChange('status', v)} 
                                    disabled={isView}
                                >
                                    <SelectTrigger id="status">
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="inactive">Inactive</SelectItem>
                                        <SelectItem value="scheduled">Scheduled</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6">
                        <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Offer Strategy (Draft)</h3>
                        <p className="text-xs text-muted-foreground italic">
                            Advanced conditions and benefits can be configured via metadata for now. 
                            Full UI for rules engine coming soon.
                        </p>
                        
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Benefits / Conditions (Advanced JSON)</Label>
                                <Textarea
                                    value={JSON.stringify({ ...formData.conditions, ...formData.benefit }, null, 2)}
                                    onChange={(e) => {
                                        try {
                                            const val = JSON.parse(e.target.value);
                                            handleChange('metadata', { ...formData.metadata, raw_config: val });
                                        } catch (e) {}
                                    }}
                                    placeholder="{}"
                                    className="font-mono text-xs"
                                    rows={5}
                                    disabled={isView}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6">
                        <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Validity Period</h3>
                        
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="starts_at">Starts At</Label>
                                <Input
                                    id="starts_at"
                                    type="date"
                                    value={formData.starts_at}
                                    onChange={(e) => handleChange('starts_at', e.target.value)}
                                    disabled={isView}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="expires_at">Expires At</Label>
                                <Input
                                    id="expires_at"
                                    type="date"
                                    value={formData.expires_at}
                                    onChange={(e) => handleChange('expires_at', e.target.value)}
                                    disabled={isView}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 space-y-4">
                        <h4 className="text-sm font-semibold text-primary">Marketing Tip</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Seasonal offers usually perform 40% better than general discounts. 
                            Set clear start and end dates to create urgency.
                        </p>
                    </div>
                </div>
            </form>
        </div>
    );
}
