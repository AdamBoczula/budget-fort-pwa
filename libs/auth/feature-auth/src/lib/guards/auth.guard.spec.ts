// spec: docs/specs/auth/01-firebase-authentication.md

import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AuthService } from '@data-access-auth';
import { authGuard, publicOnlyGuard } from './auth.guard';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('authGuard', () => {
  let mockAuthService: {
    waitForAuthReady: ReturnType<typeof vi.fn>;
    isAuthorized: ReturnType<typeof vi.fn>;
    currentUser: ReturnType<typeof vi.fn>;
  };
  let mockRouter: {
    createUrlTree: ReturnType<typeof vi.fn>;
  };

  const dummyRoute = {} as ActivatedRouteSnapshot;
  const dummyState = { url: '/settings' } as RouterStateSnapshot;

  beforeEach(() => {
    mockAuthService = {
      waitForAuthReady: vi.fn().mockResolvedValue(undefined),
      isAuthorized: vi.fn(),
      currentUser: vi.fn(),
    };

    mockRouter = {
      createUrlTree: vi.fn((commands, extras) => ({ commands, extras }) as unknown as UrlTree),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
      ],
    });
  });

  // covers: docs/specs/auth/01-firebase-authentication.md#AC-6
  it('should allow access when user is authorized (authenticated or guest)', async () => {
    mockAuthService.isAuthorized.mockReturnValue(true);

    const result = await TestBed.runInInjectionContext(() => authGuard(dummyRoute, dummyState));

    expect(result).toBe(true);
  });

  // covers: docs/specs/auth/01-firebase-authentication.md#AC-6
  it('should redirect to login with returnUrl when user is not authorized', async () => {
    mockAuthService.isAuthorized.mockReturnValue(false);
    mockAuthService.currentUser.mockReturnValue(null);

    const result = await TestBed.runInInjectionContext(() => authGuard(dummyRoute, dummyState));

    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/auth/login'], {
      queryParams: { returnUrl: '/settings' },
    });
    expect(result).toEqual({
      commands: ['/auth/login'],
      extras: { queryParams: { returnUrl: '/settings' } },
    });
  });

  // covers: docs/specs/auth/01-firebase-authentication.md#AC-2
  it('should redirect to verify-email if user has unverified email account', async () => {
    mockAuthService.isAuthorized.mockReturnValue(false);
    mockAuthService.currentUser.mockReturnValue({
      uid: 'u1',
      email: 'u1@example.com',
      emailVerified: false,
      providerId: 'password',
    });

    await TestBed.runInInjectionContext(() => authGuard(dummyRoute, dummyState));

    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/auth/verify-email']);
  });

  it('publicOnlyGuard should redirect to root when user is authorized', async () => {
    mockAuthService.isAuthorized.mockReturnValue(true);

    await TestBed.runInInjectionContext(() => publicOnlyGuard(dummyRoute, dummyState));

    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/']);
  });

  it('publicOnlyGuard should allow access when user is not authorized', async () => {
    mockAuthService.isAuthorized.mockReturnValue(false);

    const result = await TestBed.runInInjectionContext(() =>
      publicOnlyGuard(dummyRoute, dummyState),
    );

    expect(result).toBe(true);
  });
});
