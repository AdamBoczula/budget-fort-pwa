// spec: docs/specs/budget/poprawa-ux-ui-mvp.md

/** Supported currency codes. */
export type CurrencyCode = 'PLN' | 'EUR' | 'GBP' | 'UAH';

/** Currency option for dropdown selection. */
export type CurrencyOption = {
  code: CurrencyCode;
  label: string;
  flag: string;
};

/** localStorage key for persisting the selected currency. */
export const CURRENCY_STORAGE_KEY = 'budget-fort.currency';

/** Default currency when none is saved. */
export const DEFAULT_CURRENCY: CurrencyCode = 'PLN';

/** Available currencies for the user to choose from. */
export const CURRENCY_OPTIONS: ReadonlyArray<CurrencyOption> = [
  { code: 'PLN', label: 'Złoty (PLN)', flag: '🇵🇱' },
  { code: 'EUR', label: 'Euro (EUR)', flag: '🇪🇺' },
  { code: 'GBP', label: 'Funt (GBP)', flag: '🇬🇧' },
  { code: 'UAH', label: 'Hrywna (UAH)', flag: '🇺🇦' },
];