import { Component, inject, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDatepickerModule, MatDatepicker } from '@angular/material/datepicker';
import { DashboardState, PeriodMode } from '../../service/dashboard-state/dashboard-state';

@Component({
  selector: 'transaction-dashboard-period-selector',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatButtonToggleModule,
    MatDatepickerModule,
  ],
  template: `
    <div class="period-selector">
      <div class="period-selector__navigation">
        <button
          mat-icon-button
          (click)="dashboardState.goToPrevious()"
          [disabled]="!dashboardState.canGoPrevious()"
          aria-label="Poprzedni okres"
          i18n-aria-label="@@dashboard.prevPeriodAria"
        >
          <mat-icon>chevron_left</mat-icon>
        </button>

        <button
          class="period-selector__label"
          (click)="picker.open()"
          aria-label="Wybierz okres"
          i18n-aria-label="@@dashboard.pickPeriodAria"
        >
          {{ dashboardState.periodLabel() }}
        </button>

        <button
          mat-icon-button
          (click)="dashboardState.goToNext()"
          [disabled]="!dashboardState.canGoNext()"
          aria-label="Następny okres"
          i18n-aria-label="@@dashboard.nextPeriodAria"
        >
          <mat-icon>chevron_right</mat-icon>
        </button>
      </div>

      <div class="period-selector__controls">
        <mat-button-toggle-group
          [value]="dashboardState.periodMode()"
          (change)="onModeChange($event.value)"
          aria-label="Tryb okresu"
          i18n-aria-label="@@dashboard.periodModeAria"
        >
          <mat-button-toggle value="month" i18n="@@dashboard.monthMode">Miesiąc</mat-button-toggle>
          <mat-button-toggle value="year" i18n="@@dashboard.yearMode">Rok</mat-button-toggle>
        </mat-button-toggle-group>
      </div>

      <mat-datepicker
        #picker="matDatepicker"
        startView="multi-year"
        (monthSelected)="onMonthSelected($event, picker)"
        (yearSelected)="onYearSelected($event, picker)"
      />
    </div>
  `,
  styles: [`
    .period-selector {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 8px 0;
    }

    .period-selector__navigation {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .period-selector__label {
      font-size: 1.2rem;
      font-weight: 600;
      min-width: 180px;
      text-align: center;
      cursor: pointer;
      border: none;
      background: none;
      font: inherit;
      padding: 0;
      color: inherit;
    }

    .period-selector__label:hover {
      opacity: 0.7;
    }

    .period-selector__controls {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 12px;
    }
  `],
})
export class DashboardPeriodSelectorComponent {
  protected readonly dashboardState = inject(DashboardState);
  private readonly picker = viewChild.required<MatDatepicker<Date>>('picker');

  protected onModeChange(mode: PeriodMode): void {
    this.dashboardState.setPeriodMode(mode);
  }

  protected onMonthSelected(date: Date | null, picker: MatDatepicker<Date>): void {
    if (this.dashboardState.periodMode() !== 'month' || !date) {return;}

    this.dashboardState.setMonth(date.getMonth());
    this.dashboardState.setYear(date.getFullYear());
    picker.close();
  }

  protected onYearSelected(date: Date | null, picker: MatDatepicker<Date>): void {
    if (this.dashboardState.periodMode() !== 'year' || !date) {return;}

    this.dashboardState.setYear(date.getFullYear());
    picker.close();
  }
}