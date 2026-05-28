// ============================================
// DATE UTILITIES - Timezone Safe
// ============================================

/**
 * Formats a Date object to YYYY-MM-DD string in LOCAL timezone.
 * Avoids the common off-by-one error caused by using toISOString() which converts to UTC.
 */
export function formatDateToLocalISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parses a YYYY-MM-DD string to a Date object in LOCAL timezone.
 * Prevents timezone offset issues by creating the date at noon local time.
 */
export function parseLocalDateString(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  // Create date at noon to avoid DST edge cases
  return new Date(year, month - 1, day, 12, 0, 0);
}

/**
 * Gets today's date as a YYYY-MM-DD string in LOCAL timezone.
 */
export function getTodayLocalISO(): string {
  return formatDateToLocalISO(new Date());
}

/**
 * Formats a date string (YYYY-MM-DD) for display in Spanish locale.
 */
export function formatDateForDisplay(dateString: string, options?: Intl.DateTimeFormatOptions): string {
  const date = parseLocalDateString(dateString);
  return date.toLocaleDateString('es-AR', options || {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Compares two date strings to check if they represent the same day.
 */
export function isSameDay(dateString1: string, dateString2: string): boolean {
  return dateString1 === dateString2;
}

/**
 * Gets the current month and year for filtering.
 */
export function getCurrentMonthYear(): { month: number; year: number } {
  const now = new Date();
  return {
    month: now.getMonth(),
    year: now.getFullYear(),
  };
}

/**
 * Checks if a date string falls within the current month.
 */
export function isInCurrentMonth(dateString: string): boolean {
  const date = parseLocalDateString(dateString);
  const { month, year } = getCurrentMonthYear();
  return date.getMonth() === month && date.getFullYear() === year;
}

/**
 * Checks if a date string falls within the current year.
 */
export function isInCurrentYear(dateString: string): boolean {
  const date = parseLocalDateString(dateString);
  const { year } = getCurrentMonthYear();
  return date.getFullYear() === year;
}
