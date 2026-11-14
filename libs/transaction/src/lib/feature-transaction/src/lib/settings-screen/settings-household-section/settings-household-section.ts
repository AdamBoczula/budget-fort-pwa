// spec: docs/specs/sync/02-multi-user-household.md

import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '@data-access-auth';
import { SyncEngineService, SyncState } from '@data-access-sync';

@Component({
  selector: 'transaction-settings-household-section',
  imports: [FormsModule, MatButtonModule, MatIconModule, MatTooltipModule],
  template: `
    <section class="household-section" data-testid="settings-household-section">
      <div class="household-section__header">
        <div class="household-section__title-group">
          <div class="household-section__title-row">
            <mat-icon class="household-section__header-icon">people</mat-icon>
            <h2 class="household-section__title" i18n="@@settingsHousehold.title">
              Gospodarstwo domowe
            </h2>
          </div>
          <p class="household-section__subtitle" i18n="@@settingsHousehold.subtitle">
            Współdziel wydatki i budżet z partnerem lub domownikami.
          </p>
        </div>
      </div>

      @if (isGuest()) {
        <div class="household-section__guest-banner" data-testid="household-guest-banner">
          <mat-icon>info</mat-icon>
          <span i18n="@@settingsHousehold.guestMsg">
            Współdzielenie budżetu z domownikami wymaga zalogowania na konto.
          </span>
        </div>
      } @else {
        <div class="household-section__card" data-testid="household-card">
          <div class="household-section__info-row">
            <span class="household-section__label" i18n="@@settingsHousehold.nameLabel">
              Nazwa gospodarstwa
            </span>
            <span class="household-section__value" data-testid="household-name">
              {{ householdName() }}
            </span>
          </div>

          <div class="household-section__info-row">
            <span class="household-section__label" i18n="@@settingsHousehold.membersLabel">
              Liczba domowników
            </span>
            <span class="household-section__value" data-testid="household-members-count">
              {{ membersCount() }}
            </span>
          </div>

          <div class="household-section__info-row">
            <span class="household-section__label" i18n="@@settingsHousehold.inviteCodeLabel">
              Twój kod zaproszenia
            </span>
            <div class="household-section__code-container">
              <span class="household-section__code-badge" data-testid="household-invite-code">
                {{ inviteCode() }}
              </span>
              <button
                mat-stroked-button
                type="button"
                (click)="copyInviteCode()"
                data-testid="copy-invite-code-btn"
                i18n="@@settingsHousehold.copyBtn"
              >
                <mat-icon>content_copy</mat-icon>
                Kopiuj
              </button>
            </div>
          </div>

          <div class="household-section__join-form">
            <h3 class="household-section__join-title" i18n="@@settingsHousehold.joinTitle">
              Dołącz do gospodarstwa partnera
            </h3>
            <div class="household-section__join-row">
              <input
                type="text"
                class="household-section__input"
                placeholder="Wpisz kod (np. BF89X2)"
                i18n-placeholder="@@settingsHousehold.inputPlaceholder"
                [value]="inviteCodeInput()"
                (input)="onInviteCodeInput($event)"
                maxlength="10"
                data-testid="join-household-input"
              />
              <button
                mat-flat-button
                color="primary"
                type="button"
                [disabled]="!inviteCodeInput().trim() || isJoining()"
                (click)="joinHousehold()"
                data-testid="join-household-btn"
                i18n="@@settingsHousehold.joinBtn"
              >
                @if (isJoining()) {
                  <mat-icon>sync</mat-icon>
                } @else {
                  <mat-icon>group_add</mat-icon>
                }
                Dołącz
              </button>
            </div>
            @if (errorMessage()) {
              <p class="household-section__error" data-testid="join-household-error">
                {{ errorMessage() }}
              </p>
            }
          </div>
        </div>
      }
    </section>
  `,
  styleUrl: './settings-household-section.scss',
})
export class SettingsHouseholdSectionComponent {
  private readonly auth = inject(AuthService);
  private readonly syncState = inject(SyncState);
  private readonly syncEngine = inject(SyncEngineService);
  private readonly snackBar = inject(MatSnackBar);

  readonly isGuest = computed(() => this.auth.isGuest());
  readonly currentHousehold = computed(() => this.syncState.currentHousehold());

  readonly householdName = computed(() => this.currentHousehold()?.name || 'Budżet Domowy');
  readonly membersCount = computed(() => this.currentHousehold()?.members?.length ?? 1);
  readonly inviteCode = computed(() => this.currentHousehold()?.inviteCode || '—');

  readonly inviteCodeInput = signal('');
  readonly isJoining = signal(false);
  readonly errorMessage = signal<string | null>(null);

  onInviteCodeInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.inviteCodeInput.set(target.value);
  }

  async copyInviteCode(): Promise<void> {
    const code = this.inviteCode();
    if (code && code !== '—') {
      try {
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
          await navigator.clipboard.writeText(code);
        }
        this.snackBar.open('Kod zaproszenia skopiowany do schowka!', 'OK', { duration: 3000 });
      } catch {
        this.snackBar.open(`Kod: ${code}`, 'OK', { duration: 5000 });
      }
    }
  }

  async joinHousehold(): Promise<void> {
    const code = this.inviteCodeInput().trim();
    if (!code) {
      return;
    }

    this.isJoining.set(true);
    this.errorMessage.set(null);

    try {
      await this.syncEngine.joinHousehold(code);
      this.inviteCodeInput.set('');
      this.snackBar.open('Pomyślnie dołączono do gospodarstwa domowego!', 'OK', { duration: 4000 });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Nie udało się dołączyć do gospodarstwa.';
      this.errorMessage.set(msg);
    } finally {
      this.isJoining.set(false);
    }
  }
}
