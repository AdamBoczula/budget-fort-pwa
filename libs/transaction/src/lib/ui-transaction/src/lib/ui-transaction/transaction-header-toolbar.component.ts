// spec: docs/qa/2026-10-21-ui-ux-audit.md
// spec: docs/specs/budget/poprawa-ux-ui-mvp.md
import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';

@Component({
  selector: 'transaction-header-toolbar',
  imports: [MatToolbarModule, MatButtonModule, MatIconModule],
  template: `
    <mat-toolbar class="transaction-header-toolbar">
      <button
        type="button"
        matIconButton
        i18n-aria-label="@@toolbar.openNavigationAria"
        aria-label="Otworz nawigacje"
        (click)="onMenuClick()"
      >
        <mat-icon class="transaction-header-toolbar__menu-icon">menu</mat-icon>
      </button>

      <p class="transaction-header-toolbar__month">{{ monthName() }}</p>
    </mat-toolbar>
  `,
  styleUrl: './transaction-header-toolbar.component.scss',
})
export class TransactionHeaderToolbarComponent {
  public readonly monthName = input('');
  public readonly menuClick = output<void>();

  protected onMenuClick(): void {
    this.menuClick.emit();
  }
}
