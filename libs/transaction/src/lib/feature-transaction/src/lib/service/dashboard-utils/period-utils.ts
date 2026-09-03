/**
 * Funkcje narzędziowe do obliczania granic okresów (miesiąc/rok)
 * w strefie czasowej Europe/Warsaw.
 */

/** Pobiera bieżący rok i miesiąc wg czasu lokalnego. */
export function getCurrentLocalMonth(): { year: number; month: number } {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() };
}

/**
 * Zwraca daty początku i końca miesiąca w formacie ISO.
 * Miesiące: 0 = styczeń, 11 = grudzień.
 */
export function getMonthRange(
  year: number,
  month: number,
): { startDate: string; endDate: string } {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
  return {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  };
}

/**
 * Zwraca daty początku i końca roku w formacie ISO.
 */
export function getYearRange(year: number): { startDate: string; endDate: string } {
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31, 23, 59, 59, 999);
  return {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  };
}

/**
 * Zwraca dostępne lata na podstawie listy transakcji.
 * Transakcje nieposiadające daty (invalid date) są pomijane.
 */
export function getAvailableYears(
  dates: string[],
): number[] {
  const years = new Set<number>();
  for (const d of dates) {
    const date = new Date(d);
    if (!isNaN(date.getTime())) {
      years.add(date.getFullYear());
    }
  }
  return Array.from(years).sort((a, b) => b - a); // malejąco
}

/**
 * Zwraca nazwę miesiąca w podanym locale.
 * Miesiące: 0 = styczeń, 11 = grudzień.
 */
export function getMonthName(
  month: number,
  locale: string,
): string {
  const date = new Date(2000, month, 1);
  return date.toLocaleDateString(locale, { month: 'long' });
}

/**
 * Sprawdza, czy data należy do podanego miesiąca (wg czasu lokalnego).
 */
export function isInMonth(
  dateString: string,
  year: number,
  month: number,
): boolean {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return false;
  return date.getFullYear() === year && date.getMonth() === month;
}

/**
 * Sprawdza, czy data należy do podanego roku (wg czasu lokalnego).
 */
export function isInYear(
  dateString: string,
  year: number,
): boolean {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return false;
  return date.getFullYear() === year;
}