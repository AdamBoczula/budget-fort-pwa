import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { firebaseApp, firebaseAnalytics } from './app/firebase';

// Inicjalizacja Firebase — przed bootstrapem aplikacji
firebaseApp();
firebaseAnalytics();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => console.error(err));
  });
}

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
