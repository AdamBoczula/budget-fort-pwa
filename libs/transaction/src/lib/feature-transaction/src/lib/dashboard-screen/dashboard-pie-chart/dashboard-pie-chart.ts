import {
  Component,
  computed,
  ElementRef,
  inject,
  viewChild,
  afterRenderEffect,
} from '@angular/core';
import { Chart, ArcElement, Tooltip, Legend, DoughnutController } from 'chart.js';
import type { ChartConfiguration } from 'chart.js';
import { DashboardState } from '../../service/dashboard-state/dashboard-state';
import { CurrencyService } from '@currency';

Chart.register(DoughnutController, ArcElement, Tooltip, Legend);

@Component({
  selector: 'transaction-dashboard-pie-chart',
  template: `
    <div class="pie-chart-wrapper">
      @if (hasData()) {
        <div class="pie-chart-container">
          <canvas #chartCanvas></canvas>
        </div>
      } @else {
        <div class="pie-chart-empty" i18n="@@dashboard.pieChartEmpty">
          Brak wydatków w tym okresie
        </div>
      }
    </div>
  `,
  styles: [`
    .pie-chart-wrapper {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 300px;
    }

    .pie-chart-container {
      position: relative;
      width: 300px;
      height: 300px;
    }

    .pie-chart-empty {
      color: var(--mat-sys-on-surface-variant, #6B7280);
      font-style: italic;
    }
  `],
})
export class DashboardPieChartComponent {
  private readonly dashboardState = inject(DashboardState);
  private readonly currencyService = inject(CurrencyService);
  private readonly chartCanvas = viewChild<ElementRef<HTMLCanvasElement>>('chartCanvas');

  private chartInstance: Chart<'doughnut'> | null = null;

  protected readonly hasData = computed(() =>
    this.dashboardState.categorySpending().length > 0,
  );

  /** Plugin do wyświetlania tekstu w centrum wykresu kołowego. */
  private readonly centerTextPlugin = {
    id: 'centerText',
    beforeDraw: (chart: Chart<'doughnut'>) => {
      const { width, height, chartArea } = chart;
      const ctx = chart.ctx;
      ctx.save();

      const total = this.dashboardState.totalSpending();
      const text = this.currencyService.format(total);

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = getComputedStyle(ctx.canvas).color || '#000';

      const centerX = (chartArea.left + chartArea.right) / 2;
      const centerY = (chartArea.top + chartArea.bottom) / 2;

      // Main text: amount
      ctx.font = `bold ${Math.min(width, height) * 0.055}px system-ui, sans-serif`;
      ctx.fillText(text, centerX, centerY);

      ctx.restore();
    },
  };

  constructor() {
    afterRenderEffect({
      read: () => {
        this.setupChart();
      },
    });
  }

  private setupChart(): void {
    const canvasEl = this.chartCanvas();
    if (!canvasEl) {return;}

    // Zniszcz poprzedni wykres
    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = null;
    }

    const data = this.dashboardState.categorySpending();
    if (data.length === 0) {return;}

    const config: ChartConfiguration<'doughnut'> = {
      type: 'doughnut',
      data: {
        labels: data.map((d) => d.categoryName),
        datasets: [
          {
            data: data.map((d) => d.totalAmount),
            backgroundColor: data.map((d) => d.colorHex),
            borderWidth: 2,
            borderColor: getComputedStyle(canvasEl.nativeElement)
              .getPropertyValue('--mat-sys-surface')
              .trim() || 'white',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        cutout: '55%',
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              padding: 16,
              usePointStyle: true,
              pointStyle: 'circle',
            },
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const cat = data[context.dataIndex];
                const amount = this.currencyService.format(cat.totalAmount);
                return `${cat.categoryName}: ${amount} (${cat.percentage}%)`;
              },
            },
          },
        },
      },
      plugins: [this.centerTextPlugin],
    };

    this.chartInstance = new Chart(canvasEl.nativeElement, config);
  }
}