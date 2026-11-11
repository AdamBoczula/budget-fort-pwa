// spec: docs/qa/2026-10-21-ui-ux-audit.md
// spec: docs/specs/budget/poprawa-ux-ui-mvp.md
import { Component, inject, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router } from '@angular/router';
import { AuthService } from '@data-access-auth';

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

      <button
        type="button"
        matIconButton
        class="transaction-header-toolbar__logout-btn"
        i18n-aria-label="@@toolbar.logoutAria"
        aria-label="Wyloguj sie"
        (click)="onLogoutClick()"
      >
        <mat-icon class="transaction-header-toolbar__logout-icon">logout</mat-icon>
      </button>
    </mat-toolbar>
  `,
  styleUrl: './transaction-header-toolbar.component.scss',
})
export class TransactionHeaderToolbarComponent {
  private readonly authService = inject(AuthService, { optional: true });
  private readonly router = inject(Router, { optional: true });

  public readonly monthName = input('');
  public readonly menuClick = output<void>();
  public readonly logoutClick = output<void>();

  protected onMenuClick(): void {
    this.menuClick.emit();
  }

  protected async onLogoutClick(): Promise<void> {
    this.logoutClick.emit();
    if (this.authService) {
      await this.authService.logout();
    }
    if (this.router) {
      await this.router.navigate(['/auth/login']);
    }
  }
}
