import { useAppSelector } from '@/store/hooks';
import { selectCurrentUser } from '@/store/slices/authSlice';

export const useSubscription = () => {
  const user = useAppSelector(selectCurrentUser);
  const subscription = user?.subscription;

  if (!subscription) {
    return {
      isTrialing: false,
      isExpired: false,
      trialEndsAt: null,
      status: 'none',
      planName: 'Free',
      daysRemaining: 0,
    };
  }

  const status = subscription.status;
  const trialEndsAt = subscription.trial_ends_at ? new Date(subscription.trial_ends_at) : null;
  const periodEndsAt = subscription.current_period_end ? new Date(subscription.current_period_end) : null;
  
  const now = new Date();

  // Terminal backend statuses where the subscription no longer grants access.
  // (Matches hasActiveSubscription() in the backend: 'active'/'pending' keep
  // access, a valid trial keeps access, everything else does not.)
  const TERMINAL_STATUSES = ['halted', 'cancelled', 'completed', 'expired'];

  // Calculate if expired
  let isExpired = false;
  const expiryDate = trialEndsAt || periodEndsAt;

  if (status === 'trialing') {
    // A trial is active until trial_ends_at passes.
    isExpired = trialEndsAt ? now > trialEndsAt : false;
  } else if (TERMINAL_STATUSES.includes(status)) {
    isExpired = true;
  }
  // 'active' / 'pending' (payment retry in progress) keep access — the backend
  // owns true expiry via webhook + the hourly maintenance reconcile cron, and
  // gates any over-limit action with a 402 at request time.

  const daysRemaining = expiryDate 
    ? Math.max(0, Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  return {
    isTrialing: status === 'trialing',
    isExpired,
    trialEndsAt,
    periodEndsAt,
    status,
    planName: subscription.plans?.name || 'Unknown',
    daysRemaining,
    subscription,
  };
};
