import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Scale } from 'lucide-react';
import { RowActions } from '@/components/table';
import { DataTable, type Column } from '@/components/ui/data-table';
import { useGetLegalPagesQuery, LEGAL_PAGE_SLUGS, type LegalPage, type LegalPageSlug } from '@/store/api/legalPagesApi';
import { format } from 'date-fns';

const PAGE_TITLES: Record<LegalPageSlug, string> = {
    'privacy-policy': 'Privacy Policy',
    'terms-of-service': 'Terms of Service',
    'cookie-policy': 'Cookie Policy',
};

// The 3 pages are fixed and always listed, even before the backend has a row
// for a slug yet — the editor upserts on save either way.
type LegalPageRow = Pick<LegalPage, 'title' | 'slug' | 'status' | 'updated_at'> & { exists: boolean };

export default function LegalPagesPage() {
    const navigate = useNavigate();
    const { data: pages, isLoading } = useGetLegalPagesQuery();

    const rows: LegalPageRow[] = LEGAL_PAGE_SLUGS.map((slug) => {
        const existing = pages?.find((p) => p.slug === slug);
        return existing
            ? { title: existing.title, slug: existing.slug, status: existing.status, updated_at: existing.updated_at, exists: true }
            : { title: PAGE_TITLES[slug], slug, status: 'draft', updated_at: '', exists: false };
    });

    const columns: Column<LegalPageRow>[] = [
        {
            accessorKey: 'title',
            header: 'Page',
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <Scale size={16} />
                    </div>
                    <div>
                        <p className="font-medium text-foreground">{row.original.title}</p>
                        <p className="text-xs text-muted-foreground">/{row.original.slug}</p>
                    </div>
                </div>
            ),
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => {
                const { status, exists } = row.original;
                if (!exists) {
                    return <Badge variant="outline" className="text-muted-foreground">Not created yet</Badge>;
                }
                return (
                    <Badge variant={status === 'published' ? 'default' : 'secondary'} className="capitalize">
                        {status}
                    </Badge>
                );
            },
        },
        {
            accessorKey: 'updated_at',
            header: 'Last Updated',
            cell: ({ row }) => {
                const { updated_at, exists } = row.original;
                return exists && updated_at ? (
                    <span className="text-sm text-muted-foreground">{format(new Date(updated_at), 'MMM dd, yyyy')}</span>
                ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                );
            },
        },
        {
            id: 'actions',
            header: () => <div className="text-right">Actions</div>,
            cell: ({ row }) => (
                <div className="text-right">
                    <RowActions onEdit={() => navigate(`/legal-pages/${row.original.slug}`)} />
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6 pt-4">
            <div>
                <h1 className="text-2xl font-semibold text-foreground">Legal Pages</h1>
                <p className="text-sm text-muted-foreground mt-1">Manage the privacy policy, terms of service and cookie policy shown on the website.</p>
            </div>

            <DataTable
                columns={columns}
                data={rows}
                isLoading={isLoading}
                showPagination={false}
                getItemId={(row) => row.slug}
            />
        </div>
    );
}
