// spec: docs/specs/auth/01-firebase-authentication.md

import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '@data-access-auth';

@Component({
  selector: 'auth-verify-email',
  imports: [RouterLink, MatCardModule, MatButtonModule, MatIconModule],
  template: `
    <div class="bf-auth-page">
      <mat-card class="bf-auth-page__card">
        <div class="bf-auth-page__icon-wrapper">
          <mat-icon class="bf-auth-page__icon">mark_email_read</mat-icon>
        </div>

        <h1 class="bf-auth-page__title" i18n="@@auth.verifyEmailTitle">
          Potwierdź swój adres email
        </h1>

        <p class="bf-auth-page__description">
          <span i18n="@@auth.verifyEmailDesc1">Wysłaliśmy link aktywacyjny na adres: </span>
          @if (userEmail()) {
            <strong>{{ userEmail() }}</strong
            >.
          }
          <br />
          <span i18n="@@auth.verifyEmailDesc2">
            Kliknij link w wiadomości email, aby aktywować swoje konto i móc się zalogować.
          </span>
        </p>

        <div class="bf-auth-page__actions">
          <a
            mat-flat-button
            color="primary"
            routerLink="/auth/login"
            class="bf-auth-page__btn"
            i18n="@@auth.backToLoginButton"
          >
            Przejdź do logowania
          </a>
        </div>
      </mat-card>
    </div>
  `,
  styleUrl: './verify-email.component.scss',
})
export class VerifyEmailComponent {
  private readonly route = inject(ActivatedRoute);
  readonly authService = inject(AuthService);

  readonly userEmail = signal<string>(
    this.route.snapshot.queryParamMap.get('email') || this.authService.currentUser()?.email || '',
  );
}
