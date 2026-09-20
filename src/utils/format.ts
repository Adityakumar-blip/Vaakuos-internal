/**
 * Formatting utilities for currency, numbers and dates.
 */

/**
 * Formats a numeric value as a currency string.
 *
 * @param value - The numeric value to format.
 * @param currency - The currency code (e.g., 'USD', 'INR'). Defaults to 'INR'.
 * @param locale - The locale to use for formatting. Defaults to 'en-IN'.
 * @returns A formatted currency string.
 */
/**
 * Formats a value stored in the smallest currency unit (paise for INR).
 * Plan and add-on amounts in this admin are stored in rupees — use
 * formatCurrency for those.
 */
export const formatPaise = (
  paise: number,
  currency: string = "INR",
  locale: string = "en-IN",
): string => formatCurrency((paise || 0) / 100, currency, locale);

export const formatCurrency = (
  value: number,
  currency: string = "INR",
  locale: string = "en-IN",
): string => {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
    maximumFractionDigits: 0,
  }).format(value);
};

/**
 * Formats a numeric value with commas.
 *
 * @param value - The numeric value to format.
 * @param locale - The locale to use for formatting. Defaults to 'en-IN'.
 * @returns A formatted number string.
 */
export const formatNumber = (
  value: number,
  locale: string = "en-IN",
): string => {
  return new Intl.NumberFormat(locale).format(value);
};

export interface DateTimePreferences {
  locale?: string;
  timeZone?: string;
  dateStyle?: Intl.DateTimeFormatOptions["dateStyle"];
  timeStyle?: Intl.DateTimeFormatOptions["timeStyle"];
}

// ponytail: module-level so every call site picks up user preferences without
// threading props. Set it once at login/bootstrap — components already mounted
// won't re-render on a later change.
let preferences: DateTimePreferences = {
  locale: "en-US",
  dateStyle: "medium",
  timeStyle: "short",
};

/** Apply the signed-in user's date/time preferences to every formatter below. */
export const setDateTimePreferences = (next: DateTimePreferences): void => {
  preferences = { ...preferences, ...next };
};

export type DateInput = string | number | Date | null | undefined;

const toDate = (value: DateInput): Date | null => {
  if (value === null || value === undefined || value === "") return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const format = (value: DateInput, options: Intl.DateTimeFormatOptions, fallback: string) => {
  const date = toDate(value);
  if (!date) return fallback;
  return new Intl.DateTimeFormat(preferences.locale, { timeZone: preferences.timeZone, ...options }).format(date);
};

/** Date only, e.g. "Jan 5, 2026". */
export const formatDate = (value: DateInput, fallback = "—"): string =>
  format(value, { dateStyle: preferences.dateStyle }, fallback);

/** Date + time, e.g. "Jan 5, 2026, 4:30 PM". */
export const formatDateTime = (value: DateInput, fallback = "—"): string =>
  format(value, { dateStyle: preferences.dateStyle, timeStyle: preferences.timeStyle }, fallback);

/** Time only, e.g. "4:30 PM". */
export const formatTime = (value: DateInput, fallback = "—"): string =>
  format(value, { timeStyle: preferences.timeStyle }, fallback);
