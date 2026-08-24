import { Component, inject, resource } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { Category, CategoryService, Transaction, TransactionType } from '@data-access-transaction';

export type TransactionFormData = {
  category: Category;
  /** When present, the form is in edit mode and pre-fills the fields. */
  transaction?: Transaction;
};
export type TransactionFormResult = {
  categoryId: string; amount: number;
  type: TransactionType; date: string;
  comment: string; accountId: string;
  transaction?: Transaction;
};

@Component({
  selector: 'transaction-form-dialog',
  imports: [
    FormsModule, MatButtonModule, MatDatepickerModule,
    MatDialogModule, MatFormFieldModule, MatIconModule, MatInputModule, MatMenuModule,
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './transaction-form.html',
  styleUrl: './transaction-form.scss',
})
export class TransactionFormComponent {
  private readonly categoryService = inject(CategoryService);
  private readonly dialogRef = inject(MatDialogRef<TransactionFormComponent>);
  private readonly dialogData = inject<TransactionFormData>(MAT_DIALOG_DATA);

  /** Kategorie załadowane przez resource(). */
  protected readonly categories = resource({
    loader: async () => this.categoryService.getVisibleCategoriesAsync(),
  });

  protected selectedCategory: Category;
  protected amount: number | null = null;
  protected selectedDate: Date = new Date();
  protected comment = '';
  /** Whether the form is in edit mode. */
  protected isEditMode = false;

  constructor() {
    this.selectedCategory = this.dialogData.category;
    const existingTx = this.dialogData.transaction;
    if (existingTx) {
      this.isEditMode = true;
      this.amount = Math.abs(existingTx.amount);
      this.selectedDate = new Date(existingTx.date);
      this.comment = existingTx.comment ?? '';
    }
  }

  protected get transactionType(): TransactionType {
    return this.selectedCategory.transactionType ?? 'expense';
  }

  protected selectCategory(category: Category): void {
    this.selectedCategory = category;
  }

  protected save(): void {
    if (!this.amount || this.amount <= 0 || !this.selectedDate) return;
    const signedAmount = this.transactionType === 'expense'
      ? -Math.abs(this.amount) : Math.abs(this.amount);
    this.dialogRef.close({
      categoryId: this.selectedCategory.id,
      amount: signedAmount,
      type: this.transactionType,
      date: this.selectedDate.toISOString(),
      comment: this.comment,
      accountId: 'default',
      transaction: this.isEditMode ? this.dialogData.transaction : undefined,
    });
  }

  protected cancel(): void {
    this.dialogRef.close();
  }
}