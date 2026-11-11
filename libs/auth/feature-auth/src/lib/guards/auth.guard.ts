// spec: docs/specs/auth/01-firebase-authentication.md

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@data-access-auth';

export const authGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  await authService.waitForAuthReady();

  if (authService.isAuthorized()) {
    return true;
  }

  const user = authService.currentUser();
  if (user && !user.emailVerified && user.providerId === 'password') {
    return router.createUrlTree(['/auth/verify-email']);
  }

  return router.createUrlTree(['/auth/login'], {
    queryParams: state.url && state.url !== '/' ? { returnUrl: state.url } : undefined,
  });
};

export const publicOnlyGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  await authService.waitForAuthReady();

  if (authService.isAuthorized()) {
    return router.createUrlTree(['/']);
  }
  return true;
};
