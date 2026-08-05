import { apiSlice } from './apiSlice';
import { unwrapList } from './unwrapList';

/**
 * Product Interface
 * Define your product structure here
 */
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

interface ProductsResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
}

interface ProductQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

/**
 * Products API Endpoints
 * Example of a resource-based API setup
 * 
 * Usage:
 * const { data, isLoading } = useGetProductsQuery({ page: 1, limit: 10 });
 * const [createProduct] = useCreateProductMutation();
 */
export const productsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Get all products with pagination and filters
    getProducts: builder.query<ProductsResponse, ProductQueryParams | void>({
      query: (params:any = {}) => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            searchParams.append(key, String(value));
          }
        });
        return `/products?${searchParams.toString()}`;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.products.map(({ id }) => ({ type: 'Product' as const, id })),
              { type: 'Product', id: 'LIST' },
            ]
          : [{ type: 'Product', id: 'LIST' }],
      // Keep data fresh for 5 minutes
      keepUnusedDataFor: 300,
    }),

    // Get single product by ID
    getProductById: builder.query<Product, string>({
      query: (id) => `/products/${id}`,
      providesTags: (result, error, id) => [{ type: 'Product', id }],
    }),

    // Create new product
    createProduct: builder.mutation<Product, Partial<Product>>({
      query: (newProduct) => ({
        url: '/products',
        method: 'POST',
        body: newProduct,
      }),
      invalidatesTags: [{ type: 'Product', id: 'LIST' }],
      // Optimistic update
      async onQueryStarted(newProduct, { dispatch, queryFulfilled }) {
        try {
          const { data: createdProduct } = await queryFulfilled;
          // Update the cache optimistically
          dispatch(
            productsApi.util.updateQueryData('getProducts', undefined, (draft) => {
              draft.products.unshift(createdProduct);
              draft.total += 1;
            })
          );
        } catch {
          // If the mutation fails, the cache will be automatically reverted
        }
      },
    }),

    // Update product
    updateProduct: builder.mutation<Product, { id: string; updates: Partial<Product> }>({
      query: ({ id, updates }) => ({
        url: `/products/${id}`,
        method: 'PATCH',
        body: updates,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Product', id }],
      // Optimistic update
      async onQueryStarted({ id, updates }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          productsApi.util.updateQueryData('getProductById', id, (draft) => {
            Object.assign(draft, updates);
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),

    // Delete product
    deleteProduct: builder.mutation<void, string>({
      query: (id) => ({
        url: `/products/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Product', id },
        { type: 'Product', id: 'LIST' },
      ],
    }),

    // Bulk delete products
    bulkDeleteProducts: builder.mutation<void, string[]>({
      query: (ids) => ({
        url: '/products/bulk-delete',
        method: 'POST',
        body: { ids },
      }),
      invalidatesTags: [{ type: 'Product', id: 'LIST' }],
    }),

    // Search products
    searchProducts: builder.query<Product[], string>({
      query: (searchTerm) => `/products/search?q=${encodeURIComponent(searchTerm)}`,
      transformResponse: unwrapList<Product>,
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: 'Product' as const, id }))]
          : [],
    }),
  }),
});

/**
 * Export hooks for usage in functional components
 */
export const {
  useGetProductsQuery,
  useGetProductByIdQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useBulkDeleteProductsMutation,
  useSearchProductsQuery,
  useLazySearchProductsQuery, // Lazy query for manual triggering
} = productsApi;
