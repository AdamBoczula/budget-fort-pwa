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
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { take } from 'rxjs';
import {
  Category,
  CategoryService,
  RecurringRuleService,
  SubcategoryService,
  Transaction,
  TransactionType,
} from '@data-access-transaction';

export const TRANSACTION_FORM_DIALOG_CONFIG = {
  width: '100vw',
  height: '100dvh',
  maxWidth: '100vw',
  maxHeight: '100dvh',
  panelClass: 'transaction-fullscreen-dialog',
} as const;

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
  isRecurring?: boolean;
  recurringDayOfMonth?: number;
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
    MatSlideToggleModule,
    MatTooltipModule,
  ],
  template: `
    <header class="form-header">
      <button
        mat-icon-button
        type="button"
        class="form-header__close"
        (click)="cancel()"
        i18n-aria-label="@@transactionForm.cancel"
        aria-label="Anuluj"
      >
        <mat-icon>close</mat-icon>
      </button>

      @if (selectedCategory) {
        <button
          type="button"
          class="form-header__category-badge"
          [class.form-header__category-badge--income]="
            selectedCategory.transactionType === 'income'
          "
          [style.background-color]="
            selectedCategory.transactionType !== 'income' ? selectedCategory.colorHex : undefined
          "
          [matMenuTriggerFor]="categoryMenu"
          [attr.aria-label]="changeCategoryAriaLabel"
        >
          <mat-icon>{{ selectedCategory.icon }}</mat-icon>
          <span>{{ selectedCategory.name }}</span>
          <mat-icon class="form-header__change-icon">arrow_drop_down</mat-icon>
        </button>
      }

      <mat-menu #categoryMenu="matMenu">
        @if (expenseCategories(); as expenses) {
          @if (expenses.length > 0) {
            <div class="category-menu-header" i18n="@@transactionForm.expense">Wydatek</div>
            @for (cat of expenses; track cat.id) {
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
        }
        @if (incomeCategories(); as incomes) {
          @if (incomes.length > 0) {
            <div class="category-menu-header" i18n="@@transactionForm.income">Przychód</div>
            @for (cat of incomes; track cat.id) {
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
        }
      </mat-menu>

      <button
        mat-flat-button
        type="button"
        class="form-header__save"
        (click)="save()"
        [disabled]="!canSave"
        [matTooltip]="saveDisabledTooltip"
        matTooltipPosition="below"
        i18n="@@transactionForm.save"
      >
        Zapisz
      </button>
    </header>

    <mat-dialog-content class="form-content">
      <div class="form-fields">
        <div class="amount-recurring-row">
          <mat-form-field appearance="outline" subscriptSizing="dynamic" class="amount-field">
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
              (keydown.enter)="onEnterSave($event)"
              required
              i18n-placeholder="@@transactionForm.amountPlaceholder"
            />
          </mat-form-field>

          <div class="recurring-toggle-wrapper">
            <mat-slide-toggle
              [(ngModel)]="isRecurring"
              name="isRecurring"
              color="primary"
              i18n="@@transactionForm.recurringToggle"
            >
              Ustaw jako wydatek cykliczny
            </mat-slide-toggle>
          </div>
        </div>

        @if (isRecurring) {
          <mat-form-field
            appearance="outline"
            subscriptSizing="dynamic"
            class="recurring-day-field"
          >
            <mat-label i18n="@@transactionForm.recurringDayLabel">Dzień miesiąca</mat-label>
            <input
              matInput
              type="number"
              min="1"
              max="31"
              [(ngModel)]="recurringDayOfMonth"
              name="recurringDayOfMonth"
              required
            />
            <span matSuffix i18n="@@transactionForm.daySuffix">. dzień</span>
          </mat-form-field>
        }

        @if (subcategories.value(); as quickSubs) {
          @if (quickSubs.length > 0) {
            <div
              class="subcategory-chips"
              role="group"
              i18n-aria-label="@@transactionForm.quickSubcategoriesAria"
              aria-label="Szybki wybór podkategorii"
            >
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

        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="full-width">
          <mat-label i18n="@@transactionForm.subcategoryLabel">Podkategoria (opcjonalna)</mat-label>
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

        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="full-width">
          <mat-label i18n="@@transactionForm.commentLabel">Komentarz (opcjonalny)</mat-label>
          <input
            matInput
            type="text"
            [(ngModel)]="comment"
            (keydown.enter)="onEnterSave($event)"
            i18n-placeholder="@@transactionForm.commentPlaceholder"
            placeholder="Np. Obiad w pracy"
          />
        </mat-form-field>

        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="date-field">
          <mat-label i18n="@@transactionForm.dateLabel">Data</mat-label>
          <input matInput [matDatepicker]="datePicker" [(ngModel)]="selectedDate" required />
          <mat-datepicker-toggle matIconSuffix [for]="datePicker" />
          <mat-datepicker #datePicker />
        </mat-form-field>
      </div>
    </mat-dialog-content>
  `,
  styleUrl: './transaction-form.scss',
})
export class TransactionFormComponent implements AfterViewInit {
  private readonly categoryService = inject(CategoryService);
  private readonly subcategoryService = inject(SubcategoryService);
  private readonly recurringRuleService = inject(RecurringRuleService, { optional: true });
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

