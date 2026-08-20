import { Component } from '@angular/core';

@Component({
  selector: 'transaction-transaction-form',
  imports: [],
  template: `<p i18n="@@transactionForm.placeholder">
    Formularz transakcji (w przygotowaniu).
  </p>`,
  styleUrl: './transaction-form.scss',
})
export class TransactionFormComponent {}
