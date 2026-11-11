// spec: docs/specs/auth/01-firebase-authentication.md

import { inject, Injectable, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '@data-access-auth';

@Injectable({ providedIn: 'root' })
export class AuthScreenStateService {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly isLoading = this.authService.isLoading;
  readonly errorMessage = this.authService.errorMessage;

  readonly hidePassword = signal<boolean>(true);
  readonly hideConfirmPassword = signal<boolean>(true);

  togglePasswordVisibility(): void {
    this.hidePassword.update((val) => !val);
  }

  toggleConfirmPasswordVisibility(): void {
    this.hideConfirmPassword.update((val) => !val);
  }

  getReturnUrl(): string {
    return (
      this.route.snapshot.queryParams?.['returnUrl'] ||
      this.route.snapshot.queryParamMap?.get('returnUrl') ||
      '/'
    );
  }

  async loginWithEmail(email: string, password: string): Promise<boolean> {
    try {
      await this.authService.loginWithEmail({ email, password });
      await this.router.navigateByUrl(this.getReturnUrl());
      return true;
    } catch {
      return false;
    }
  }

  async registerWithEmail(email: string, password: string): Promise<boolean> {
    try {
      await this.authService.registerWithEmail({ email, password });
      await this.router.navigate(['/auth/verify-email'], {
        queryParams: { email },
      });
      return true;
    } catch {
      return false;
    }
  }

  async loginWithGoogle(): Promise<boolean> {
    try {
      await this.authService.loginWithGoogle();
      await this.router.navigateByUrl(this.getReturnUrl());
      return true;
    } catch {
      return false;
    }
  }

  continueAsGuest(): void {
    this.authService.continueAsGuest();
    this.router.navigateByUrl(this.getReturnUrl());
  }
}
