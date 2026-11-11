// spec: docs/specs/auth/01-firebase-authentication.md

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { AuthService } from '@data-access-auth';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;
  let mockAuthService: {
    loginWithEmail: ReturnType<typeof vi.fn>;
    loginWithGoogle: ReturnType<typeof vi.fn>;
    continueAsGuest: ReturnType<typeof vi.fn>;
    isLoading: ReturnType<typeof signal<boolean>>;
    errorMessage: ReturnType<typeof signal<string | null>>;
    currentUser: ReturnType<typeof signal<null>>;
  };
  let router: Router;

  beforeEach(async () => {
    mockAuthService = {
      loginWithEmail: vi.fn(),
      loginWithGoogle: vi.fn(),
      continueAsGuest: vi.fn(),
      isLoading: signal(false),
      errorMessage: signal<string | null>(null),
      currentUser: signal(null),
    };

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: (key: string) => (key === 'returnUrl' ? '/settings' : null),
              },
            },
          },
        },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // covers: docs/specs/auth/01-firebase-authentication.md#AC-1
  it('should call loginWithEmail and navigate to returnUrl on valid form submission', async () => {
    mockAuthService.loginWithEmail.mockResolvedValueOnce(undefined);

    component.loginForm.setValue({
      email: 'user@example.com',
      password: 'mypassword',
    });

    await component.onSubmit();

    expect(mockAuthService.loginWithEmail).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'mypassword',
    });
    expect(router.navigateByUrl).toHaveBeenCalledWith('/settings');
  });

  // covers: docs/specs/auth/01-firebase-authentication.md#AC-4
  it('should call loginWithGoogle and navigate on google sign in', async () => {
    mockAuthService.loginWithGoogle.mockResolvedValueOnce(undefined);

    await component.onGoogleSignIn();

    expect(mockAuthService.loginWithGoogle).toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/settings');
  });

  // covers: docs/specs/auth/01-firebase-authentication.md#AC-5
  it('should call continueAsGuest and navigate on guest mode click', () => {
    component.onGuestMode();

    expect(mockAuthService.continueAsGuest).toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/settings');
  });
});
