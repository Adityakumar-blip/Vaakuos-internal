import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Loader2 } from 'lucide-react';
import {
    useGetMasterByIdQuery,
    useAddMasterMutation,
    useUpdateMasterMutation,
} from '@/store/api/mastersApi';
import { type FAQCategory, type FAQCategoryFormData } from './types';

const FAQ_CATEGORIES_URL = '/faq-categories';

export default function FAQCategoryCreatePage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const action = searchParams.get('action');
    const id = searchParams.get('id');
    const isView = action === 'view';
    const isEdit = action === 'edit';

    const [formData, setFormData] = useState<FAQCategoryFormData>({
        name: '',
        code: '',
        description: '',
        is_active: true,
        order: 1,
    });

    const { data: response, isLoading: isFetching } = useGetMasterByIdQuery(
        { url: FAQ_CATEGORIES_URL, id: id || '' },
        { skip: !id }
    );

    const category = (response as { data?: FAQCategory })?.data;

    const [addCategory, { isLoading: isCreating }] = useAddMasterMutation();
    const [updateCategory, { isLoading: isUpdating }] = useUpdateMasterMutation();

    useEffect(() => {
        if (category) {
            setFormData({
                name: category.name,
                code: category.code,
                description: category.description || '',
                is_active: category.is_active,
                order: category.order,
            });
        }
    }, [category]);

    const handleInputChange = (field: keyof FAQCategoryFormData, value: string | boolean | number) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const payload = {
                name: formData.name,
                code: formData.code,
                description: formData.description,
                is_active: formData.is_active,
                order: formData.order,
            };

            if (isEdit && id) {
                await updateCategory({
                    url: FAQ_CATEGORIES_URL,
                    id,
                    data: payload,
                }).unwrap();
            } else {
                await addCategory({
                    url: FAQ_CATEGORIES_URL,
                    data: payload,
                }).unwrap();
            }

            navigate('/master/faq-categories');
        } catch (error) {
            console.error('Failed to save FAQ category:', error);
        }
    };

    const isLoading = isCreating || isUpdating;

    return (
        <div className="space-y-6 pt-4">
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate('/master/faq-categories')}
                >
                    <ArrowLeft size={20} />
                </Button>
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">
                        {isView ? 'View' : isEdit ? 'Edit' : 'Create'} FAQ Category
                    </h1>
                </div>
            </div>

            {isFetching ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="bg-card border border-border rounded-lg p-6 space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                placeholder="Enter category name (e.g., General)"
                                disabled={isView}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="code">Code *</Label>
                            <Input
                                id="code"
                                value={formData.code}
                                onChange={(e) => handleInputChange('code', e.target.value)}
                                placeholder="Enter category code (e.g., general)"
                                disabled={isView}
                                required
                            />
                            <p className="text-xs text-muted-foreground">
                                Internal identifier (lowercase, underscores)
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => handleInputChange('description', e.target.value)}
                                placeholder="Enter category description"
                                disabled={isView}
                                rows={3}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="order">Display Order *</Label>
                                <Input
                                    id="order"
                                    type="number"
                                    value={formData.order}
                                    onChange={(e) => handleInputChange('order', parseInt(e.target.value))}
                                    placeholder="Enter display order"
                                    disabled={isView}
                                    required
                                    min="1"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Lower numbers appear first
                                </p>
                            </div>

                            <div className="space-y-2">
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
                                                ? 'Category is available for use'
                                                : 'Category is hidden'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {!isView && (
                        <div className="flex justify-end gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => navigate('/master/faq-categories')}
                                disabled={isLoading}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isEdit ? 'Update' : 'Create'} FAQ Category
                            </Button>
                        </div>
                    )}
                </form>
            )}
        </div>
    );
}
