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
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { AuthContainerComponent } from '../container/auth-container.component';
import { AuthScreenStateService } from '../services/auth-screen-state.service';

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
  selector: 'auth-create-account',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    AuthContainerComponent,
  ],
  template: `
    <auth-container
      title="Budget Fort"
      subtitle="Utwórz nowe konto, aby bezpiecznie zarządzać budżetem"
      i18n-subtitle="@@auth.registerSubtitle"
      icon="person_add"
      [loading]="screenState.isLoading()"
      [errorMessage]="screenState.errorMessage()"
    >
      <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="bf-create-account-form">
        <mat-form-field appearance="outline" class="bf-create-account-form__field">
          <mat-label i18n="@@auth.emailLabel">Adres email</mat-label>
          <input
            matInput
            type="email"
            formControlName="email"
            placeholder="twoj@email.com"
            autocomplete="email"
          />
          @if (
            registerForm.controls.email.hasError('required') && registerForm.controls.email.touched
          ) {
            <mat-error i18n="@@auth.emailRequired">Adres email jest wymagany</mat-error>
          }
          @if (
            registerForm.controls.email.hasError('email') && registerForm.controls.email.touched
          ) {
            <mat-error i18n="@@auth.emailInvalid">Wprowadź poprawny adres email</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="bf-create-account-form__field">
          <mat-label i18n="@@auth.passwordLabel">Hasło</mat-label>
          <input
            matInput
            [type]="screenState.hidePassword() ? 'password' : 'text'"
            formControlName="password"
            autocomplete="new-password"
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

        <mat-form-field appearance="outline" class="bf-create-account-form__field">
          <mat-label i18n="@@auth.confirmPasswordLabel">Powtórz hasło</mat-label>
          <input
            matInput
            [type]="screenState.hideConfirmPassword() ? 'password' : 'text'"
            formControlName="confirmPassword"
            autocomplete="new-password"
          />
          <button
            mat-icon-button
            matSuffix
            type="button"
            (click)="screenState.toggleConfirmPasswordVisibility()"
            [attr.aria-label]="'Przełącz widoczność hasła'"
          >
            <mat-icon>{{
              screenState.hideConfirmPassword() ? 'visibility_off' : 'visibility'
            }}</mat-icon>
          </button>
          @if (
            registerForm.controls.confirmPassword.hasError('required') &&
            registerForm.controls.confirmPassword.touched
          ) {
            <mat-error i18n="@@auth.confirmPasswordRequired"
              >Powtórzenie hasła jest wymagane</mat-error
            >
          }
          @if (
            registerForm.hasError('passwordMismatch') &&
            registerForm.controls.confirmPassword.touched
          ) {
            <mat-error i18n="@@auth.passwordMismatch">Hasła nie są identyczne</mat-error>
          }
        </mat-form-field>

        <button
          mat-flat-button
          color="primary"
          type="submit"
          class="bf-create-account-form__submit"
          [disabled]="registerForm.invalid || screenState.isLoading()"
          i18n="@@auth.registerButton"
        >
          Zarejestruj się
        </button>
      </form>

      <div class="bf-create-account-form__footer">
        <span i18n="@@auth.alreadyHaveAccount">Masz już konto?</span>
        <a routerLink="/auth/login" i18n="@@auth.goToLogin"> Zaloguj się</a>
      </div>
    </auth-container>
  `,
  styleUrl: './create-account.component.scss',
})
export class CreateAccountComponent {
  private readonly fb = inject(FormBuilder);
  readonly screenState = inject(AuthScreenStateService);

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
    await this.screenState.registerWithEmail(email, password);
  }
}
