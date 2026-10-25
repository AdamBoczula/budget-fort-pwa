import { Component, inject, output } from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { Transaction } from '@data-access-transaction';
import { CurrencyService } from '@currency';
import { DashboardState } from '../../service/dashboard-state/dashboard-state';
import { DashboardCategoryDetailComponent } from '../dashboard-category-detail/dashboard-category-detail';

@Component({
  selector: 'transaction-dashboard-category-list',
  imports: [
    MatExpansionModule,
    MatIconModule,
    DashboardCategoryDetailComponent,
  ],
  template: `
    <section class="category-list">
      @if (dashboardState.categoryWithSubcategories().length === 0) {
        <p class="category-list__empty" i18n="@@dashboard.categoryListEmpty">
          Brak wydatków w tym okresie.
        </p>
      } @else {
        <mat-accordion displayMode="flat" class="category-list__accordion">
          @for (cat of dashboardState.categoryWithSubcategories(); track cat.categoryId) {
            <mat-expansion-panel>
              <mat-expansion-panel-header>
                <mat-panel-title class="panel-title">
                  <span
                    class="panel-title__color-dot"
                    [style.background-color]="cat.colorHex"
                  ></span>
                  <span class="panel-title__name">{{ cat.categoryName }}</span>
                </mat-panel-title>
                <mat-panel-description class="panel-description">
                  <span class="panel-description__amount">
                    {{ currencyService.format(cat.totalAmount) }}
                  </span>
                  <span class="panel-description__percentage">
                    {{ cat.percentage }}%
                  </span>
                </mat-panel-description>
              </mat-expansion-panel-header>

              <div class="subcategories">
                @for (sub of cat.subcategories; track sub.name) {
                  <div class="subcategory">
                    <div class="subcategory__header">
                      <mat-icon class="subcategory__icon">subdirectory_arrow_right</mat-icon>
                      <span class="subcategory__name">{{ sub.name }}</span>
                      <span class="subcategory__amount">
                        {{ currencyService.format(sub.totalAmount) }}
                      </span>
                    </div>

                    <transaction-dashboard-category-detail
                      [transactions]="sub.transactions"
                      (edit)="onEditTransaction($event)"
                    />
                  </div>
                }
              </div>
            </mat-expansion-panel>
          }
        </mat-accordion>
      }
    </section>
  `,
  styles: [`
    .category-list {
      margin-top: 16px;
    }

    .category-list__empty {
      text-align: center;
      color: var(--mat-sys-on-surface-variant, #6B7280);
      font-style: italic;
      padding: 32px;
    }

    .category-list__accordion {
      --mat-expansion-container-shape: 12px;
    }

    .panel-title {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .panel-title__color-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .panel-title__name {
      font-weight: 500;
    }

    .panel-description {
      display: flex;
      align-items: center;
      gap: 12px;
      justify-content: flex-end;
    }

    .panel-description__amount {
      font-variant-numeric: tabular-nums;
      font-weight: 600;
    }

    .panel-description__percentage {
      color: var(--mat-sys-on-surface-variant, #6B7280);
      font-size: 0.85em;
      min-width: 45px;
      text-align: right;
    }

    .subcategories {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .subcategory {
      border-left: 3px solid var(--mat-sys-outline-variant, #E5E7EB);
      padding-left: 8px;
    }

    .subcategory__header {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 4px 0;
    }

    .subcategory__icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: var(--mat-sys-on-surface-variant, #6B7280);
    }

    .subcategory__name {
      flex: 1;
      font-weight: 500;
      font-size: 0.9em;
    }

    .subcategory__amount {
      font-variant-numeric: tabular-nums;
      font-weight: 600;
      font-size: 0.9em;
    }
  `],
})
export class DashboardCategoryListComponent {
  protected readonly dashboardState = inject(DashboardState);
  protected readonly currencyService = inject(CurrencyService);
  readonly editTransaction = output<Transaction>();

  protected onEditTransaction(transaction: Transaction): void {
    this.editTransaction.emit(transaction);
  }
}