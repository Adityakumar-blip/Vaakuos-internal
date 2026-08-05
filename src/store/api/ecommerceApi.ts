import { apiSlice } from './apiSlice';
import { API_ENDPOINTS } from './config';

export interface CartItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
    imageUrl?: string;
    sku?: string;
}

export interface CartTimelineEvent {
    action: string;
    time: string;
}

export interface AbandonedCart {
    id: string;
    contactId?: string;
    customer: string;
    phone: string;
    total: number;
    lastActive: string;
    tags: string[];
    items: CartItem[];
    timeline: CartTimelineEvent[];
    status: 'active' | 'recovered' | 'lost';
    cartUrl?: string;
    checkoutUrl?: string;
    createdAt: string;
    updatedAt: string;
}

export interface Cart {
    id: string;
    customerId?: string;
    customerName?: string;
    items: CartItem[];
    total: number;
    status: 'active' | 'abandoned' | 'converted';
    createdAt: string;
    updatedAt: string;
}

export interface EcommerceStats {
    activeCarts: number;
    potentialRevenue: number;
    recoveredToday: number;
    averageCartAge: string;
}

export interface AbandonedCartSettings {
    abandonedAfterMinutes: number | null; // null = using the system default
    effectiveMinutes: number;
    defaultMinutes: number;
}

export interface UpdateAbandonedCartSettings {
    abandonedAfterMinutes: number | null;
}

export interface AbandonedCartsResponse {
    carts: AbandonedCart[];
    total: number;
    page: number;
    limit: number;
}

export interface CartsResponse {
    carts: Cart[];
    total: number;
    page: number;
    limit: number;
}

export interface AbandonedCartsQueryParams {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    sortBy?: string;
    order?: 'asc' | 'desc';
}

/**
 * Backend Shopify Data Structure
 */
interface ShopifyLineItem {
    title: string;
    price: string;
    quantity: number;
    product_id?: number;
    variant_id?: number;
}

interface ShopifyAbandonedCart {
    id: string;
    updated_at: string;
    last_event_at?: string;
    checkout_done: boolean;
    metadata: {
        total_price: string;
        customer?: {
            first_name: string;
            last_name: string;
            phone?: string;
            tags?: string;
        };
        line_items: ShopifyLineItem[];
        phone?: string;
        email?: string;
        abandoned_checkout_url?: string;
    };
    contacts?: {
        name: string;
        phone_number: string;
    } | null;
}

/**
 * Helper to transform Abandoned Cart from any source (Shopify, Custom, etc.) to our UI model.
 * Prioritizes backend-normalized fields and handles platform-specific fallbacks in metadata.
 */
const transformAbandonedCart = (item: any): AbandonedCart => {
    // 1. Customer Name fallback chain
    const customer = item.contacts?.name ||
        (item.metadata?.customer ? `${item.metadata.customer.first_name || ''} ${item.metadata.customer.last_name || ''}`.trim() : '') ||
        item.metadata?.name ||
        'Unknown Customer';

    // 2. Phone fallback chain
    const phone = item.contacts?.phone_number ||
        item.metadata?.phone ||
        item.metadata?.customer?.phone ||
        'No Phone';

    // 3. Status and Relative Time
    const lastActiveDate = new Date(item.last_event_at || item.updated_at || item.created_at);
    const diffMs = new Date().getTime() - lastActiveDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    let lastActive = 'Just now';
    if (diffMins > 0) {
        if (diffMins < 60) lastActive = `${diffMins}m ago`;
        else if (diffMins < 1440) lastActive = `${Math.floor(diffMins / 60)}h ago`;
        else lastActive = `${Math.floor(diffMins / 1440)}d ago`;
    }

    // 4. Line Items mapping
    const rawItems = item.metadata?.line_items || item.metadata?.items || item.items || [];
    const items: CartItem[] = rawItems.map((li: any, index: number) => ({
        id: String(li.variant_id || li.product_id || li.id || index),
        name: li.title || li.name || 'Unknown Product',
        price: parseFloat(li.price || li.unit_price || 0),
        quantity: li.quantity || 1,
        imageUrl: li.image || li.image_url || li.imageUrl || '', // No static fallback
        sku: li.sku || ''
    }));

    // 5. Total Price
    const total = parseFloat(
        item.metadata?.total_price ||
        item.metadata?.total ||
        item.total ||
        '0'
    );

    return {
        id: item.id,
        contactId: item.contact_id || item.contacts?.id,
        customer,
        phone,
        total,
        lastActive,
        tags: item.metadata?.customer?.tags
            ? item.metadata.customer.tags.split(',').filter(Boolean)
            : (Array.isArray(item.tags) ? item.tags : []),
        status: item.checkout_done ? 'recovered' : 'active',
        checkoutUrl: item.checkout_url || item.metadata?.abandoned_checkout_url,
        createdAt: item.created_at || item.updated_at,
        updatedAt: item.updated_at,
        items,
        timeline: [
            { action: 'Abandoned Cart Recorded', time: lastActiveDate.toISOString() }
        ]
    };
};

/**
 * Ecommerce API Endpoints
 * Handles carts, abandoned carts, and related ecommerce data
 */
