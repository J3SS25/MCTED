/**
 * Date utilities:
 * All date strings in the DB are stored in ISO 8601 or YYYY-MM-DD format.
 * Presentation localized to Asia/Manila.
 */

export const MANILA_TIMEZONE = 'Asia/Manila';

export function formatDate(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return new Intl.DateTimeFormat('en-PH', {
    timeZone: MANILA_TIMEZONE,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export function formatDateTime(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return new Intl.DateTimeFormat('en-PH', {
    timeZone: MANILA_TIMEZONE,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

export function isValidDateRange(startDateStr: string, endDateStr: string): boolean {
  const start = new Date(startDateStr).getTime();
  const end = new Date(endDateStr).getTime();
  return !isNaN(start) && !isNaN(end) && start <= end;
}

