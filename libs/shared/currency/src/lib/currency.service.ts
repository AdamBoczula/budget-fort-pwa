// spec: docs/specs/budget/poprawa-ux-ui-mvp.md

import { signal, computed, Injectable, inject } from '@angular/core';
import { LocalStorageService } from 'local-db';
import {
  CurrencyCode,
  CURRENCY_STORAGE_KEY,
  DEFAULT_CURRENCY,
  CURRENCY_OPTIONS,
} from './currency-types';

/**
 * Central currency service — reads the selected currency from localStorage,
 * exposes it as a signal, and provides formatting utilities.
 */
@Injectable({ providedIn: 'root' })
export class CurrencyService {
  private readonly storage = inject(LocalStorageService);

  readonly currentCurrency = signal<CurrencyCode>(this.loadCurrency());

  /** ISO 639-1 locale tag for the current currency. */
  readonly currentLocale = computed(() => this.getLocale(this.currentCurrency()));

  /**
   * Format an amount using the current currency and locale.
   * Produces e.g. "1 234,56 zł" or "€1,234.56".
   */
  format(amount: number): string {
    return this.formatWithCurrency(amount, this.currentCurrency(), this.currentLocale());
  }

  /**
   * Format an amount using the current currency without the currency symbol
   * (useful when the symbol is displayed separately).
   * Produces e.g. "1 234,56".
   */
  formatAmountOnly(amount: number): string {
    return new Intl.NumberFormat(this.currentLocale(), {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Math.abs(amount));
  }

  /**
   * Get the currency symbol for the current currency.
   */
  getSymbol(): string {
    return this.getSymbolFor(this.currentCurrency());
  }

  /**
   * Change the current currency and persist to localStorage.
   */
  setCurrency(code: CurrencyCode): void {
    this.currentCurrency.set(code);
    this.storage.setItem(CURRENCY_STORAGE_KEY, code);
  }

  /** Format with explicit currency and locale. */
  private formatWithCurrency(amount: number, currency: CurrencyCode, locale: string): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  private getSymbolFor(code: CurrencyCode): string {
    const parts = new Intl.NumberFormat(this.getLocale(code), {
      style: 'currency',
      currency: code,
    }).formatToParts(0);
    const currencyPart = parts.find((p) => p.type === 'currency');
    return currencyPart?.value ?? code;
  }

  private getLocale(code: CurrencyCode): string {
    switch (code) {
      case 'PLN': return 'pl';
      case 'EUR': return 'de';
      case 'GBP': return 'en-GB';
      case 'UAH': return 'uk';
    }
  }

  private loadCurrency(): CurrencyCode {
    const saved = this.storage.getItem(CURRENCY_STORAGE_KEY);
    if (saved && CURRENCY_OPTIONS.some((c) => c.code === saved)) {
      return saved as CurrencyCode;
    }
    return DEFAULT_CURRENCY;
  }
}