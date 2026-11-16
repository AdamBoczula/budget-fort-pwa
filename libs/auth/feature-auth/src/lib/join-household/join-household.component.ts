// spec: docs/specs/sync/03-household-invite-link.md
// uc: UC-2, UC-3

import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '@data-access-auth';
import {
  clearPendingInviteCode,
  setPendingInviteCode,
  SyncEngineService,
  SyncState,
} from '@data-access-sync';

@Component({
  selector: 'auth-join-household',
  imports: [MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="join-household" data-testid="join-household-screen">
      <div class="join-household__card">
        @if (status() === 'checking' || status() === 'joining') {
          <mat-spinner diameter="48" class="join-household__spinner"></mat-spinner>
          <h2 class="join-household__title" i18n="@@joinHousehold.joiningTitle">
            Dołączanie do gospodarstwa domowego...
          </h2>
          <p class="join-household__message" i18n="@@joinHousehold.joiningSubtitle">
            Weryfikujemy kod zaproszenia i przygotowujemy Twój budżet.
          </p>
        } @else if (status() === 'success') {
          <mat-icon class="join-household__icon join-household__icon--success">
            check_circle
          </mat-icon>
          <h2 class="join-household__title" i18n="@@joinHousehold.successTitle">
            Pomyślnie dołączono!
          </h2>
          <p class="join-household__message" i18n="@@joinHousehold.successSubtitle">
            Należysz teraz do wspólnego gospodarstwa domowego.
          </p>
          <div class="join-household__actions">
            <button
              mat-flat-button
              color="primary"
              type="button"
              (click)="goToDashboard()"
              data-testid="join-success-dashboard-btn"
              i18n="@@joinHousehold.goToDashboard"
            >
              Przejdź do aplikacji
            </button>
          </div>
        } @else if (status() === 'error') {
          <mat-icon class="join-household__icon join-household__icon--error">
            error_outline
          </mat-icon>
          <h2 class="join-household__title" i18n="@@joinHousehold.errorTitle">
            Nie udało się dołączyć do gospodarstwa
          </h2>
          <p
            class="join-household__message"
            data-testid="join-household-error-msg"
            i18n="@@joinHousehold.errorSubtitle"
          >
            {{ errorMessage() }}
          </p>
          <div class="join-household__actions">
            <button
              mat-stroked-button
              type="button"
              (click)="retry()"
              data-testid="join-retry-btn"
              i18n="@@joinHousehold.retryBtn"
            >
              Spróbuj ponownie
            </button>
            <button
              mat-flat-button
              color="primary"
              type="button"
              (click)="goToDashboard()"
              data-testid="join-error-dashboard-btn"
              i18n="@@joinHousehold.goToDashboard"
            >
              Przejdź do aplikacji
            </button>
          </div>
        }
      </div>
    </div>
  `,
  styleUrl: './join-household.component.scss',
})
export class JoinHouseholdComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly syncEngine = inject(SyncEngineService);
  private readonly syncState = inject(SyncState);
  private readonly snackBar = inject(MatSnackBar);

  readonly status = signal<'checking' | 'joining' | 'success' | 'error'>('checking');
  readonly errorMessage = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    await this.processInvite();
  }

  async processInvite(): Promise<void> {
    this.status.set('checking');
    this.errorMessage.set(null);

    const rawCode =
      this.route.snapshot.queryParamMap.get('code') ||
      this.route.snapshot.queryParamMap.get('invite');

    if (!rawCode?.trim()) {
      this.status.set('error');
      this.errorMessage.set('Brak kodu zaproszenia w linku.');
      return;
    }

    const code = rawCode.trim().toUpperCase();

    await this.authService.waitForAuthReady();

    if (!this.authService.isAuthorized() || this.authService.isGuest()) {
      // Store pending invite code in sessionStorage and redirect to login
      setPendingInviteCode(code);
      await this.router.navigate(['/auth/login'], {
        queryParams: { returnUrl: `/join?code=${encodeURIComponent(code)}` },
      });
      return;
    }

    // User is authenticated
    const currentHousehold = this.syncState.currentHousehold();
    if (currentHousehold?.inviteCode === code) {
      clearPendingInviteCode();
      this.status.set('success');
      this.snackBar.open('Należysz już do tego gospodarstwa domowego!', 'OK', { duration: 3000 });
      await this.router.navigate(['/']);
      return;
    }

    this.status.set('joining');
    try {
      await this.syncEngine.joinHousehold(code);
      clearPendingInviteCode();
      this.status.set('success');
      this.snackBar.open('Pomyślnie dołączono do gospodarstwa domowego!', 'OK', { duration: 4000 });
      await this.router.navigate(['/']);
    } catch (err) {
      this.status.set('error');
      const msg = err instanceof Error ? err.message : 'Nie udało się dołączyć do gospodarstwa.';
      this.errorMessage.set(msg);
    }
  }

  async retry(): Promise<void> {
    await this.processInvite();
  }

  async goToDashboard(): Promise<void> {
    await this.router.navigate(['/']);
  }
}
