import { Component, inject, signal } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { LocalStorageService } from 'local-db';
import {
  CurrencyCode,
  CURRENCY_STORAGE_KEY,
  DEFAULT_CURRENCY,
  CURRENCY_OPTIONS,
} from '../settings-constants';

@Component({
  selector: 'transaction-settings-currency-selector',
  imports: [MatFormFieldModule, MatSelectModule],
  templateUrl: './settings-currency-selector.html',
  styleUrl: './settings-currency-selector.scss',
})
export class SettingsCurrencySelectorComponent {
  private readonly localStorageService = inject(LocalStorageService);

  protected readonly activeCurrency = signal<CurrencyCode>(DEFAULT_CURRENCY);
  protected readonly currencyOptions = CURRENCY_OPTIONS;

  public constructor() {
    this.loadCurrency();
  }

  protected onCurrencyChange(code: CurrencyCode): void {
    this.activeCurrency.set(code);
    this.localStorageService.setItem(CURRENCY_STORAGE_KEY, code);
  }

  private loadCurrency(): void {
    const saved = this.localStorageService.getItem(CURRENCY_STORAGE_KEY);
    if (saved && this.currencyOptions.some((c) => c.code === saved)) {
      this.activeCurrency.set(saved as CurrencyCode);
    }
  }
}