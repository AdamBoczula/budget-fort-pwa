// spec: docs/specs/budget/planowanie-budzetu.md

import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'budget-quick-actions',
  imports: [RouterLink, MatButtonModule, MatIconModule],
  template: `
    <div class="quick-actions">
      <a mat-stroked-button routerLink="/feature-transaction" class="quick-actions__btn">
        <mat-icon>add_circle</mat-icon>
        Dodaj transakcję
      </a>
      <a mat-stroked-button routerLink="/feature-transaction/dashboard" class="quick-actions__btn">
        <mat-icon>dashboard</mat-icon>
        Dashboard
      </a>
    </div>
  `,
  styleUrl: './budget-quick-actions.component.scss',
})
export class BudgetQuickActionsComponent {}
