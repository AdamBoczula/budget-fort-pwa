// spec: docs/specs/auth/01-firebase-authentication.md

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAnonymous: boolean;
  emailVerified: boolean;
  providerId: string;
}

export type AuthMode = 'authenticated' | 'guest' | 'unauthenticated' | 'loading';

export interface AuthStateModel {
  mode: AuthMode;
  user: AuthUser | null;
  error: string | null;
  loading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
}
