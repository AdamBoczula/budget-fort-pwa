// spec: (Firebase SDK integration for deployment & backend services)

import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAnalytics, type Analytics } from 'firebase/analytics';
import { getAuth, type Auth } from 'firebase/auth';
import { environment } from '../environments/environment';

let _app: FirebaseApp | undefined;
let _analytics: Analytics | undefined;
let _auth: Auth | undefined;

/** Lazy-initialize Firebase. Wywołaj przed użyciem jakiejkolwiek usługi Firebase. */
export function firebaseApp(): FirebaseApp {
  if (!_app) {
    _app = initializeApp(environment.firebase);
  }
  return _app;
}

/** Analytics — inicjalizowane leniwie, tylko po stronie przeglądarki. */
export function firebaseAnalytics(): Analytics | undefined {
  if (typeof window === 'undefined') {
    return undefined; // SSR-safe
  }
  if (!_analytics) {
    _analytics = getAnalytics(firebaseApp());
  }
  return _analytics;
}

/** Firebase Auth — inicjalizowane leniwie. */
export function firebaseAuth(): Auth {
  if (!_auth) {
    _auth = getAuth(firebaseApp());
  }
  return _auth;
}
