// spec: docs/specs/auth/01-firebase-authentication.md

import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { GoogleSignInButtonComponent } from '@ui-auth';
import { AuthContainerComponent } from '../container/auth-container.component';
import { AuthScreenStateService } from '../services/auth-screen-state.service';

@Component({
  selector: 'auth-login',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    GoogleSignInButtonComponent,
    AuthContainerComponent,
  ],
  template: `
    <auth-container
      title="Budget Fort"
      subtitle="Zaloguj się, aby zarządzać swoim budżetem"
      i18n-subtitle="@@auth.loginSubtitle"
      logoImage="images/login-screen-logo.png"
      backgroundImage="images/login-screen-logo.png"
      [loading]="screenState.isLoading()"
      [errorMessage]="screenState.errorMessage()"
    >
      <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="bf-login-form">
        <mat-form-field appearance="outline" class="bf-login-form__field">
          <mat-label i18n="@@auth.emailLabel">Adres email</mat-label>
          <input
            matInput
            type="email"
            formControlName="email"
            placeholder="twoj@email.com"
            autocomplete="email"
          />
          @if (loginForm.controls.email.hasError('required') && loginForm.controls.email.touched) {
            <mat-error i18n="@@auth.emailRequired">Adres email jest wymagany</mat-error>
          }
          @if (loginForm.controls.email.hasError('email') && loginForm.controls.email.touched) {
            <mat-error i18n="@@auth.emailInvalid">Wprowadź poprawny adres email</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="bf-login-form__field">
          <mat-label i18n="@@auth.passwordLabel">Hasło</mat-label>
          <input
            matInput
            [type]="screenState.hidePassword() ? 'password' : 'text'"
            formControlName="password"
            autocomplete="current-password"
          />
          <button
            mat-icon-button
            matSuffix
            type="button"
            (click)="screenState.togglePasswordVisibility()"
            [attr.aria-label]="'Przełącz widoczność hasła'"
          >
            <mat-icon>{{ screenState.hidePassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
          </button>
          @if (
            loginForm.controls.password.hasError('required') && loginForm.controls.password.touched
          ) {
            <mat-error i18n="@@auth.passwordRequired">Hasło jest wymagane</mat-error>
          }
        </mat-form-field>

        <button
          mat-flat-button
          color="primary"
          type="submit"
          class="bf-login-form__submit"
          [disabled]="loginForm.invalid || screenState.isLoading()"
          i18n="@@auth.loginButton"
        >
          Zaloguj się
        </button>
      </form>

      <div class="bf-login-form__divider">
        <span i18n="@@auth.orDivider">lub</span>
      </div>

      <auth-google-sign-in-button
        [loading]="screenState.isLoading()"
        (clicked)="onGoogleSignIn()"
      ></auth-google-sign-in-button>

      <div class="bf-login-form__divider">
        <span i18n="@@auth.orDivider">lub</span>
      </div>

      <button
        mat-stroked-button
        type="button"
        class="bf-login-form__guest-btn bf-auth-page__guest-btn"
        (click)="onContinueAsGuest()"
        i18n="@@auth.continueAsGuest"
      >
        Używaj lokalnie (bez logowania)
      </button>

      <div class="bf-login-form__footer">
        <span i18n="@@auth.dontHaveAccount">Nie masz konta?</span>
        <a routerLink="/auth/register" i18n="@@auth.goToRegister"> Zarejestruj się</a>
      </div>
    </auth-container>
  `,
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  readonly screenState = inject(AuthScreenStateService);

  readonly loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  async onSubmit(): Promise<void> {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    const { email, password } = this.loginForm.getRawValue();
    await this.screenState.loginWithEmail(email, password);
  }

  async onGoogleSignIn(): Promise<void> {
    await this.screenState.loginWithGoogle();
  }

  onContinueAsGuest(): void {
    this.screenState.continueAsGuest();
  }

  onGuestMode(): void {
    this.onContinueAsGuest();
  }
}