  /** Kategorie wydatków do menu wyboru kategorii. */
  protected readonly expenseCategories = computed(() => {
    const all = this.categories.value() ?? [];
    return all.filter((cat) => (cat.transactionType ?? 'expense') === 'expense' && !cat.isHidden);
  });

  /** Kategorie przychodów do menu wyboru kategorii. */
  protected readonly incomeCategories = computed(() => {
    const all = this.categories.value() ?? [];
    return all.filter((cat) => cat.transactionType === 'income');
  });

  protected selectedCategory: Category;
  protected readonly selectedType = signal<TransactionType>('expense');
  protected amount: number | null = null;
  protected selectedDate: Date = new Date();
  protected comment = '';
  protected isRecurring = false;
  protected recurringDayOfMonth = new Date().getDate();
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
  private readonly originalType: TransactionType;
  private readonly originalAmount: number | null;
  private readonly originalDate: Date;
  private readonly originalComment: string;
  private readonly originalSubcategory: string;
  private readonly originalIsRecurring: boolean;
  private readonly originalRecurringDayOfMonth: number;

  protected get changeCategoryAriaLabel(): string {
    return $localize`:@@transactionForm.changeCategoryAriaWithName:Zmień kategorię: ${this.selectedCategory.name}:categoryName:`;
  }

  protected get saveDisabledTooltip(): string {
    return this.isEditMode && !this.isDirty
      ? $localize`:@@transactionForm.saveDisabledTooltip:Dokonaj zmian, aby móc zapisać transakcję.`
      : '';
  }

  protected get canSave(): boolean {
    if (!this.amount || this.amount <= 0) {
      return false;
    }
    if (!this.selectedDate || Number.isNaN(this.selectedDate.getTime())) {
      return false;
    }
    if (this.isRecurring) {
      if (
        !Number.isInteger(this.recurringDayOfMonth) ||
        this.recurringDayOfMonth < 1 ||
        this.recurringDayOfMonth > 31
      ) {
        return false;
      }
    }
    return !this.isEditMode || this.isDirty;
  }

  protected get isDirty(): boolean {
    if (!this.isEditMode) {
      return true;
    }

    const amountChanged = this.amount !== this.originalAmount;
    const commentChanged = this.comment.trim() !== this.originalComment;
    const categoryChanged = this.selectedCategory.id !== this.originalCategoryId;
    const typeChanged = this.selectedType() !== this.originalType;
    const dateChanged = !this.sameDay(this.selectedDate, this.originalDate);
    const subcategoryChanged = this.subcategory.trim() !== this.originalSubcategory;
    const recurringChanged =
      this.isRecurring !== this.originalIsRecurring ||
      (this.isRecurring && this.recurringDayOfMonth !== this.originalRecurringDayOfMonth);

    return (
      amountChanged ||
      commentChanged ||
      categoryChanged ||
      typeChanged ||
      dateChanged ||
      subcategoryChanged ||
      recurringChanged
    );
  }

  constructor() {
    this.selectedCategory = this.dialogData.category;
    this.originalCategoryId = this.dialogData.category.id;
    const initialType: TransactionType = this.dialogData.category.transactionType ?? 'expense';
    this.selectedType.set(initialType);
    this.originalType = initialType;
    const existingTx = this.dialogData.transaction;
    if (existingTx) {
      this.isEditMode = true;
      this.amount = Math.abs(existingTx.amount);
      this.selectedDate = new Date(existingTx.date);
      this.comment = existingTx.comment ?? '';
      this.subcategory = existingTx.subcategory ?? '';
      this.isRecurring = Boolean(existingTx.recurringRuleId);
      if (existingTx.recurringRuleId) {
        const existingRule = this.recurringRuleService
          ?.rules()
          .find((r) => r.id === existingTx.recurringRuleId);
        this.recurringDayOfMonth = existingRule?.dayOfMonth ?? this.selectedDate.getDate();
      }
    }
    this.originalAmount = this.amount;
    this.originalDate = new Date(this.selectedDate);
    this.originalComment = this.comment.trim();
    this.originalSubcategory = this.subcategory.trim();
    this.originalIsRecurring = this.isRecurring;
    this.originalRecurringDayOfMonth = this.recurringDayOfMonth;
  }

  private sameDay(a: Date, b: Date): boolean {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  protected get transactionType(): TransactionType {
    return this.selectedType();
  }

  ngAfterViewInit(): void {
    if (this.isEditMode) {
      return;
    }
    this.focusAmountInput();
    this.dialogRef
      .afterOpened?.()
      .pipe(take(1))
      .subscribe(() => {
        this.focusAmountInput();
      });
  }

  private focusAmountInput(): void {
    const input = this.amountInput?.nativeElement;
    if (input) {
      input.focus();
    }
  }

  protected selectCategory(category: Category): void {
    this.selectedCategory = category;
    this.selectedType.set(category.transactionType ?? 'expense');
    this.subcategory = '';
  }

  protected selectSubcategoryChip(name: string): void {
    this.subcategory = this.subcategory === name ? '' : name;
  }

  protected async save(): Promise<void> {
    if (!this.canSave || !this.amount || !this.selectedDate) {
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
      isRecurring: this.isRecurring,
      recurringDayOfMonth: this.recurringDayOfMonth,
    });
  }

  protected cancel(): void {
    this.dialogRef.close();
  }

  protected onEnterSave(event: Event): void {
    if (!this.canSave) {
      return;
    }
    event.preventDefault();
    void this.save();
  }
}
