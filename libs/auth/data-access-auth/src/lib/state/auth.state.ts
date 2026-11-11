// spec: docs/specs/auth/01-firebase-authentication.md

import { computed, Injectable, signal } from '@angular/core';
import { AuthStateModel, AuthUser } from '../types/auth.types';

const INITIAL_AUTH_STATE: AuthStateModel = {
  mode: 'loading',
  user: null,
  error: null,
  loading: true,
};

@Injectable({ providedIn: 'root' })
export class AuthState {
  private readonly _state = signal<AuthStateModel>(INITIAL_AUTH_STATE);

  readonly state = this._state.asReadonly();
  readonly mode = computed(() => this._state().mode);
  readonly isAuthenticated = computed(() => this._state().mode === 'authenticated');
  readonly isGuest = computed(() => this._state().mode === 'guest');
  readonly isAuthorized = computed(
    () => this._state().mode === 'authenticated' || this._state().mode === 'guest',
  );
  readonly currentUser = computed(() => this._state().user);
  readonly isLoading = computed(() => this._state().loading);
  readonly errorMessage = computed(() => this._state().error);

  setAuthenticated(user: AuthUser): void {
    this._state.set({
      mode: 'authenticated',
      user,
      error: null,
      loading: false,
    });
  }

  setGuest(): void {
    this._state.set({
      mode: 'guest',
      user: {
        uid: 'guest-local-user',
        email: null,
        displayName: 'Gość',
        photoURL: null,
        isAnonymous: true,
        emailVerified: true,
        providerId: 'guest',
      },
      error: null,
      loading: false,
    });
  }

  setUnauthenticated(error: string | null = null): void {
    this._state.set({
      mode: 'unauthenticated',
      user: null,
      error,
      loading: false,
    });
  }

  setLoading(loading: boolean): void {
    this._state.update((s) => ({ ...s, loading }));
  }

  setError(error: string | null): void {
    this._state.update((s) => ({ ...s, error, loading: false }));
  }

  clearError(): void {
    this._state.update((s) => ({ ...s, error: null }));
  }
}
