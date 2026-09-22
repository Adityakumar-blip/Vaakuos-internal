import { apiSlice as api } from './apiSlice';

export type LegalPageStatus = 'draft' | 'published';
export type LegalPageSlug = 'privacy-policy' | 'terms-of-service' | 'cookie-policy';

export const LEGAL_PAGE_SLUGS: LegalPageSlug[] = ['privacy-policy', 'terms-of-service', 'cookie-policy'];

export interface LegalPage {
    id: string;
    slug: LegalPageSlug;
    title: string;
    content: string;
    meta_title?: string;
    meta_description?: string;
    status: LegalPageStatus;
    effective_date?: string;
    created_at: string;
    updated_at: string;
}

export interface UpsertLegalPageDto {
    title: string;
    content: string;
    meta_title?: string;
    meta_description?: string;
    status?: LegalPageStatus;
    effective_date?: string;
}

export const legalPagesApi = api.injectEndpoints({
    endpoints: (builder) => ({
        // GET /legal-pages returns every page (drafts included), not paginated — the
        // set is fixed to the 3 known slugs, so a plain list is enough.
        getLegalPages: builder.query<LegalPage[], void>({
            query: () => '/legal-pages',
            providesTags: (result) =>
                result
                    ? [
                        ...result.map(({ slug }) => ({ type: 'LegalPage' as const, id: slug })),
                        { type: 'LegalPage', id: 'LIST' },
                    ]
                    : [{ type: 'LegalPage', id: 'LIST' }],
        }),
        upsertLegalPage: builder.mutation<LegalPage, { slug: LegalPageSlug; body: UpsertLegalPageDto }>({
            query: ({ slug, body }) => ({
                url: `/legal-pages/${slug}`,
                method: 'PUT',
                body,
            }),
            invalidatesTags: (_result, _error, { slug }) => [
                { type: 'LegalPage', id: slug },
                { type: 'LegalPage', id: 'LIST' },
            ],
        }),
    }),
});

export const { useGetLegalPagesQuery, useUpsertLegalPageMutation } = legalPagesApi;
