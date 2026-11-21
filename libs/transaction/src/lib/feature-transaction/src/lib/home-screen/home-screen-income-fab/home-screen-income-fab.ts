// spec: docs/qa/2026-10-21-ui-ux-audit.md
// spec: docs/specs/budget/poprawa-ux-ui-mvp.md

import { Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CategoryService, TransactionType } from '@data-access-transaction';
import { TransactionDialogService } from '../../service/transaction-dialog/transaction-dialog.service';

@Component({
  selector: 'transaction-home-screen-income-fab',
  imports: [MatButtonModule, MatIconModule, MatSnackBarModule],
  host: {
    '(document:keydown.escape)': 'onEscape()',
  },
  template: `
    @if (isOpen()) {
      <div class="fab-backdrop" aria-hidden="true" (click)="close()"></div>
      <div
        id="fab-speed-dial-actions"
        class="fab-speed-dial__actions"
        role="group"
        i18n-aria-label="@@fabSpeedDial.groupAria"
        aria-label="Wybierz typ transakcji"
      >
        <div class="fab-speed-dial__item">
          <button
            type="button"
            class="fab-speed-dial__label"
            tabindex="-1"
            (click)="openTransactionDialog('expense')"
            i18n="@@transactionForm.expense"
          >
            Wydatek
          </button>
          <button
            mat-mini-fab
            type="button"
            class="fab-action fab-action--expense"
            i18n-aria-label="@@fabExpense.ariaLabel"
            aria-label="Dodaj wydatek"
            (click)="openTransactionDialog('expense')"
          >
            <mat-icon>trending_down</mat-icon>
          </button>
        </div>
        <div class="fab-speed-dial__item">
          <button
            type="button"
            class="fab-speed-dial__label"
            tabindex="-1"
            (click)="openTransactionDialog('income')"
            i18n="@@transactionForm.income"
          >
            Przychód
          </button>
          <button
            mat-mini-fab
            type="button"
            class="fab-action fab-action--income"
            i18n-aria-label="@@fabIncome.ariaLabel"
            aria-label="Dodaj przychód"
            (click)="openTransactionDialog('income')"
          >
            <mat-icon>trending_up</mat-icon>
          </button>
        </div>
      </div>
    }
    <button
      #fabTrigger
      mat-fab
      type="button"
      class="fab-income"
      [class.fab-income--open]="isOpen()"
      i18n-aria-label="@@fabAdd.ariaLabel"
      aria-label="Dodaj transakcję"
      [attr.aria-expanded]="isOpen()"
      aria-controls="fab-speed-dial-actions"
      (click)="toggle()"
    >
      <mat-icon>add</mat-icon>
    </button>
  `,
  styleUrl: './home-screen-income-fab.scss',
})
export class HomeScreenIncomeFabComponent {
  private readonly categoryService = inject(CategoryService);
  private readonly transactionDialogService = inject(TransactionDialogService);
  private readonly snackBar = inject(MatSnackBar);

  private readonly fabTrigger = viewChild('fabTrigger', { read: ElementRef<HTMLButtonElement> });

  protected readonly isOpen = signal(false);

  protected toggle(): void {
    this.isOpen.update((open) => !open);
  }

  protected close(): void {
    this.isOpen.set(false);
  }

  protected onEscape(): void {
    if (!this.isOpen()) {
      return;
    }
    this.close();
    this.fabTrigger()?.nativeElement.focus();
  }

  protected async openTransactionDialog(type: TransactionType): Promise<void> {
    this.close();
    const categories = await this.categoryService.getCategoriesAsync();
    const category = categories.find(
      (c) => (c.transactionType ?? 'expense') === type && (type === 'income' || !c.isHidden),
    );
    if (!category) {
      const emptyMessage =
        type === 'income'
          ? $localize`:@@fabIncome.noCategory:Brak kategorii przychodów. Najpierw dodaj kategorię w ustawieniach.`
          : $localize`:@@fabExpense.noCategory:Brak kategorii wydatków. Najpierw dodaj kategorię w ustawieniach.`;
      this.snackBar.open(emptyMessage, undefined, { duration: 4000 });
      return;
    }

    this.transactionDialogService.openCreateDialog(category);
  }
}
