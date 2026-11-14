// spec: docs/specs/transaction/recurring-transactions.md

import { Component, computed, inject, resource } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { CategoryService, RecurringTransactionRule } from '@data-access-transaction';

export type RecurringEditDialogData = {
  rule?: RecurringTransactionRule;
};

@Component({
  selector: 'transaction-recurring-edit-dialog',
  imports: [
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
  ],
  template: `
    <h2 mat-dialog-title class="dialog-title">
      {{ isEditMode ? 'Edytuj opłatę cykliczną' : 'Dodaj opłatę cykliczną' }}
    </h2>

    <mat-dialog-content class="dialog-content">
      <div class="dialog-fields">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label i18n="@@recurringDialog.categoryLabel">Kategoria</mat-label>
          <mat-select [(ngModel)]="categoryId" required data-testid="recurring-dialog-category">
            @for (cat of categories(); track cat.id) {
              <mat-option [value]="cat.id">
                <span class="category-option">
                  <span class="category-option__dot" [style.background-color]="cat.colorHex"></span>
                  {{ cat.name }}
                </span>
              </mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label i18n="@@recurringDialog.amountLabel">Kwota (zł)</mat-label>
          <input
            matInput
            type="number"
            min="0.01"
            step="0.01"
            [(ngModel)]="amount"
            required
            placeholder="0.00"
            data-testid="recurring-dialog-amount"
          />
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label i18n="@@recurringDialog.dayLabel">Dzień miesiąca (1-31)</mat-label>
          <input
            matInput
            type="number"
            min="1"
            max="31"
            [(ngModel)]="dayOfMonth"
            required
            data-testid="recurring-dialog-day"
          />
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label i18n="@@recurringDialog.commentLabel">Nazwa / Opis (opcjonalny)</mat-label>
          <input
            matInput
            type="text"
            [(ngModel)]="comment"
            placeholder="np. Netflix, Czynsz"
            data-testid="recurring-dialog-comment"
          />
        </mat-form-field>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end" class="dialog-actions">
      <button mat-button (click)="cancel()" i18n="@@recurringDialog.cancel">Anuluj</button>
      <button
        mat-flat-button
        (click)="save()"
        [disabled]="!isValid"
        color="primary"
        data-testid="recurring-dialog-save"
        i18n="@@recurringDialog.save"
      >
        Zapisz
      </button>
    </mat-dialog-actions>
  `,
  styleUrl: './recurring-edit-dialog.scss',
})
export class RecurringEditDialogComponent {
  private readonly categoryService = inject(CategoryService);
  private readonly dialogRef = inject(MatDialogRef<RecurringEditDialogComponent>);
  private readonly data = inject<RecurringEditDialogData>(MAT_DIALOG_DATA, { optional: true });

  protected readonly categoriesResource = resource({
    loader: async () => this.categoryService.getCategoriesAsync(),
  });
  protected readonly categories = computed(() => this.categoriesResource.value() ?? []);

  protected isEditMode = false;
  protected categoryId = '';
  protected amount: number | null = null;
  protected dayOfMonth = 1;
  protected comment = '';

  constructor() {
    if (this.data?.rule) {
      this.isEditMode = true;
      this.categoryId = this.data.rule.categoryId;
      this.amount = this.data.rule.amount;
      this.dayOfMonth = this.data.rule.dayOfMonth;
      this.comment = this.data.rule.comment ?? '';
    }
  }

  protected get isValid(): boolean {
    return (
      Boolean(this.categoryId) &&
      this.amount !== null &&
      this.amount > 0 &&
      this.dayOfMonth >= 1 &&
      this.dayOfMonth <= 31
    );
  }

  protected save(): void {
    if (!this.isValid) {
      return;
    }

    this.dialogRef.close({
      categoryId: this.categoryId,
      amount: this.amount,
      dayOfMonth: this.dayOfMonth,
      comment: this.comment.trim() || undefined,
    });
  }

  protected cancel(): void {
    this.dialogRef.close();
  }
}
