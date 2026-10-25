import { Component, inject, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { Transaction } from '@data-access-transaction';
import { CurrencyService } from '@currency';

@Component({
  selector: 'transaction-dashboard-category-detail',
  imports: [
    DatePipe,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
  ],
  template: `
    <div class="detail-table">
      <table mat-table [dataSource]="transactions()" class="table">
        <ng-container matColumnDef="date">
          <th mat-header-cell *matHeaderCellDef i18n="@@dashboard.detailDate">Data</th>
          <td mat-cell *matCellDef="let tx">{{ tx.date | date : 'dd.MM' }}</td>
        </ng-container>

        <ng-container matColumnDef="subcategory">
          <th mat-header-cell *matHeaderCellDef i18n="@@dashboard.detailSubcategory">Podkategoria</th>
          <td mat-cell *matCellDef="let tx">
            {{ tx.subcategory || '—' }}
            @if (tx.comment) {
              <span class="detail-table__comment">· {{ tx.comment }}</span>
            }
          </td>
        </ng-container>

        <ng-container matColumnDef="amount">
          <th mat-header-cell *matHeaderCellDef i18n="@@dashboard.detailAmount">Kwota</th>
          <td mat-cell *matCellDef="let tx" class="detail-table__amount">
            {{ currencyService.format(tx.amount) }}
          </td>
        </ng-container>

        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let tx">
            <button
              mat-icon-button
              type="button"
              (click)="edit.emit(tx)"
              matTooltip="Edytuj"
              i18n-matTooltip="@@dashboard.detailEditTooltip"
              aria-label="Edytuj transakcję"
              i18n-aria-label="@@dashboard.detailEditAria"
              class="detail-table__edit-btn"
            >
              <mat-icon>edit</mat-icon>
            </button>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
      </table>
    </div>
  `,
  styles: [`
    .detail-table {
      overflow-x: auto;
    }

    .table {
      width: 100%;
    }

    .detail-table__comment {
      color: var(--mat-sys-on-surface-variant, #6B7280);
      font-size: 0.85em;
    }

    .detail-table__amount {
      text-align: right;
      font-variant-numeric: tabular-nums;
    }

    .detail-table__edit-btn {
      width: 32px;
      height: 32px;
      line-height: 32px;
    }
  `],
})
export class DashboardCategoryDetailComponent {
  protected readonly currencyService = inject(CurrencyService);

  readonly transactions = input.required<Transaction[]>();
  readonly edit = output<Transaction>();

  protected readonly displayedColumns = ['date', 'subcategory', 'amount', 'actions'];
}