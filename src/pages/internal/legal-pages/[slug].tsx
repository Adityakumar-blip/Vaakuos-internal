import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
import { ArrowLeft, Save } from 'lucide-react';
import { RichEditor } from '@/components/common/RichEditor';
import {
    useGetLegalPagesQuery,
    useUpsertLegalPageMutation,
    LEGAL_PAGE_SLUGS,
    type LegalPageSlug,
    type UpsertLegalPageDto,
} from '@/store/api/legalPagesApi';
import { toast } from 'sonner';
import { format } from 'date-fns';

const PAGE_TITLES: Record<LegalPageSlug, string> = {
    'privacy-policy': 'Privacy Policy',
    'terms-of-service': 'Terms of Service',
    'cookie-policy': 'Cookie Policy',
};

export default function LegalPageEditPage() {
    const navigate = useNavigate();
    const { slug } = useParams<{ slug: string }>();
    const isValidSlug = LEGAL_PAGE_SLUGS.includes(slug as LegalPageSlug);

    const { data: pages, isLoading } = useGetLegalPagesQuery(undefined, { skip: !isValidSlug });
    const [upsertLegalPage, { isLoading: isSaving }] = useUpsertLegalPageMutation();

    const page = pages?.find((p) => p.slug === slug);

    const [formData, setFormData] = useState<UpsertLegalPageDto>({
        title: '',
        content: '',
        meta_title: '',
        meta_description: '',
        status: 'draft',
        effective_date: format(new Date(), 'yyyy-MM-dd'),
    });

    useEffect(() => {
        if (page) {
            setFormData({
                title: page.title,
                content: page.content,
                meta_title: page.meta_title || '',
                meta_description: page.meta_description || '',
                status: page.status,
                effective_date: page.effective_date ? page.effective_date.slice(0, 10) : format(new Date(), 'yyyy-MM-dd'),
            });
        } else if (isValidSlug) {
            setFormData((prev) => ({ ...prev, title: PAGE_TITLES[slug as LegalPageSlug] }));
        }
    }, [page, isValidSlug, slug]);

    if (!isValidSlug) {
        return (
            <div className="p-8 text-center text-muted-foreground">
                Unknown legal page "{slug}". Only privacy-policy, terms-of-service and cookie-policy are supported.
            </div>
        );
    }

    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground">Loading page...</div>;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await upsertLegalPage({ slug: slug as LegalPageSlug, body: formData }).unwrap();
            toast.success('Legal page saved successfully');
            navigate('/legal-pages');
        } catch (error) {
            toast.error('Failed to save legal page');
        }
    };

    return (
        <div className="space-y-6 pt-4">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/legal-pages')}>
                        <ArrowLeft size={20} />
                    </Button>
                    <h1 className="text-2xl font-semibold text-foreground">Edit {PAGE_TITLES[slug as LegalPageSlug]}</h1>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={() => navigate('/legal-pages')}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSaving} className="gap-2">
                        <Save size={18} />
                        Save Changes
                    </Button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-card border border-border rounded-lg p-6 space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="title">Title *</Label>
                            <Input
                                id="title"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Page title"
                                required
                                className="text-lg font-medium"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="content">Content *</Label>
                            <RichEditor
                                value={formData.content}
                                onChange={(value) => setFormData({ ...formData, content: value })}
                                placeholder="Write the page content here..."
                            />
                        </div>
                    </div>

                    <div className="bg-card border border-border rounded-lg p-6 space-y-6">
                        <h2 className="text-sm font-semibold text-foreground">SEO Settings</h2>
                        <div className="space-y-2">
                            <Label htmlFor="meta_title">Meta Title</Label>
                            <Input
                                id="meta_title"
                                value={formData.meta_title}
                                onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                                placeholder="SEO title"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="meta_description">Meta Description</Label>
                            <Textarea
                                id="meta_description"
                                value={formData.meta_description}
                                onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                                placeholder="Brief description for search engines"
                                rows={3}
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-card border border-border rounded-lg p-6 space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="status">Publishing Status</Label>
                            <Select
                                value={formData.status}
                                onValueChange={(value) => setFormData({ ...formData, status: value as 'draft' | 'published' })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="draft">Draft</SelectItem>
                                    <SelectItem value="published">Published</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="effective_date">Last Updated / Effective Date</Label>
                            <Input
                                id="effective_date"
                                type="date"
                                value={formData.effective_date}
                                onChange={(e) => setFormData({ ...formData, effective_date: e.target.value })}
                            />
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