export const ecommerceApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        // Get all abandoned carts
        getAbandonedCarts: builder.query<AbandonedCartsResponse, AbandonedCartsQueryParams | void>({
            query: (params) => {
                const searchParams = new URLSearchParams();
                if (params) {
                    Object.entries(params).forEach(([key, value]) => {
                        if (value !== undefined) {
                            searchParams.append(key, String(value));
                        }
                    });
                }
                const queryStr = searchParams.toString();
                return `${API_ENDPOINTS.ECOMMERCE.ABANDONED_CARTS}${queryStr ? `?${queryStr}` : ''}`;
            },
            transformResponse: (response: any) => {
                const rawCarts = Array.isArray(response) ? response : (response.carts || []);
                const transformedCarts: AbandonedCart[] = rawCarts.map(transformAbandonedCart);

                return {
                    carts: transformedCarts,
                    total: response.total || transformedCarts.length,
                    page: response.page || 1,
                    limit: response.limit || transformedCarts.length,
                };
            },
            providesTags: (result) =>
                result
                    ? [
                        ...result.carts.map(({ id }) => ({ type: 'AbandonedCart' as const, id })),
                        { type: 'AbandonedCart', id: 'LIST' },
                    ]
                    : [{ type: 'AbandonedCart', id: 'LIST' }],
        }),

        // Get single abandoned cart by ID
        getAbandonedCartById: builder.query<AbandonedCart, string>({
            query: (id) => API_ENDPOINTS.ECOMMERCE.ABANDONED_CART_BY_ID(id),
            transformResponse: (response: any) => transformAbandonedCart(response),
            providesTags: (result, error, id) => [{ type: 'AbandonedCart', id }],
        }),

        // Send recovery reminder (e.g. via WhatsApp)
        sendAbandonedCartReminder: builder.mutation<{ success: boolean; message: string }, string>({
            query: (id) => ({
                url: API_ENDPOINTS.ECOMMERCE.SEND_REMINDER(id),
                method: 'POST',
            }),
            invalidatesTags: (result, error, id) => [{ type: 'AbandonedCart', id }],
        }),

        // Get ecommerce stats (for overview dashboard)
        getEcommerceStats: builder.query<EcommerceStats, void>({
            query: () => API_ENDPOINTS.ECOMMERCE.STATS,
            providesTags: ['AbandonedCart', 'Cart'],
        }),

        // Get regular carts
        getCarts: builder.query<CartsResponse, AbandonedCartsQueryParams | void>({
            query: (params) => {
                const searchParams = new URLSearchParams();
                if (params) {
                    Object.entries(params).forEach(([key, value]) => {
                        if (value !== undefined) {
                            searchParams.append(key, String(value));
                        }
                    });
                }
                const queryStr = searchParams.toString();
                return `${API_ENDPOINTS.ECOMMERCE.CARTS}${queryStr ? `?${queryStr}` : ''}`;
            },
            providesTags: (result) =>
                result
                    ? [
                        ...result.carts.map(({ id }) => ({ type: 'Cart' as const, id })),
                        { type: 'Cart', id: 'LIST' },
                    ]
                    : [{ type: 'Cart', id: 'LIST' }],
        }),

        // Get cart by ID
        getCartById: builder.query<Cart, string>({
            query: (id) => API_ENDPOINTS.ECOMMERCE.CART_BY_ID(id),
            providesTags: (result, error, id) => [{ type: 'Cart', id }],
        }),

        // Mark cart as recovered manually
        recoverCart: builder.mutation<AbandonedCart, string>({
            query: (id) => ({
                url: API_ENDPOINTS.ECOMMERCE.RECOVER_CART(id),
                method: 'POST',
            }),
            invalidatesTags: (result, error, id) => [
                { type: 'AbandonedCart', id },
                { type: 'AbandonedCart', id: 'LIST' },
            ],
        }),

        // Delete abandoned cart
        deleteAbandonedCart: builder.mutation<void, string>({
            query: (id) => ({
                url: API_ENDPOINTS.ECOMMERCE.ABANDONED_CART_BY_ID(id),
                method: 'DELETE',
            }),
            invalidatesTags: [{ type: 'AbandonedCart', id: 'LIST' }],
        }),

        // Abandoned-cart config (inactivity threshold before a cart counts as abandoned)
        getAbandonedCartSettings: builder.query<AbandonedCartSettings, void>({
            query: () => API_ENDPOINTS.ECOMMERCE.ABANDONED_CART_SETTINGS,
            providesTags: [{ type: 'AbandonedCart', id: 'SETTINGS' }],
        }),

        updateAbandonedCartSettings: builder.mutation<AbandonedCartSettings, UpdateAbandonedCartSettings>({
            query: (body) => ({
                url: API_ENDPOINTS.ECOMMERCE.ABANDONED_CART_SETTINGS,
                method: 'PUT',
                body,
            }),
            invalidatesTags: [
                { type: 'AbandonedCart', id: 'SETTINGS' },
                { type: 'AbandonedCart', id: 'LIST' },
            ],
        }),
    }),
});

export const {
    useGetAbandonedCartsQuery,
    useGetAbandonedCartByIdQuery,
    useSendAbandonedCartReminderMutation,
    useGetEcommerceStatsQuery,
    useGetCartsQuery,
    useGetCartByIdQuery,
    useRecoverCartMutation,
    useDeleteAbandonedCartMutation,
    useGetAbandonedCartSettingsQuery,
    useUpdateAbandonedCartSettingsMutation,
} = ecommerceApi;
