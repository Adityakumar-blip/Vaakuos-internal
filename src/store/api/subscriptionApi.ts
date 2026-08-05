import { apiSlice as api } from './apiSlice';

export interface Plan {
    id: string;
    name: string;
    subtitle: string | null;
    description: string | null;
    amount: number;
    currency: string;
    billing_interval: string;
    is_yearly: boolean;
    yearly_discount: number;
    features: any;
    razorpay_monthly_plan_id: string | null;
    razorpay_yearly_plan_id: string | null;
    is_active: boolean;
    is_published: boolean;
}

export interface PricingData {
    plans: {
        monthly: any[];
        yearly: any[];
    };
    addons: any[];
    meta: {
        currency: string;
        fetched_at: string;
    };
}

export interface SubscriptionStatus {
    id: string;
    tenant_id: string;
    plan_id: string;
    status: string;
    trial_ends_at: string | null;
    current_period_start: string | null;
    current_period_end: string | null;
    razorpay_subscription_id: string | null;
    plans: Plan;
}

/**
 * Effective entitlements for the current tenant, as computed by the backend
 * (`getEntitlements` = plan features + active add-ons + custom overrides, or the
 * free-tier defaults when the trial has expired / there is no active plan).
 * Numeric values use -1 to mean "unlimited". Extra keys may appear over time,
 * hence the index signature.
 */
export interface Entitlements {
    max_agents: number;
    max_contacts: number;
    monthly_messages: number;
    monthly_ai_replies: number;
    markup_per_message: number;
    broadcast_enabled: boolean;
    api_access: boolean;
    priority_support: boolean;
    [key: string]: number | boolean;
}

export interface CreateSubscriptionDto {
    plan_id: string;
    billing_cycle: 'monthly' | 'yearly';
    quantity?: number;
    total_count?: number;
}

export interface PaymentMethod {
    method: string;
    card: { last4: string; network: string; type: string } | null;
    vpa: string | null;
    bank: string | null;
    wallet: string | null;
}

export interface Invoice {
    id: string;
    invoice_number: string;
    amount: number;
    currency: string;
    status: string;
    due_date: string | null;
    paid_at: string | null;
    pdf_url: string | null;
    created_at: string;
}

export interface BillingInfo {
    subscription: {
        id: string;
        status: string;
        current_period_start: string | null;
        current_period_end: string | null;
        trial_ends_at: string | null;
        cancel_at: string | null;
        cancelled_at: string | null;
        cancellation_requested_at: string | null;
        cancel_at_cycle_end: boolean;
        razorpay_subscription_id: string | null;
    } | null;
    plan: Plan | null;
    paymentMethod: PaymentMethod | null;
    billingCycle: 'monthly' | 'yearly';
    nextPaymentDate: string | null;
    recentInvoices: Invoice[];
}

export const subscriptionApi = api.injectEndpoints({
    endpoints: (builder) => ({
        getPublicPricing: builder.query<PricingData, void>({
            query: () => '/public/pricing',
        }),
        getPlans: builder.query<Plan[], void>({
            query: () => '/subscriptions/plans',
            providesTags: ['Subscription'],
        }),
        getSubscriptionStatus: builder.query<SubscriptionStatus, void>({
            query: () => '/subscriptions/status',
            providesTags: ['Subscription'],
        }),
        getBillingInfo: builder.query<BillingInfo, void>({
            query: () => '/subscriptions/billing-info',
            providesTags: ['Subscription'],
        }),
        getEntitlements: builder.query<Entitlements, void>({
            query: () => '/subscriptions/entitlements',
            providesTags: ['Subscription'],
        }),
        createSubscription: builder.mutation<any, CreateSubscriptionDto>({
            query: (dto) => ({
                url: '/subscriptions',
                method: 'POST',
                body: dto,
            }),
            invalidatesTags: ['Subscription'],
        }),
        cancelSubscription: builder.mutation<{ message: string }, void>({
            query: () => ({
                url: '/subscriptions/cancel',
                method: 'POST',
            }),
            invalidatesTags: ['Subscription'],
        }),
    }),
});

export const {
    useGetPublicPricingQuery,
    useGetPlansQuery,
    useGetSubscriptionStatusQuery,
    useGetBillingInfoQuery,
    useGetEntitlementsQuery,
    useCreateSubscriptionMutation,
    useCancelSubscriptionMutation,
} = subscriptionApi;
