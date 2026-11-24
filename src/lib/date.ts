/**
 * Centralized Date & Time Utilities for Ghazal Store
 * Strictly enforces Jordan Timezone ('Asia/Amman' UTC+3) and English (Western) Numerals (0-9).
 */

const JORDAN_TZ = 'Asia/Amman';

/**
 * Parses any valid date input safely.
 */
function toDate(input: Date | string | number | null | undefined): Date | null {
  if (!input) return null;
  const d = new Date(input);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Returns formatted date string in Jordan Timezone with English digits (e.g. "2026-11-20").
 */
export function formatJordanDate(input: Date | string | number | null | undefined): string {
  const d = toDate(input);
  if (!d) return '—';
  
  // Format as YYYY-MM-DD
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: JORDAN_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(d);
}

/**
 * Returns formatted time string in Jordan Timezone with English digits (e.g. "09:15 PM").
 */
export function formatJordanTime(input: Date | string | number | null | undefined): string {
  const d = toDate(input);
  if (!d) return '—';

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: JORDAN_TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
  return formatter.format(d);
}

/**
 * Returns combined Date & Time in Jordan Timezone with English digits (e.g. "2026-11-20 09:15 PM").
 */
export function formatJordanDateTime(input: Date | string | number | null | undefined): string {
  const d = toDate(input);
  if (!d) return '—';

  const datePart = formatJordanDate(d);
  const timePart = formatJordanTime(d);
  return `${datePart} ${timePart}`;
}

/**
 * Returns current timestamp formatted in Jordan Time.
 */
export function getJordanNowFormatted(): string {
  return formatJordanDateTime(new Date());
}
