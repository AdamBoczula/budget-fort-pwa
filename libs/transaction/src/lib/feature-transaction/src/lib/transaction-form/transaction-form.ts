// spec: docs/qa/2026-10-21-ui-ux-audit.md

import {
  AfterViewInit,
  Component,
  computed,
  ElementRef,
  inject,
  resource,
  signal,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  Category,
  CategoryService,
  SubcategoryService,
  Transaction,
  TransactionType,
} from '@data-access-transaction';

export type TransactionFormData = {
  category: Category;
  /** When present, the form is in edit mode and pre-fills the fields. */
  transaction?: Transaction;
};
export type TransactionFormResult = {
  categoryId: string;
  amount: number;
  type: TransactionType;
  date: string;
  comment: string;
  accountId: string;
  subcategory?: string;
  transaction?: Transaction;
};

@Component({
  selector: 'transaction-form-dialog',
  imports: [
    FormsModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatDatepickerModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatMenuModule,
    MatTooltipModule,
  ],
  templateUrl: './transaction-form.html',
  styleUrl: './transaction-form.scss',
})
export class TransactionFormComponent implements AfterViewInit {
  private readonly categoryService = inject(CategoryService);
  private readonly subcategoryService = inject(SubcategoryService);
  private readonly dialogRef = inject(MatDialogRef<TransactionFormComponent>);
  private readonly dialogData = inject<TransactionFormData>(MAT_DIALOG_DATA);

  @ViewChild('amountInput') amountInput!: ElementRef<HTMLInputElement>;

  /** Kategorie załadowane przez resource(). */
  protected readonly categories = resource({
    loader: async () => this.categoryService.getCategoriesAsync(),
  });

  /** Wszystkie podkategorie dla wybranej kategorii (z DB). */
  protected readonly subcategories = resource({
    params: () => this.selectedCategory.id,
    loader: async (params) => {
      return this.subcategoryService.getSubcategoriesAsync(params.params);
    },
  });

  /** Podkategorie przefiltrowane po wpisanym tekście (case-insensitive, ignorując spacje). */
  protected readonly filteredSubcategories = computed(() => {
    const all = this.subcategories.value() ?? [];
    const query = this.subcategorySignal().replace(/\s/g, '').toLowerCase();
    if (!query) {
      return all;
    }
    return all.filter((sub) => sub.name.replace(/\s/g, '').toLowerCase().includes(query));
  });

  /** Kategorie tego samego typu co wybrana (expense/income) do menu zmiany. */
  protected readonly changeableCategories = computed(() => {
    const all = this.categories.value() ?? [];
    const currentType = this.selectedCategory.transactionType ?? 'expense';
    return all.filter((cat) => (cat.transactionType ?? 'expense') === currentType);
  });

  protected selectedCategory: Category;
  protected amount: number | null = null;
  protected selectedDate: Date = new Date();
  protected comment = '';
  protected subcategorySignal = signal('');
  /** Sync from ngModel — we read signal for computed reactivity, but field is bound for ngModel. */
  protected get subcategory(): string {
    return this.subcategorySignal();
  }
  protected set subcategory(value: string) {
    this.subcategorySignal.set(value);
  }
  /** Whether the form is in edit mode. */
  protected isEditMode = false;

  private readonly originalCategoryId: string;
  private readonly originalAmount: number | null;
  private readonly originalDate: Date;
  private readonly originalComment: string;
  private readonly originalSubcategory: string;

  protected get isDirty(): boolean {
    if (!this.isEditMode) {
      return true;
    }

    const amountChanged = this.amount !== this.originalAmount;
    const commentChanged = this.comment.trim() !== this.originalComment;
    const categoryChanged = this.selectedCategory.id !== this.originalCategoryId;
    const dateChanged = !this.sameDay(this.selectedDate, this.originalDate);
    const subcategoryChanged = this.subcategory.trim() !== this.originalSubcategory;

    return amountChanged || commentChanged || categoryChanged || dateChanged || subcategoryChanged;
  }

  constructor() {
    this.selectedCategory = this.dialogData.category;
    this.originalCategoryId = this.dialogData.category.id;
    const existingTx = this.dialogData.transaction;
    if (existingTx) {
      this.isEditMode = true;
      this.amount = Math.abs(existingTx.amount);
      this.selectedDate = new Date(existingTx.date);
      this.comment = existingTx.comment ?? '';
      this.subcategory = existingTx.subcategory ?? '';
    }
    this.originalAmount = this.amount;
    this.originalDate = new Date(this.selectedDate);
    this.originalComment = this.comment;
    this.originalSubcategory = this.subcategory;
  }

  private sameDay(a: Date, b: Date): boolean {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  protected get transactionType(): TransactionType {
    return this.selectedCategory.transactionType ?? 'expense';
  }

  ngAfterViewInit(): void {
    if (this.isEditMode) {
      return;
    }
    this.amountInput.nativeElement.focus();
  }

  protected selectCategory(category: Category): void {
    this.selectedCategory = category;
    this.subcategory = '';
  }

  protected async save(): Promise<void> {
    if (!this.amount || this.amount <= 0 || !this.selectedDate) {
      return;
    }
    const trimmedSubcategory = this.subcategory.trim();
    if (trimmedSubcategory) {
      await this.subcategoryService.upsertSubcategoryAsync(
        this.selectedCategory.id,
        trimmedSubcategory,
      );
    }
    const signedAmount =
      this.transactionType === 'expense' ? -Math.abs(this.amount) : Math.abs(this.amount);
    this.dialogRef.close({
      categoryId: this.selectedCategory.id,
      amount: signedAmount,
      type: this.transactionType,
      date: this.selectedDate.toISOString(),
      comment: this.comment,
      subcategory: trimmedSubcategory || undefined,
      accountId: 'default',
      transaction: this.isEditMode ? this.dialogData.transaction : undefined,
    });
  }

  protected cancel(): void {
    this.dialogRef.close();
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Enter') {
      return;
    }
    if (!this.amount || this.amount <= 0 || !this.selectedDate) {
      return;
    }
    if (this.isEditMode && !this.isDirty) {
      return;
    }
    event.preventDefault();
    void this.save();
  }
}
