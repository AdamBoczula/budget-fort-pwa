// spec: docs/specs/auth/01-firebase-authentication.md

import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AuthService } from '@data-access-auth';
import { GoogleSignInButtonComponent } from '@ui-auth';

@Component({
  selector: 'auth-login',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    GoogleSignInButtonComponent,
  ],
  template: `
    <div class="bf-auth-page">
      <mat-card class="bf-auth-page__card">
        <mat-card-header class="bf-auth-page__header">
          <mat-card-title class="bf-auth-page__logo">
            <mat-icon color="primary">account_balance_wallet</mat-icon>
            Budget Fort
          </mat-card-title>
          <mat-card-subtitle class="bf-auth-page__subtitle" i18n="@@auth.loginSubtitle">
            Zaloguj się, aby zarządzać swoim budżetem
          </mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          @if (authService.isLoading()) {
            <mat-progress-bar
              mode="indeterminate"
              class="bf-auth-page__progress"
            ></mat-progress-bar>
          }

          @if (authService.errorMessage()) {
            <div class="bf-auth-page__error-alert" role="alert">
              <mat-icon>error_outline</mat-icon>
              <span>{{ authService.errorMessage() }}</span>
            </div>
          }

          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="bf-auth-page__form">
            <mat-form-field appearance="outline" class="bf-auth-page__field">
              <mat-label i18n="@@auth.emailLabel">Adres email</mat-label>
              <input
                matInput
                type="email"
                formControlName="email"
                placeholder="twoj@email.com"
                autocomplete="email"
              />
              @if (
                loginForm.controls.email.hasError('required') && loginForm.controls.email.touched
              ) {
                <mat-error i18n="@@auth.emailRequired">Adres email jest wymagany</mat-error>
              }
              @if (loginForm.controls.email.hasError('email') && loginForm.controls.email.touched) {
                <mat-error i18n="@@auth.emailInvalid">Wprowadź poprawny adres email</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="bf-auth-page__field">
              <mat-label i18n="@@auth.passwordLabel">Hasło</mat-label>
              <input
                matInput
                [type]="hidePassword ? 'password' : 'text'"
                formControlName="password"
                autocomplete="current-password"
              />
              <button
                mat-icon-button
                matSuffix
                type="button"
                (click)="hidePassword = !hidePassword"
                [attr.aria-label]="'Przełącz widoczność hasła'"
              >
                <mat-icon>{{ hidePassword ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              @if (
                loginForm.controls.password.hasError('required') &&
                loginForm.controls.password.touched
              ) {
                <mat-error i18n="@@auth.passwordRequired">Hasło jest wymagane</mat-error>
              }
            </mat-form-field>

            <button
              mat-flat-button
              color="primary"
              type="submit"
              class="bf-auth-page__submit"
              [disabled]="loginForm.invalid || authService.isLoading()"
              i18n="@@auth.signInButton"
            >
              Zaloguj się
            </button>
          </form>

          <div class="bf-auth-page__divider">
            <span i18n="@@auth.orDivider">lub</span>
          </div>

          <auth-google-sign-in-button
            [loading]="authService.isLoading()"
            (clicked)="onGoogleSignIn()"
          ></auth-google-sign-in-button>

          <div class="bf-auth-page__divider">
            <span i18n="@@auth.orDivider">lub</span>
          </div>

          <button
            mat-stroked-button
            type="button"
            class="bf-auth-page__guest-btn"
            [disabled]="authService.isLoading()"
            (click)="onGuestMode()"
            i18n="@@auth.guestButton"
          >
            Używaj lokalnie (bez logowania)
          </button>

          <div class="bf-auth-page__footer">
            <span i18n="@@auth.noAccountPrompt">Nie masz konta? </span>
            <a routerLink="/auth/register" i18n="@@auth.registerLink">Zarejestruj się</a>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  hidePassword = true;

  readonly loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  async onSubmit(): Promise<void> {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    try {
      await this.authService.loginWithEmail(this.loginForm.getRawValue());
      this.navigateAfterLogin();
    } catch {
      // Błąd jest już obsłużony i widoczny w authService.errorMessage()
    }
  }

  async onGoogleSignIn(): Promise<void> {
    try {
      await this.authService.loginWithGoogle();
      this.navigateAfterLogin();
    } catch {
      // Błąd obsłużony w serwisie
    }
  }

  onGuestMode(): void {
    this.authService.continueAsGuest();
    this.navigateAfterLogin();
  }

  private navigateAfterLogin(): void {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/';
    this.router.navigateByUrl(returnUrl);
  }
}
