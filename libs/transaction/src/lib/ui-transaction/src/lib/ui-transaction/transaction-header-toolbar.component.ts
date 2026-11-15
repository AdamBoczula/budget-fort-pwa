// spec: docs/qa/2026-10-21-ui-ux-audit.md
// spec: docs/specs/budget/poprawa-ux-ui-mvp.md
import { CommonModule } from '@angular/common';
import { Component, computed, inject, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { AuthService } from '@data-access-auth';
import { SyncStatusComponent } from '@ui-sync';
import { getUserAvatarInitials } from './avatar-utils';

@Component({
  selector: 'transaction-header-toolbar',
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    SyncStatusComponent,
  ],
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

      <div class="transaction-header-toolbar__actions">
        <sync-status />

        @if (currentUser() || isGuest()) {
          <div
            class="transaction-header-toolbar__user-avatar"
            [matTooltip]="userTooltip()"
            [attr.aria-label]="userTooltip()"
          >
            <span class="transaction-header-toolbar__user-initials">
              {{ userInitials() }}
            </span>
          </div>
        }

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
      </div>
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

  protected readonly currentUser = computed(() => this.authService?.currentUser() ?? null);
  protected readonly isGuest = computed(() => this.authService?.isGuest() ?? false);

  protected readonly userInitials = computed(() => {
    if (this.isGuest()) {
      return 'G';
    }
    const user = this.currentUser();
    return getUserAvatarInitials(user?.email || user?.displayName);
  });

  protected readonly userTooltip = computed(() => {
    const user = this.currentUser();
    if (user) {
      return user.displayName
        ? `${user.displayName} (${user.email || ''})`
        : user.email || 'Zalogowany';
    }
    return this.isGuest() ? 'Tryb lokalny (Gość)' : '';
  });

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
