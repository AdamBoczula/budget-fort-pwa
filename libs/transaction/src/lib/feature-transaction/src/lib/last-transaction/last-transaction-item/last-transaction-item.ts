import { Component, input, output } from '@angular/core';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Category, Transaction } from '@data-access-transaction';

@Component({
  selector: 'transaction-last-transaction-item',
  imports: [CurrencyPipe, DatePipe, MatButtonModule, MatIconModule, MatTooltipModule],
  template: `
    <div class="item" data-testid="last-transaction-item">
      <div class="left">
        <div
          class="icon"
          [style.background-color]="category()?.colorHex ?? '#6B7280'"
          data-testid="last-transaction-item__icon"
        >
          <mat-icon>{{ category()?.icon ?? 'category' }}</mat-icon>
        </div>
        <div class="info">
          <span class="name" data-testid="last-transaction-item__name">
            {{ category()?.name ?? '—' }}
          </span>
          @if (transaction().comment) {
            <span class="comment" data-testid="last-transaction-item__comment">
              {{ transaction().comment }}
            </span>
          }
          <span
            class="amount"
            [class.income]="transaction().amount > 0"
            data-testid="last-transaction-item__amount"
          >
            {{ transaction().amount | currency : 'PLN' : 'symbol' : '1.2-2' : 'pl' }}
          </span>
        </div>
      </div>

      <div class="right">
        <span class="date" data-testid="last-transaction-item__date">
          {{ transaction().date | date : 'dd.MM.yyyy' }}
        </span>
        <div class="actions">
          <button
            mat-icon-button
            class="action-btn"
            type="button"
            i18n-aria-label="@@lastTransactions.editAria"
            aria-label="Edytuj transakcję"
            (click)="edit.emit()"
            matTooltip="Edytuj"
            i18n-matTooltip="@@lastTransactions.editTooltip"
            data-testid="last-transaction-item__edit-btn"
          >
            <mat-icon>edit</mat-icon>
          </button>
          <button
            mat-icon-button
            class="action-btn"
            type="button"
            i18n-aria-label="@@lastTransactions.deleteAria"
            aria-label="Usuń transakcję"
            (click)="deleteItem.emit()"
            matTooltip="Usuń"
            i18n-matTooltip="@@lastTransactions.deleteTooltip"
            data-testid="last-transaction-item__delete-btn"
          >
            <mat-icon>delete</mat-icon>
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrl: './last-transaction-item.scss',
})
export class LastTransactionItemComponent {
  transaction = input.required<Transaction>();
  category = input<Category>();
  edit = output<void>();
  deleteItem = output<void>();
}
