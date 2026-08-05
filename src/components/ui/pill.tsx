import * as React from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

import { cn } from "@/lib/utils";

/**
 * Pill — the single, canonical "chip" used across the whole app for
 * statuses, tags, categories, priorities, channels, counts… anything that is a
 * small rounded label. Do NOT hand-roll `bg-*-500/10 text-*-600 rounded-full`
 * spans anymore — use <Pill> (or <StatusPill> for auto status→color mapping).
 *
 * One look, one source of truth → zero UI inconsistency.
 */

/** Semantic + raw color tones. All share the same soft "/10 bg, /20 border" look. */
export type PillTone =
  // semantic
  | "neutral"
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "purple"
  // raw color aliases (map onto the semantic look)
  | "green"
  | "emerald"
  | "red"
  | "rose"
  | "amber"
  | "yellow"
  | "orange"
  | "blue"
  | "sky"
  | "indigo"
  | "violet"
  | "slate"
  | "gray"
  | "zinc";

export type PillSize = "xs" | "sm" | "md";

/** tone → tailwind classes. Single place to retune the palette for the app. */
const TONE_CLASSES: Record<PillTone, string> = {
  neutral:
    "bg-slate-500/10 text-slate-600 dark:text-slate-300 border-slate-500/20",
  primary:
    "bg-primary/10 text-primary border-primary/20",
  success:
    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  warning:
    "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  danger:
    "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  info:
    "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  purple:
    "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  // raw aliases
  green:
    "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
  emerald:
    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  red:
    "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  rose:
    "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  amber:
    "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  yellow:
    "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
  orange:
    "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
  blue:
    "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  sky:
    "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
  indigo:
    "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
  violet:
    "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
  slate:
    "bg-slate-500/10 text-slate-600 dark:text-slate-300 border-slate-500/20",
  gray:
    "bg-gray-500/10 text-gray-600 dark:text-gray-300 border-gray-500/20",
  zinc:
    "bg-zinc-500/10 text-zinc-600 dark:text-zinc-300 border-zinc-500/20",
};

/** dot color per tone (solid, for the leading status dot). */
const DOT_CLASSES: Record<PillTone, string> = {
  neutral: "bg-slate-500",
  primary: "bg-primary",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
  info: "bg-blue-500",
  purple: "bg-purple-500",
  green: "bg-green-500",
  emerald: "bg-emerald-500",
  red: "bg-red-500",
  rose: "bg-rose-500",
  amber: "bg-amber-500",
  yellow: "bg-yellow-500",
  orange: "bg-orange-500",
  blue: "bg-blue-500",
  sky: "bg-sky-500",
  indigo: "bg-indigo-500",
  violet: "bg-violet-500",
  slate: "bg-slate-500",
  gray: "bg-gray-500",
  zinc: "bg-zinc-500",
};

const SIZE_CLASSES: Record<PillSize, string> = {
  xs: "text-[10px] px-1.5 py-0 gap-1 h-[18px]",
  sm: "text-[11px] px-2 py-0.5 gap-1 h-5",
  md: "text-xs px-2.5 py-0.5 gap-1.5 h-6",
};

const DOT_SIZE: Record<PillSize, string> = {
  xs: "h-1.5 w-1.5",
  sm: "h-1.5 w-1.5",
  md: "h-2 w-2",
};

const ICON_SIZE: Record<PillSize, string> = {
  xs: "h-3 w-3",
  sm: "h-3 w-3",
  md: "h-3.5 w-3.5",
};

export interface PillProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, "color"> {
  /** Color tone. Use a semantic tone (success/danger/…) where possible. */
  tone?: PillTone;
  /** Size of the pill. */
  size?: PillSize;
  /** Show a leading solid status dot. */
  dot?: boolean;
  /** Pulse the dot (for "live"/"active" states). Implies `dot`. */
  pulse?: boolean;
  /** Optional leading icon (sized automatically). */
  icon?: React.ReactNode;
  /** Render with a visible border (default true). */
  bordered?: boolean;
  /** Uppercase label with tracking (used for priorities etc.). */
  uppercase?: boolean;
  /** Show a trailing remove (×) button — turns the pill into a clearable tag. */
  onRemove?: () => void;
  /** aria-label for the remove button. */
  removeLabel?: string;
}

/**
 * The canonical pill. Example:
 *   <Pill tone="success" dot>Active</Pill>
 *   <Pill tone="primary" size="sm" onRemove={() => …}>marketing</Pill>
 */
