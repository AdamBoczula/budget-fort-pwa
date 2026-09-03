/**
 * Funkcje narzędziowe do operacji pieniężnych.
 * Żadna zewnętrzna biblioteka do obsługi pieniędzy - czysty JS z round half-up.
 */

/**
 * Zaokrągla liczbę do podanej liczby miejsc po przecinku (half-up).
 * @example roundHalfUp(10.345, 2) → 10.35
 * @example roundHalfUp(10.344, 2) → 10.34
 */
export function roundHalfUp(value: number, decimals = 2): number {
  const multiplier = Math.pow(10, decimals);
  // JavaScript Math.round zaokrągla .5 w górę (w kierunku +∞)
  // Dla liczb ujemnych używamy -Math.round(-x) żeby uzyskać half-up
  const sign = value >= 0 ? 1 : -1;
  const abs = Math.abs(value);
  return Math.round(abs * multiplier) / multiplier * sign;
}

/**
 * Oblicza procentowy udział części w całości.
 * Zwraca zaokrągloną wartość (0-100).
 * Gdy total = 0, zwraca 0.
 */
export function calculatePercentage(part: number, total: number): number {
  if (total === 0) return 0;
  return roundHalfUp((Math.abs(part) / Math.abs(total)) * 100, 1);
}

/**
 * Formatuje kwotę do wyświetlenia z symbolem waluty.
 * Wykorzystuje Intl.NumberFormat dla poprawnej lokalizacji.
 */
export function formatCurrency(
  amount: number,
  currency = 'PLN',
  locale = 'pl',
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formatuje kwotę do wyświetlenia skróconego (np. "12,3 tys.").
 * Do użytku w centrum wykresu kołowego dla dużych kwot.
 */
export function formatCompactCurrency(
  amount: number,
  currency = 'PLN',
  locale = 'pl',
): string {
  const abs = Math.abs(amount);
  let value: number;
  let suffix: string;

  if (abs >= 1_000_000) {
    value = roundHalfUp(abs / 1_000_000, 1);
    suffix = locale.startsWith('en') ? 'M' : ' mln';
  } else if (abs >= 1_000) {
    value = roundHalfUp(abs / 1_000, 1);
    suffix = locale.startsWith('en') ? 'k' : ' tys.';
  } else {
    return formatCurrency(amount, currency, locale);
  }

  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1,
  }).format(value);

  const symbol = currency === 'PLN' ? 'zł' : currency;
  return `${formatted} ${symbol}${suffix}`;
}