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
import { ArrowLeft, RefreshCw, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { 
    useCreateCouponMutation, 
    useUpdateCouponMutation, 
    useGetCouponQuery,
    type CreateCouponDto 
} from '@/store/api/couponApi';
import { format } from 'date-fns';

export default function CouponCreatePage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const action = searchParams.get('action');
    const id = searchParams.get('id');
    const isView = action === 'view';
    const isEdit = action === 'edit';

    // API Hooks
    const { data: couponData, isLoading: isFetching } = useGetCouponQuery(id!, { skip: !id });
    const [createCoupon, { isLoading: isCreating }] = useCreateCouponMutation();
    const [updateCoupon, { isLoading: isUpdating }] = useUpdateCouponMutation();

    // Form state
    const [formData, setFormData] = useState<CreateCouponDto>({
        code: '',
        description: '',
        type: 'percentage',
        value: 0,
        min_purchase_amount: 0,
        max_discount_amount: 0,
        starts_at: '',
        expires_at: '',
        usage_limit: 100,
        is_active: true,
        metadata: {},
    });

    useEffect(() => {
        if (couponData) {
            setFormData({
                code: couponData.code,
                description: couponData.description || '',
                type: couponData.type,
                value: couponData.value,
                min_purchase_amount: couponData.min_purchase_amount || 0,
                max_discount_amount: couponData.max_discount_amount || 0,
                starts_at: couponData.starts_at ? format(new Date(couponData.starts_at), 'yyyy-MM-dd') : '',
                expires_at: couponData.expires_at ? format(new Date(couponData.expires_at), 'yyyy-MM-dd') : '',
                usage_limit: couponData.usage_limit || 0,
                is_active: couponData.is_active,
                metadata: couponData.metadata || {},
            });
        }
    }, [couponData]);

    const handleChange = (field: keyof CreateCouponDto, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const generateCouponCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 10; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        handleChange('code', code);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Clean up data before sending
        const payload = { ...formData };
        if (!payload.starts_at) delete payload.starts_at;
        else payload.starts_at = new Date(payload.starts_at).toISOString();
        
        if (!payload.expires_at) delete payload.expires_at;
        else payload.expires_at = new Date(payload.expires_at).toISOString();

        if (payload.usage_limit === 0) delete payload.usage_limit;

        try {
            if (isEdit && id) {
                await updateCoupon({ id, body: payload }).unwrap();
                toast.success('Coupon updated successfully');
            } else {
                await createCoupon(payload).unwrap();
                toast.success('Coupon created successfully');
            }
            navigate('/coupon');
        } catch (error: any) {
            toast.error(error?.data?.message || 'Failed to save coupon');
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
                        onClick={() => navigate('/coupon')}
                    >
                        <ArrowLeft size={20} />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-semibold text-foreground">
                            {isView ? 'View' : isEdit ? 'Edit' : 'Create'} Coupon
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            {isView ? 'Review the details of this coupon code.' : 'Configure promotional discount codes for your customers.'}
                        </p>
                    </div>
                </div>
                {!isView && (
                    <div className="flex gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => navigate('/coupon')}
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
                            {isEdit ? 'Update' : 'Create'} Coupon
                        </Button>
                    </div>
                )}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6">
                        <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">General Information</h3>
                        
                        {/* Coupon Code with Auto Generate */}
                        <div className="space-y-2">
                            <Label htmlFor="code">Coupon Code *</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="code"
                                    value={formData.code}
                                    onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
                                    placeholder="e.g. SUMMER50"
                                    disabled={isView}
                                    required
                                    className="flex-1 font-mono uppercase"
                                />
                                {!isView && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={generateCouponCode}
                                        className="flex-shrink-0"
                                    >
                                        <RefreshCw size={16} className="mr-2" />
                                        Auto Generate
                                    </Button>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => handleChange('description', e.target.value)}
                                placeholder="What is this coupon for?"
                                disabled={isView}
                                className="resize-none"
                                rows={3}
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="type">Discount Type</Label>
                                <Select 
                                    value={formData.type} 
                                    onValueChange={(v) => handleChange('type', v)} 
                                    disabled={isView}
                                >
                                    <SelectTrigger id="type">
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                                        <SelectItem value="fixed_amount">Fixed Amount (₹)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="value">Discount Value *</Label>
                                <div className="relative">
                                    <Input
                                        id="value"
                                        type="number"
                                        value={formData.value}
                                        onChange={(e) => handleChange('value', parseFloat(e.target.value))}
                                        placeholder="0.00"
                                        disabled={isView}
                                        required
                                        min="0"
                                        step="0.01"
                                        className="pr-8"
                                    />
                                    <span className="absolute right-3 top-2.5 text-muted-foreground text-sm">
                                        {formData.type === 'percentage' ? '%' : '₹'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6">
                        <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Restrictions & Limits</h3>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="min_purchase_amount">Min Purchase Amount</Label>
                                <Input
                                    id="min_purchase_amount"
                                    type="number"
                                    value={formData.min_purchase_amount}
                                    onChange={(e) => handleChange('min_purchase_amount', parseFloat(e.target.value))}
                                    placeholder="0.00"
                                    disabled={isView}
                                    min="0"
                                    step="0.01"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="max_discount_amount">Max Discount Amount</Label>
                                <Input
                                    id="max_discount_amount"
                                    type="number"
                                    value={formData.max_discount_amount}
                                    onChange={(e) => handleChange('max_discount_amount', parseFloat(e.target.value))}
                                    placeholder="0.00"
                                    disabled={isView}
                                    min="0"
                                    step="0.01"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="usage_limit">Total Usage Limit</Label>
                                <Input
                                    id="usage_limit"
                                    type="number"
                                    value={formData.usage_limit}
                                    onChange={(e) => handleChange('usage_limit', parseInt(e.target.value))}
                                    placeholder="Unlimited"
                                    disabled={isView}
                                    min="0"
                                />
                                <p className="text-[10px] text-muted-foreground">Set 0 for unlimited uses.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6">
                        <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Status & Validity</h3>
                        
                        <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-muted/20">
                            <div className="space-y-0.5">
                                <Label className="text-sm">Status</Label>
                                <p className="text-xs text-muted-foreground">
                                    {formData.is_active ? 'Currently Active' : 'Currently Inactive'}
                                </p>
                            </div>
                            <Switch
                                checked={formData.is_active}
                                onCheckedChange={(checked) => handleChange('is_active', checked)}
                                disabled={isView}
                            />
                        </div>

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
                        <h4 className="text-sm font-semibold text-primary">Need Help?</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Coupons allow you to provide discounts to your users. 
                            You can set a fixed amount or a percentage. 
                            Usage limits and expiry dates help you control your promotion campaigns.
                        </p>
                    </div>
                </div>
            </form>
        </div>
    );
}
