// spec: docs/specs/auth/01-firebase-authentication.md

import { Component, inject } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AuthService } from '@data-access-auth';

export const passwordMatchValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;
  return password && confirmPassword && password !== confirmPassword
    ? { passwordMismatch: true }
    : null;
};

@Component({
  selector: 'auth-register',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
  ],
  template: `
    <div class="bf-auth-page">
      <mat-card class="bf-auth-page__card">
        <mat-card-header class="bf-auth-page__header">
          <mat-card-title class="bf-auth-page__logo">
            <mat-icon color="primary">person_add</mat-icon>
            Budget Fort
          </mat-card-title>
          <mat-card-subtitle class="bf-auth-page__subtitle" i18n="@@auth.registerSubtitle">
            Utwórz nowe konto, aby bezpiecznie zarządzać budżetem
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

          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="bf-auth-page__form">
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
                registerForm.controls.email.hasError('required') &&
                registerForm.controls.email.touched
              ) {
                <mat-error i18n="@@auth.emailRequired">Adres email jest wymagany</mat-error>
              }
              @if (
                registerForm.controls.email.hasError('email') && registerForm.controls.email.touched
              ) {
                <mat-error i18n="@@auth.emailInvalid">Wprowadź poprawny adres email</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="bf-auth-page__field">
              <mat-label i18n="@@auth.passwordLabel">Hasło</mat-label>
              <input
                matInput
                [type]="hidePassword ? 'password' : 'text'"
                formControlName="password"
                autocomplete="new-password"
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
                registerForm.controls.password.hasError('required') &&
                registerForm.controls.password.touched
              ) {
                <mat-error i18n="@@auth.passwordRequired">Hasło jest wymagane</mat-error>
              }
              @if (
                registerForm.controls.password.hasError('minlength') &&
                registerForm.controls.password.touched
              ) {
                <mat-error i18n="@@auth.passwordMinLength"
                  >Hasło musi mieć co najmniej 8 znaków</mat-error
                >
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="bf-auth-page__field">
              <mat-label i18n="@@auth.confirmPasswordLabel">Powtórz hasło</mat-label>
              <input
                matInput
                [type]="hideConfirmPassword ? 'password' : 'text'"
                formControlName="confirmPassword"
                autocomplete="new-password"
              />
              <button
                mat-icon-button
                matSuffix
                type="button"
                (click)="hideConfirmPassword = !hideConfirmPassword"
                [attr.aria-label]="'Przełącz widoczność hasła'"
              >
                <mat-icon>{{ hideConfirmPassword ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              @if (
                registerForm.hasError('passwordMismatch') &&
                registerForm.controls.confirmPassword.touched
              ) {
                <mat-error i18n="@@auth.passwordsDoNotMatch">Hasła nie są identyczne</mat-error>
              }
            </mat-form-field>

            <button
              mat-flat-button
              color="primary"
              type="submit"
              class="bf-auth-page__submit"
              [disabled]="registerForm.invalid || authService.isLoading()"
              i18n="@@auth.signUpButton"
            >
              Zarejestruj się
            </button>
          </form>

          <div class="bf-auth-page__footer">
            <span i18n="@@auth.haveAccountPrompt">Masz już konto? </span>
            <a routerLink="/auth/login" i18n="@@auth.loginLink">Zaloguj się</a>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  hidePassword = true;
  hideConfirmPassword = true;

  readonly registerForm = this.fb.nonNullable.group(
    {
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: [passwordMatchValidator] },
  );

  async onSubmit(): Promise<void> {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const { email, password } = this.registerForm.getRawValue();

    try {
      await this.authService.registerWithEmail({ email, password });
      this.router.navigate(['/auth/verify-email'], {
        queryParams: { email },
      });
    } catch {
      // Błąd obsłużony w serwisie
    }
  }
}