export const Pill = React.forwardRef<HTMLSpanElement, PillProps>(
  (
    {
      tone = "neutral",
      size = "md",
      dot = false,
      pulse = false,
      icon,
      bordered = true,
      uppercase = false,
      onRemove,
      removeLabel = "Remove",
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const showDot = dot || pulse;
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center whitespace-nowrap rounded-full font-medium leading-none transition-colors",
          bordered ? "border" : "border border-transparent",
          uppercase && "uppercase tracking-wide font-semibold",
          SIZE_CLASSES[size],
          TONE_CLASSES[tone],
          className,
        )}
        {...props}
      >
        {showDot && (
          <span className="relative flex items-center justify-center">
            {pulse && (
              <span
                className={cn(
                  "absolute inline-flex h-full w-full animate-ping rounded-full opacity-60",
                  DOT_CLASSES[tone],
                )}
              />
            )}
            <span
              className={cn(
                "relative inline-block shrink-0 rounded-full",
                DOT_SIZE[size],
                DOT_CLASSES[tone],
              )}
            />
          </span>
        )}
        {icon && (
          <span className={cn("flex shrink-0 items-center [&>svg]:h-full [&>svg]:w-full", ICON_SIZE[size])}>
            {icon}
          </span>
        )}
        {children != null && <span className="truncate">{children}</span>}
        {onRemove && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            aria-label={removeLabel}
            className="-mr-0.5 ml-0.5 flex shrink-0 items-center justify-center rounded-full opacity-60 transition-opacity hover:opacity-100 focus:outline-none focus:ring-1 focus:ring-current"
          >
            <XMarkIcon className={ICON_SIZE[size]} />
          </button>
        )}
      </span>
    );
  },
);
Pill.displayName = "Pill";

/* ------------------------------------------------------------------ */
/* Status → tone mapping                                               */
/* ------------------------------------------------------------------ */

/**
 * Maps a free-form status string to a semantic tone. Case/format-insensitive
 * (`In Progress`, `in_progress`, `IN-PROGRESS` all match). Extend the maps
 * below rather than re-inventing color logic at call sites.
 */
const STATUS_TONES: Record<string, PillTone> = {
  // success
  active: "success",
  approved: "success",
  sent: "success",
  delivered: "success",
  read: "success",
  resolved: "success",
  completed: "success",
  complete: "success",
  success: "success",
  successful: "success",
  paid: "success",
  connected: "success",
  online: "success",
  enabled: "success",
  verified: "success",
  published: "success",
  won: "success",
  subscribed: "success",
  opted_in: "success",
  operational: "success",
  stable: "success",
  healthy: "success",

  // danger
  inactive: "danger",
  rejected: "danger",
  failed: "danger",
  failure: "danger",
  error: "danger",
  closed: "danger",
  cancelled: "danger",
  canceled: "danger",
  blocked: "danger",
  banned: "danger",
  disconnected: "danger",
  offline: "danger",
  unpaid: "danger",
  overdue: "danger",
  expired: "danger",
  bounced: "danger",
  declined: "danger",
  alert: "danger",
  lost: "danger",
  disabled: "danger",
  unsubscribed: "danger",
  opted_out: "danger",
  archived: "danger",

  // warning
  pending: "warning",
  paused: "warning",
  in_progress: "warning",
  processing: "warning",
  scheduled: "warning",
  queued: "warning",
  waiting: "warning",
  review: "warning",
  in_review: "warning",
  on_hold: "warning",
  partial: "warning",
  warning: "warning",
  trial: "warning",
  trialing: "warning",
  unverified: "warning",
  abandoned: "warning",
  beta: "warning",
  degraded: "warning",

  // info
  open: "info",
  new: "info",
  running: "info",
  live: "info",
  sending: "info",
  info: "info",
  ongoing: "info",
  assigned: "info",
  alpha: "info",

  // neutral
  draft: "neutral",
  inactive_draft: "neutral",
  unknown: "neutral",
  none: "neutral",
  default: "neutral",
  not_started: "neutral",
  ended: "neutral",
};

/** Priority strings have their own ramp. */
const PRIORITY_TONES: Record<string, PillTone> = {
  urgent: "danger",
  critical: "danger",
  high: "orange",
  medium: "info",
  normal: "info",
  low: "neutral",
};

const normalize = (s: string) =>
  s.trim().toLowerCase().replace(/[\s-]+/g, "_");

/** Resolve a status string to a tone (falls back to `neutral`). */
export function getStatusTone(status?: string | null): PillTone {
  if (!status) return "neutral";
  return STATUS_TONES[normalize(status)] ?? "neutral";
}

/** Resolve a priority string to a tone (falls back to `neutral`). */
export function getPriorityTone(priority?: string | null): PillTone {
  if (!priority) return "neutral";
  return PRIORITY_TONES[normalize(priority)] ?? "neutral";
}

/** Title-cases a raw status token: `in_progress` → `In Progress`. */
function humanize(s: string) {
  return s
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export interface StatusPillProps extends Omit<PillProps, "tone" | "children"> {
  /** The raw status string (any case/format). */
  status?: string | null;
  /** Treat the value as a priority (urgent/high/medium/low) instead. */
  kind?: "status" | "priority";
  /** Override the displayed label. Defaults to the humanized status. */
  label?: React.ReactNode;
  /** Don't auto-humanize the label; show the raw value. */
  raw?: boolean;
}

/**
 * Auto-colored status/priority pill. The one-liner for tables:
 *   <StatusPill status={row.status} dot />
 *   <StatusPill status={ticket.priority} kind="priority" uppercase />
 */
export const StatusPill = React.forwardRef<HTMLSpanElement, StatusPillProps>(
  ({ status, kind = "status", label, raw = false, ...props }, ref) => {
    const value = status ?? "";
    const tone =
      kind === "priority" ? getPriorityTone(value) : getStatusTone(value);
    const text =
      label ?? (raw ? value : value ? humanize(value) : "—");
    return (
      <Pill ref={ref} tone={tone} {...props}>
        {text}
      </Pill>
    );
  },
);
StatusPill.displayName = "StatusPill";
