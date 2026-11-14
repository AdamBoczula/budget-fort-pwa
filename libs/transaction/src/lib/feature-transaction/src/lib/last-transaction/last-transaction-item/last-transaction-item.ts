// spec: docs/qa/2026-10-21-ui-ux-audit.md
// spec: docs/specs/budget/poprawa-ux-ui-mvp.md

import { Component, inject, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Category, Transaction } from '@data-access-transaction';
import { CurrencyService } from '@currency';

@Component({
  selector: 'transaction-last-transaction-item',
  imports: [DatePipe, MatButtonModule, MatIconModule, MatTooltipModule],
  template: `
    <div
      class="item"
      [style.border-left]="'3px solid ' + (category()?.colorHex ?? '#6B7280')"
      data-testid="last-transaction-item"
      tabindex="0"
      role="button"
      (click)="edit.emit()"
      (keydown.enter)="edit.emit()"
      (keydown.space)="edit.emit(); $event.preventDefault()"
    >
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
            @if (transaction().subcategory) {
              <span class="subcategory">· {{ transaction().subcategory }}</span>
            }
            @if (transaction().recurringRuleId) {
              <mat-icon
                class="recurring-icon"
                matTooltip="Wydatek cykliczny"
                i18n-matTooltip="@@lastTransactions.recurringTooltip"
                data-testid="last-transaction-item__recurring-icon"
                >repeat</mat-icon
              >
            }
          </span>
          <div class="meta">
            @if (transaction().comment) {
              <span class="comment" data-testid="last-transaction-item__comment">
                {{ transaction().comment }}
              </span>
              <span class="meta__dot" aria-hidden="true">·</span>
            }
            <span class="date" data-testid="last-transaction-item__date">
              {{ transaction().date | date: 'dd.MM.yyyy' }}
            </span>
          </div>
        </div>
      </div>

      <div class="right">
        <span
          class="amount"
          [class.income]="transaction().amount > 0"
          data-testid="last-transaction-item__amount"
        >
          {{ currencyService.format(transaction().amount) }}
        </span>
        <div class="actions">
          <button
            mat-icon-button
            class="action-btn"
            type="button"
            i18n-aria-label="@@lastTransactions.editAria"
            aria-label="Edytuj transakcję"
            (click)="$event.stopPropagation(); edit.emit()"
            matTooltip="Edytuj"
            i18n-matTooltip="@@lastTransactions.editTooltip"
            data-testid="last-transaction-item__edit-btn"
          >
            <mat-icon>edit</mat-icon>
          </button>
          <button
            mat-icon-button
            class="action-btn action-btn--delete"
            type="button"
            i18n-aria-label="@@lastTransactions.deleteAria"
            aria-label="Usuń transakcję"
            (click)="$event.stopPropagation(); deleteItem.emit()"
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
  protected readonly currencyService = inject(CurrencyService);

  transaction = input.required<Transaction>();
  category = input<Category>();
  edit = output<void>();
  deleteItem = output<void>();
}
