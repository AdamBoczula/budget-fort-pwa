// spec: docs/qa/2026-10-21-ui-ux-audit.md
// spec: docs/specs/budget/poprawa-ux-ui-mvp.md

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
  template: `
    <div class="sheet-handle" aria-hidden="true"></div>

    <h2 mat-dialog-title class="form-title">
      @if (selectedCategory) {
        <span
          class="form-title__category-badge"
          [class.form-title__category-badge--income]="selectedCategory.transactionType === 'income'"
          [style.background-color]="
            selectedCategory.transactionType !== 'income' ? selectedCategory.colorHex : undefined
          "
          (click)="categoryMenuTrigger.openMenu()"
          (keydown.enter)="categoryMenuTrigger.openMenu()"
          (keydown.space)="categoryMenuTrigger.openMenu()"
          role="button"
          tabindex="0"
        >
          <mat-icon>{{ selectedCategory.icon }}</mat-icon>
          {{ selectedCategory.name }}
          <mat-icon class="form-title__change-icon">arrow_drop_down</mat-icon>
        </span>
      }
      <button
        mat-icon-button
        [matMenuTriggerFor]="categoryMenu"
        #categoryMenuTrigger="matMenuTrigger"
        type="button"
        i18n-aria-label="@@transactionForm.changeCategoryAria"
        aria-label="Zmień kategorię"
      >
        <mat-icon>swap_horiz</mat-icon>
      </button>
      <mat-menu #categoryMenu="matMenu">
        @if (changeableCategories(); as cats) {
          @for (cat of cats; track cat.id) {
            <button mat-menu-item (click)="selectCategory(cat)">
              <span class="category-menu-item">
                <span
                  class="category-menu-item__dot"
                  [style.background-color]="cat.colorHex"
                ></span>
                <mat-icon>{{ cat.icon }}</mat-icon>
                {{ cat.name }}
              </span>
            </button>
          }
        }
      </mat-menu>
    </h2>

    <mat-dialog-content class="form-content" (keydown)="onKeydown($event)">
      <div class="form-fields">
        <mat-form-field appearance="outline" class="full-width amount-field">
          <mat-label i18n="@@transactionForm.amountLabel">Kwota</mat-label>
          <input
            matInput
            type="number"
            #amountInput
            min="0"
            step="0.01"
            inputmode="decimal"
            cdkFocusInitial
            placeholder="0.00"
            [(ngModel)]="amount"
            required
            i18n-placeholder="@@transactionForm.amountPlaceholder"
          />
        </mat-form-field>

        @if (subcategories.value(); as quickSubs) {
          @if (quickSubs.length > 0) {
            <div class="subcategory-chips" aria-label="Szybki wybór podkategorii">
              @for (sub of quickSubs; track sub.id) {
                <button
                  type="button"
                  class="subcategory-chip"
                  [class.subcategory-chip--active]="subcategory === sub.name"
                  (click)="selectSubcategoryChip(sub.name)"
                >
                  {{ sub.name }}
                </button>
              }
            </div>
          }
        }

        <div class="form-row">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label i18n="@@transactionForm.dateLabel">Data</mat-label>
            <input matInput [matDatepicker]="datePicker" [(ngModel)]="selectedDate" required />
            <mat-datepicker-toggle matIconSuffix [for]="datePicker" />
            <mat-datepicker #datePicker />
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label i18n="@@transactionForm.subcategoryLabel"
              >Podkategoria (opcjonalna)</mat-label
            >
            <input
              matInput
              type="text"
              [(ngModel)]="subcategory"
              [matAutocomplete]="auto"
              i18n-placeholder="@@transactionForm.subcategoryPlaceholder"
              placeholder="Np. Naprawa"
            />
            <mat-autocomplete #auto="matAutocomplete">
              @if (filteredSubcategories(); as subs) {
                @for (sub of subs; track sub.id) {
                  <mat-option [value]="sub.name">{{ sub.name }}</mat-option>
                }
              }
            </mat-autocomplete>
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label i18n="@@transactionForm.commentLabel">Komentarz (opcjonalny)</mat-label>
          <input
            matInput
            type="text"
            [(ngModel)]="comment"
            i18n-placeholder="@@transactionForm.commentPlaceholder"
            placeholder="Np. Obiad w pracy"
          />
        </mat-form-field>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end" class="form-actions">
      <button mat-button (click)="cancel()" i18n="@@transactionForm.cancel">Anuluj</button>
      <button
        mat-flat-button
        class="form-actions__save"
        (click)="save()"
        [disabled]="!amount || amount <= 0 || !selectedDate || (isEditMode && !isDirty)"
        [matTooltip]="isEditMode && !isDirty ? 'Dokonaj zmian, aby móc zapisać transakcję.' : ''"
        i18n-matTooltip="@@transactionForm.saveDisabledTooltip"
        matTooltipPosition="above"
        i18n="@@transactionForm.save"
      >
        Zapisz
      </button>
    </mat-dialog-actions>
  `,
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
    this.focusAmountInput();
    this.dialogRef.afterOpened?.().subscribe(() => {
      this.focusAmountInput();
    });
  }

  private focusAmountInput(): void {
    const input = this.amountInput?.nativeElement;
    if (input) {
      input.focus();
      input.click();
    }
  }

  protected selectCategory(category: Category): void {
    this.selectedCategory = category;
    this.subcategory = '';
  }

  protected selectSubcategoryChip(name: string): void {
    this.subcategory = this.subcategory === name ? '' : name;
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
