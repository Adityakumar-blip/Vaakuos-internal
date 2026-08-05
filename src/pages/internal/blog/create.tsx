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
import { ArrowLeft, Save } from 'lucide-react';
import { RichEditor } from '@/components/common/RichEditor';
import {
    useCreateBlogMutation,
    useUpdateBlogMutation,
    useGetBlogQuery,
    useGetCategoriesQuery,
    useUploadMediaMutation,
    CreateBlogDto
} from '@/store/api/blogApi';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function BlogCreatePage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const id = searchParams.get('id');
    const isEdit = !!id;

    const { data: categoriesResult } = useGetCategoriesQuery({ page: 1, perPage: 100 });
    const categories = categoriesResult?.data ?? [];
    const { data: blog, isLoading: isBlogLoading } = useGetBlogQuery(id || '', { skip: !id });
    const [createBlog] = useCreateBlogMutation();
    const [updateBlog] = useUpdateBlogMutation();
    const [uploadMedia, { isLoading: isUploading }] = useUploadMediaMutation();

    const [formData, setFormData] = useState<CreateBlogDto>({
        title: '',
        slug: '',
        content: '',
        excerpt: '',
        featured_image: '',
        status: 'draft',
        category_id: undefined,
        meta_title: '',
        meta_description: '',
        utm_source: '',
        utm_medium: '',
        utm_campaign: '',
    });

    useEffect(() => {
        if (blog) {
            setFormData({
                title: blog.title,
                slug: blog.slug,
                content: blog.content,
                excerpt: blog.excerpt || '',
                featured_image: blog.featured_image || '',
                status: blog.status,
                category_id: blog.category_id,
                meta_title: blog.meta_title || '',
                meta_description: blog.meta_description || '',
                utm_source: blog.utm_source || '',
                utm_medium: blog.utm_medium || '',
                utm_campaign: blog.utm_campaign || '',
            });
        }
    }, [blog]);

    const handleTitleChange = (title: string) => {
        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        setFormData({ ...formData, title, slug });
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const uploadData = new FormData();
        uploadData.append('file', file);

        try {
            const response = await uploadMedia(uploadData).unwrap();
            setFormData({ ...formData, featured_image: response.url });
            toast.success('Image uploaded successfully');
        } catch (error) {
            toast.error('Failed to upload image');
            e.target.value = ''; // Reset input
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isEdit && id) {
                await updateBlog({ id, body: formData }).unwrap();
                toast.success('Blog updated successfully');
            } else {
                await createBlog(formData).unwrap();
                toast.success('Blog created successfully');
            }
            navigate('/blog');
        } catch (error) {
            // Handled by global toast
        }
    };

    if (id && isBlogLoading) {
        return <div className="p-8 text-center text-muted-foreground">Loading blog post...</div>;
    }

    return (
        <div className="space-y-6 pt-4">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate('/blog')}
                    >
                        <ArrowLeft size={20} />
                    </Button>
                    <h1 className="text-2xl font-semibold text-foreground">
                        {isEdit ? 'Edit' : 'Create'} Blog Post
                    </h1>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={() => navigate('/blog')}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} className="gap-2">
                        <Save size={18} />
                        {isEdit ? 'Update Post' : 'Publish Post'}
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
                                onChange={(e) => handleTitleChange(e.target.value)}
                                placeholder="Enter blog title"
                                required
                                className="text-lg font-medium"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="slug">Slug</Label>
                            <Input
                                id="slug"
                                value={formData.slug}
                                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                placeholder="blog-post-slug"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="content">Content *</Label>
                            <RichEditor
                                value={formData.content}
                                onChange={(value) => setFormData({ ...formData, content: value })}
                                placeholder="Write your blog content here..."
                                aiEnabled={true}
                            />
                        </div>
                    </div>

                    <Tabs defaultValue="seo" className="w-full">
                        <TabsList className="w-full justify-start border-b rounded-none bg-transparent h-auto p-0">
                            <TabsTrigger
                                value="seo"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
                            >
                                SEO Settings
                            </TabsTrigger>
                            <TabsTrigger
                                value="utm"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
                            >
                                UTM Tracking
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="seo" className="mt-0 bg-card border border-border border-t-0 rounded-b-lg p-6 space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="meta_title">Meta Title</Label>
                                <Input
                                    id="meta_title"
                                    value={formData.meta_title}
                                    onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                                    placeholder="SEO Title"
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
                        </TabsContent>

                        <TabsContent value="utm" className="mt-0 bg-card border border-border border-t-0 rounded-b-lg p-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="utm_source">UTM Source</Label>
                                    <Input
                                        id="utm_source"
                                        value={formData.utm_source}
                                        onChange={(e) => setFormData({ ...formData, utm_source: e.target.value })}
                                        placeholder="e.g. newsletter"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="utm_medium">UTM Medium</Label>
                                    <Input
                                        id="utm_medium"
                                        value={formData.utm_medium}
                                        onChange={(e) => setFormData({ ...formData, utm_medium: e.target.value })}
                                        placeholder="e.g. email"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="utm_campaign">UTM Campaign</Label>
                                    <Input
                                        id="utm_campaign"
                                        value={formData.utm_campaign}
                                        onChange={(e) => setFormData({ ...formData, utm_campaign: e.target.value })}
                                        placeholder="e.g. summer_sale"
                                    />
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>

                <div className="space-y-6">
                    <div className="bg-card border border-border rounded-lg p-6 space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="status">Publishing Status</Label>
                            <Select
                                value={formData.status}
                                onValueChange={(value) => setFormData({ ...formData, status: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="draft">Draft</SelectItem>
                                    <SelectItem value="published">Published</SelectItem>
                                    <SelectItem value="archived">Archived</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="category">Category</Label>
                            <Select
                                value={formData.category_id || "none"}
                                onValueChange={(value) => setFormData({ ...formData, category_id: value === "none" ? undefined : value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">No Category</SelectItem>
                                    {categories.map((cat) => (
                                        <SelectItem key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button
                                variant="link"
                                size="sm"
                                className="h-auto p-0 text-xs"
                                onClick={() => navigate('/blog/categories')}
                            >
                                Manage categories
                            </Button>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="featured_image">Featured Image</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="featured_image"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    disabled={isUploading}
                                />
                            </div>
                            {isUploading && <div className="text-sm text-muted-foreground mt-2">Uploading image...</div>}
                            {formData.featured_image && (
                                <div className="mt-2 relative aspect-video rounded-lg border border-border overflow-hidden bg-muted group">
                                    <img
                                        src={formData.featured_image}
                                        alt="Preview"
                                        className="w-full h-full object-cover"
                                        onError={(e) => (e.currentTarget.style.display = 'none')}
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => setFormData({ ...formData, featured_image: '' })}
                                        >
                                            Remove Image
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="excerpt">Excerpt / Summary</Label>
                            <Textarea
                                id="excerpt"
                                value={formData.excerpt}
                                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                                placeholder="Quick summary for the blog list"
                                rows={4}
                            />
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
