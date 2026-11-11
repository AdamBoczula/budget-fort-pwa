// spec: docs/specs/auth/01-firebase-authentication.md

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CreateAccountComponent } from './create-account.component';
import { AuthService } from '@data-access-auth';
import { Router, provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('CreateAccountComponent', () => {
  let fixture: ComponentFixture<CreateAccountComponent>;
  let component: CreateAccountComponent;
  let mockAuthService: {
    registerWithEmail: ReturnType<typeof vi.fn>;
    isLoading: ReturnType<typeof signal<boolean>>;
    errorMessage: ReturnType<typeof signal<string | null>>;
  };
  let router: Router;

  beforeEach(async () => {
    mockAuthService = {
      registerWithEmail: vi.fn(),
      isLoading: signal(false),
      errorMessage: signal<string | null>(null),
    };

    await TestBed.configureTestingModule({
      imports: [CreateAccountComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: mockAuthService }],
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(CreateAccountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // covers: docs/specs/auth/01-firebase-authentication.md#AC-3
  it('should call registerWithEmail and navigate to verify-email on valid registration', async () => {
    mockAuthService.registerWithEmail.mockResolvedValueOnce(undefined);

    component.registerForm.setValue({
      email: 'newuser@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    });

    await component.onSubmit();

    expect(mockAuthService.registerWithEmail).toHaveBeenCalledWith({
      email: 'newuser@example.com',
      password: 'password123',
    });
    expect(router.navigate).toHaveBeenCalledWith(['/auth/verify-email'], {
      queryParams: { email: 'newuser@example.com' },
    });
  });

  it('should fail validation if passwords do not match', () => {
    component.registerForm.setValue({
      email: 'newuser@example.com',
      password: 'password123',
      confirmPassword: 'differentpassword',
    });

    expect(component.registerForm.valid).toBe(false);
    expect(component.registerForm.hasError('passwordMismatch')).toBe(true);
  });
});
