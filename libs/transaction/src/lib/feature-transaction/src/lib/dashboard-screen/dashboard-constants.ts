import { PeriodMode } from '../service/dashboard-state/dashboard-state';

export const DASHBOARD_DEFAULT_PERIOD_MODE: PeriodMode = 'month';

export const DASHBOARD_MIN_YEAR = 2020;

/** Liczba ostatnich transakcji do pokazania w podsumowaniu. */
export const DASHBOARD_RECENT_TRANSACTION_LIMIT = 5;

/** Etykiety dla trybów okresu. */
export const PERIOD_MODE_LABELS: Record<PeriodMode, string> = {
  month: 'Miesiąc',
  year: 'Rok',
};