// spec: docs/specs/auth/01-firebase-authentication.md

import { inject, Injectable, InjectionToken } from '@angular/core';
import { getApps, initializeApp, getApp } from 'firebase/app';
import {
  Auth,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  User,
  getAuth,
} from 'firebase/auth';
import { AuthState } from '../state/auth.state';
import { AuthUser, LoginCredentials, RegisterCredentials } from '../types/auth.types';

export const FIREBASE_AUTH = new InjectionToken<Auth>('FIREBASE_AUTH', {
  providedIn: 'root',
  factory: () => {
    if (typeof window === 'undefined') {
      return undefined as unknown as Auth;
    }
    const apps = getApps();
    const app =
      apps.length > 0
        ? getApp()
        : initializeApp({
            apiKey: 'AIzaSyCf4ha6NwoZsba0XZqaiycvRmNCDRdv0OE',
            authDomain: 'budget-fort-pwa.firebaseapp.com',
            projectId: 'budget-fort-pwa',
            storageBucket: 'budget-fort-pwa.firebasestorage.app',
            messagingSenderId: '490159735458',
            appId: '1:490159735458:web:51eb5955831739c8974dfb',
            measurementId: 'G-JK30Z36SB3',
          });
    return getAuth(app);
  },
});

export const GUEST_MODE_STORAGE_KEY = 'bf_guest_mode';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly auth = inject(FIREBASE_AUTH, { optional: true });
  private readonly authState = inject(AuthState);

  private _authReadyResolve!: () => void;
  private readonly _authReadyPromise = new Promise<void>((resolve) => {
    this._authReadyResolve = resolve;
  });

  constructor() {
    this.initAuth();
  }

  readonly state = this.authState.state;
  readonly mode = this.authState.mode;
  readonly isAuthenticated = this.authState.isAuthenticated;
  readonly isGuest = this.authState.isGuest;
  readonly isAuthorized = this.authState.isAuthorized;
  readonly currentUser = this.authState.currentUser;
  readonly isLoading = this.authState.isLoading;
  readonly errorMessage = this.authState.errorMessage;

  waitForAuthReady(): Promise<void> {
    if (!this.authState.isLoading()) {
      return Promise.resolve();
    }
    return this._authReadyPromise;
  }

  private initAuth(): void {
    if (typeof window !== 'undefined') {
      const isGuest = localStorage.getItem(GUEST_MODE_STORAGE_KEY) === 'true';
      if (isGuest) {
        this.authState.setGuest();
        this._authReadyResolve();
        return;
      }
    }

    if (!this.auth) {
      // Jeśli brak instancji Firebase Auth (np. w środowisku testowym bez providera)
      this.authState.setUnauthenticated();
      this._authReadyResolve();
      return;
    }

    onAuthStateChanged(
      this.auth,
      (user: User | null) => {
        if (user) {
          const isGoogleUser = user.providerData.some((p) => p.providerId === 'google.com');
          // Konto Google lub zweryfikowany email
          if (user.emailVerified || isGoogleUser) {
            this.authState.setAuthenticated(this.mapFirebaseUser(user));
          } else {
            // Email nie został jeszcze potwierdzony
            this.authState.setUnauthenticated('Wymagana weryfikacja adresu email.');
          }
        } else {
          // Sprawdź czy użytkownik nie wybrał w międzyczasie trybu gościa
          const isGuest =
            typeof window !== 'undefined' &&
            localStorage.getItem(GUEST_MODE_STORAGE_KEY) === 'true';
          if (isGuest) {
            this.authState.setGuest();
          } else {
            this.authState.setUnauthenticated();
          }
        }
        this._authReadyResolve();
      },
      (error) => {
        this.authState.setError(error.message);
        this._authReadyResolve();
      },
    );
  }

  async loginWithEmail(credentials: LoginCredentials): Promise<void> {
    if (!this.auth) {
      throw new Error('Firebase Auth is not available');
    }
    this.authState.setLoading(true);
    this.authState.clearError();

    try {
      const userCredential = await signInWithEmailAndPassword(
        this.auth,
        credentials.email,
        credentials.password,
      );

      const isGoogle = userCredential.user.providerData.some((p) => p.providerId === 'google.com');
      if (!userCredential.user.emailVerified && !isGoogle) {
        await signOut(this.auth);
        const errorMsg = 'Adres email nie został potwierdzony. Sprawdź swoją skrzynkę pocztową.';
        this.authState.setUnauthenticated(errorMsg);
        throw new Error(errorMsg);
      }

      this.clearGuestFlag();
      this.authState.setAuthenticated(this.mapFirebaseUser(userCredential.user));
    } catch (error: unknown) {
      const err = error as { code?: string; message?: string };
      const msg = this.translateFirebaseError(err.code || err.message || '');
      this.authState.setError(msg);
      throw new Error(msg);
    }
  }

  async registerWithEmail(credentials: RegisterCredentials): Promise<void> {
    if (!this.auth) {
      throw new Error('Firebase Auth is not available');
    }
    this.authState.setLoading(true);
    this.authState.clearError();

    try {
      const userCredential = await createUserWithEmailAndPassword(
        this.auth,
        credentials.email,
        credentials.password,
      );

      // Wyślij link weryfikacyjny natychmiast po rejestracji
      await sendEmailVerification(userCredential.user);

      // Wyloguj tymczasową sesję do czasu potwierdzenia maila
      await signOut(this.auth);
      this.clearGuestFlag();
      this.authState.setUnauthenticated();
    } catch (error: unknown) {
      const err = error as { code?: string; message?: string };
      const msg = this.translateFirebaseError(err.code || err.message || '');
      this.authState.setError(msg);
      throw new Error(msg);
    }
  }

  async loginWithGoogle(): Promise<void> {
    if (!this.auth) {
      throw new Error('Firebase Auth is not available');
    }
    this.authState.setLoading(true);
    this.authState.clearError();

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const userCredential = await signInWithPopup(this.auth, provider);

      this.clearGuestFlag();
      this.authState.setAuthenticated(this.mapFirebaseUser(userCredential.user));
    } catch (error: unknown) {
      const err = error as { code?: string; message?: string };
      if (err.code === 'auth/popup-closed-by-user') {
        this.authState.setLoading(false);
        return;
      }
      const msg = this.translateFirebaseError(err.code || err.message || '');
      this.authState.setError(msg);
      throw new Error(msg);
    }
  }

  continueAsGuest(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(GUEST_MODE_STORAGE_KEY, 'true');
    }
    this.authState.setGuest();
  }

  async logout(): Promise<void> {
    this.authState.setLoading(true);
    this.clearGuestFlag();
    if (this.auth) {
      try {
        await signOut(this.auth);
      } catch {
        // Ignoruj ewentualne błędy wylogowania Firebase
      }
    }
    this.authState.setUnauthenticated();
  }

  private clearGuestFlag(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(GUEST_MODE_STORAGE_KEY);
    }
  }

  private mapFirebaseUser(user: User): AuthUser {
    const isGoogle = user.providerData.some((p) => p.providerId === 'google.com');
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      isAnonymous: user.isAnonymous,
      emailVerified: user.emailVerified || isGoogle,
      providerId: isGoogle ? 'google.com' : 'password',
    };
  }

  private translateFirebaseError(code: string): string {
    switch (code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'Nieprawidłowy adres email lub hasło.';
      case 'auth/email-already-in-use':
        return 'Konto z tym adresem email już istnieje. Zaloguj się.';
      case 'auth/invalid-email':
        return 'Nieprawidłowy format adresu email.';
      case 'auth/weak-password':
        return 'Hasło jest zbyt słabe (wymagane min. 6 znaków).';
      case 'auth/network-request-failed':
        return 'Błąd połączenia z siecią. Sprawdź internet lub użyj trybu lokalnego.';
      case 'auth/too-many-requests':
        return 'Zbyt wiele prób logowania. Spróbuj ponownie później.';
      default:
        return code || 'Wystąpił błąd autoryzacji.';
    }
  }
}
