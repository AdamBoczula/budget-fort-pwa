// spec: docs/specs/budget/poprawa-ux-ui-mvp.md
import { Component, inject, output } from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { Transaction } from '@data-access-transaction';
import { CurrencyService } from '@currency';
import { DashboardState } from '../../service/dashboard-state/dashboard-state';
import { DashboardCategoryDetailComponent } from '../dashboard-category-detail/dashboard-category-detail';

@Component({
  selector: 'transaction-dashboard-category-list',
  imports: [MatExpansionModule, MatIconModule, DashboardCategoryDetailComponent],
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
                  <span class="panel-description__percentage"> {{ cat.percentage }}% </span>
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
  styleUrl: './dashboard-category-list.scss',
})
export class DashboardCategoryListComponent {
  protected readonly dashboardState = inject(DashboardState);
  protected readonly currencyService = inject(CurrencyService);
  readonly editTransaction = output<Transaction>();

  protected onEditTransaction(transaction: Transaction): void {
    this.editTransaction.emit(transaction);
  }
}
