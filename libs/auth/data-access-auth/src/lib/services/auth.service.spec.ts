// spec: docs/specs/auth/01-firebase-authentication.md

import { TestBed } from '@angular/core/testing';
import { AuthService, FIREBASE_AUTH, GUEST_MODE_STORAGE_KEY } from './auth.service';
import { AuthState } from '../state/auth.state';
import * as firebaseAuth from 'firebase/auth';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('firebase/auth', async () => {
  const actual = await vi.importActual<typeof import('firebase/auth')>('firebase/auth');
  return {
    ...actual,
    signInWithEmailAndPassword: vi.fn(),
    createUserWithEmailAndPassword: vi.fn(),
    sendEmailVerification: vi.fn(),
    signInWithPopup: vi.fn(),
    signOut: vi.fn(),
    onAuthStateChanged: vi.fn((_auth, callback) => {
      // Domyślnie brak zalogowanego użytkownika
      callback(null);
      return () => undefined;
    }),
  };
});

describe('AuthService', () => {
  let service: AuthService;
  const mockAuth = {} as firebaseAuth.Auth;

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();

    TestBed.configureTestingModule({
      providers: [AuthState, AuthService, { provide: FIREBASE_AUTH, useValue: mockAuth }],
    });

    service = TestBed.inject(AuthService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  // covers: docs/specs/auth/01-firebase-authentication.md#AC-5
  it('should continue as guest and update localStorage and state', () => {
    service.continueAsGuest();

    expect(localStorage.getItem(GUEST_MODE_STORAGE_KEY)).toBe('true');
    expect(service.isGuest()).toBe(true);
    expect(service.isAuthenticated()).toBe(false);
    expect(service.isAuthorized()).toBe(true);
    expect(service.currentUser()?.displayName).toBe('Gość');
  });

  // covers: docs/specs/auth/01-firebase-authentication.md#AC-1
  it('should authenticate user on successful email login with verified email', async () => {
    const mockUser = {
      uid: 'user-123',
      email: 'test@example.com',
      displayName: 'Jan Kowalski',
      photoURL: null,
      isAnonymous: false,
      emailVerified: true,
      providerData: [{ providerId: 'password' }],
    };

    vi.mocked(firebaseAuth.signInWithEmailAndPassword).mockResolvedValueOnce({
      user: mockUser as any,
    } as any);

    await service.loginWithEmail({ email: 'test@example.com', password: 'password123' });

    expect(service.isAuthenticated()).toBe(true);
    expect(service.isGuest()).toBe(false);
    expect(service.currentUser()?.uid).toBe('user-123');
    expect(service.currentUser()?.email).toBe('test@example.com');
  });

  // covers: docs/specs/auth/01-firebase-authentication.md#AC-2
  it('should reject email login and sign out if email is not verified', async () => {
    const mockUser = {
      uid: 'unverified-123',
      email: 'unverified@example.com',
      displayName: null,
      photoURL: null,
      isAnonymous: false,
      emailVerified: false,
      providerData: [{ providerId: 'password' }],
    };

    vi.mocked(firebaseAuth.signInWithEmailAndPassword).mockResolvedValueOnce({
      user: mockUser as any,
    } as any);

    await expect(
      service.loginWithEmail({ email: 'unverified@example.com', password: 'password123' }),
    ).rejects.toThrow('Adres email nie został potwierdzony');

    expect(firebaseAuth.signOut).toHaveBeenCalled();
    expect(service.isAuthenticated()).toBe(false);
  });

  // covers: docs/specs/auth/01-firebase-authentication.md#AC-3
  it('should register with email and send verification email', async () => {
    const mockUser = {
      uid: 'new-user',
      email: 'new@example.com',
    };

    vi.mocked(firebaseAuth.createUserWithEmailAndPassword).mockResolvedValueOnce({
      user: mockUser as any,
    } as any);

    await service.registerWithEmail({ email: 'new@example.com', password: 'password123' });

    expect(firebaseAuth.createUserWithEmailAndPassword).toHaveBeenCalledWith(
      mockAuth,
      'new@example.com',
      'password123',
    );
    expect(firebaseAuth.sendEmailVerification).toHaveBeenCalledWith(mockUser);
    expect(firebaseAuth.signOut).toHaveBeenCalled();
  });

  // covers: docs/specs/auth/01-firebase-authentication.md#AC-4
  it('should authenticate user via Google sign in popup', async () => {
    const mockUser = {
      uid: 'google-user-123',
      email: 'google@gmail.com',
      displayName: 'Google User',
      photoURL: 'https://example.com/avatar.jpg',
      isAnonymous: false,
      emailVerified: true,
      providerData: [{ providerId: 'google.com' }],
    };

    vi.mocked(firebaseAuth.signInWithPopup).mockResolvedValueOnce({
      user: mockUser as any,
    } as any);

    await service.loginWithGoogle();

    expect(service.isAuthenticated()).toBe(true);
    expect(service.currentUser()?.uid).toBe('google-user-123');
    expect(service.currentUser()?.providerId).toBe('google.com');
  });

  // covers: docs/specs/auth/01-firebase-authentication.md#AC-8
  it('should logout and clear session and guest flag', async () => {
    service.continueAsGuest();
    expect(service.isGuest()).toBe(true);

    await service.logout();

    expect(localStorage.getItem(GUEST_MODE_STORAGE_KEY)).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
    expect(service.isGuest()).toBe(false);
    expect(service.isAuthorized()).toBe(false);
  });
});
