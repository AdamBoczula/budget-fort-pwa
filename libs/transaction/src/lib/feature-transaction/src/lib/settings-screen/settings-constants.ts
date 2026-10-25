import { TransactionThemeId } from '@ui-transaction';

/* ------------------------------------------------------------------ */
/*  Currency types, defaults & options  (re-exported from @currency)   */
/* ------------------------------------------------------------------ */

export {
  type CurrencyCode,
  type CurrencyOption,
  CURRENCY_STORAGE_KEY,
  DEFAULT_CURRENCY,
  CURRENCY_OPTIONS,
} from '@currency';

/* ------------------------------------------------------------------ */
/*  Theme constants                                                    */
/* ------------------------------------------------------------------ */

export const THEME_STORAGE_KEY = 'budget-fort.theme';

export const THEME_ROOT_CLASS_PREFIX = 'theme-';

export const DEFAULT_THEME_ID: TransactionThemeId = 'azure-blue';