import React, { useState } from 'react';
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
import { ArrowLeft } from 'lucide-react';

export default function FAQCreatePage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const action = searchParams.get('action');
    const id = searchParams.get('id');
    const isView = action === 'view';
    const isEdit = action === 'edit';

    // Form state
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState('');
    const [category, setCategory] = useState('');
    const [status, setStatus] = useState<string>('draft');
    const [order, setOrder] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            question,
            answer,
            category,
            status,
            order: parseInt(order),
        };
        console.log('FAQ Payload:', payload);
        navigate('/faq');
    };

    return (
        <div className="space-y-6 pt-4">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate('/faq')}
                >
                    <ArrowLeft size={20} />
                </Button>
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">
                        {isView ? 'View' : isEdit ? 'Edit' : 'Create'} FAQ
                    </h1>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-card border border-border rounded-lg p-6 space-y-6">
                    {/* Question */}
                    <div className="space-y-2">
                        <Label htmlFor="question">Question *</Label>
                        <Input
                            id="question"
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            placeholder="Enter FAQ question"
                            disabled={isView}
                            required
                        />
                    </div>

                    {/* Answer */}
                    <div className="space-y-2">
                        <Label htmlFor="answer">Answer *</Label>
                        <Textarea
                            id="answer"
                            value={answer}
                            onChange={(e) => setAnswer(e.target.value)}
                            placeholder="Enter FAQ answer"
                            disabled={isView}
                            rows={6}
                            required
                        />
                    </div>

                    {/* Category and Order */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Category */}
                        <div className="space-y-2">
                            <Label htmlFor="category">Category *</Label>
                            <Select value={category} onValueChange={setCategory} disabled={isView}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="general">General</SelectItem>
                                    <SelectItem value="subscriptions">Subscriptions</SelectItem>
                                    <SelectItem value="users">Users</SelectItem>
                                    <SelectItem value="billing">Billing</SelectItem>
                                    <SelectItem value="technical">Technical</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Order */}
                        <div className="space-y-2">
                            <Label htmlFor="order">Display Order</Label>
                            <Input
                                id="order"
                                type="number"
                                value={order}
                                onChange={(e) => setOrder(e.target.value)}
                                placeholder="Enter display order"
                                disabled={isView}
                                min="1"
                            />
                            <p className="text-xs text-muted-foreground">
                                Lower numbers appear first
                            </p>
                        </div>
                    </div>

                    {/* Status */}
                    <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <div className="flex items-center gap-3 p-3 border border-border rounded-lg bg-muted/30">
                            <Switch
                                id="status"
                                checked={status === 'published'}
                                onCheckedChange={(checked) => setStatus(checked ? 'published' : 'draft')}
                                disabled={isView}
                            />
                            <div className="flex-1">
                                <p className="text-sm font-medium">
                                    {status === 'published' ? 'Published' : 'Draft'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {status === 'published'
                                        ? 'FAQ is visible to users'
                                        : 'FAQ is hidden from users'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                {!isView && (
                    <div className="flex justify-end gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => navigate('/faq')}
                        >
                            Cancel
                        </Button>
                        <Button type="submit">
                            {isEdit ? 'Update' : 'Create'} FAQ
                        </Button>
                    </div>
                )}
            </form>
        </div>
    );
}
