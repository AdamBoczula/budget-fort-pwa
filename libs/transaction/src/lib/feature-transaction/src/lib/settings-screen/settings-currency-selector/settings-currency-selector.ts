// spec: docs/specs/budget/poprawa-ux-ui-mvp.md

import { Component, inject } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { CurrencyService, CurrencyCode, CURRENCY_OPTIONS } from '@currency';

@Component({
  selector: 'transaction-settings-currency-selector',
  imports: [MatFormFieldModule, MatSelectModule],
  templateUrl: './settings-currency-selector.html',
  styleUrl: './settings-currency-selector.scss',
})
export class SettingsCurrencySelectorComponent {
  private readonly currencyService = inject(CurrencyService);

  protected readonly activeCurrency = this.currencyService.currentCurrency;
  protected readonly currencyOptions = CURRENCY_OPTIONS;

  protected onCurrencyChange(code: CurrencyCode): void {
    this.currencyService.setCurrency(code);
  }
}