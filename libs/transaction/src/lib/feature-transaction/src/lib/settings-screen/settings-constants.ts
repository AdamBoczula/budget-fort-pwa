import { TransactionThemeId } from '@ui-transaction';

/* ------------------------------------------------------------------ */
/*  Currency types, defaults & options                                 */
/* ------------------------------------------------------------------ */

export type CurrencyCode = 'PLN' | 'EUR' | 'GBP' | 'UAH';

export type CurrencyOption = {
  code: CurrencyCode;
  label: string;
  flag: string;
};

export const CURRENCY_STORAGE_KEY = 'budget-fort.currency';

export const DEFAULT_CURRENCY: CurrencyCode = 'PLN';

export const CURRENCY_OPTIONS: ReadonlyArray<CurrencyOption> = [
  { code: 'PLN', label: 'Złoty (PLN)', flag: '🇵🇱' },
  { code: 'EUR', label: 'Euro (EUR)', flag: '🇪🇺' },
  { code: 'GBP', label: 'Funt (GBP)', flag: '🇬🇧' },
  { code: 'UAH', label: 'Hrywna (UAH)', flag: '🇺🇦' },
];

/* ------------------------------------------------------------------ */
/*  Theme constants                                                    */
/* ------------------------------------------------------------------ */

export const THEME_STORAGE_KEY = 'budget-fort.theme';

export const THEME_ROOT_CLASS_PREFIX = 'theme-';

export const DEFAULT_THEME_ID: TransactionThemeId = 'azure-blue';