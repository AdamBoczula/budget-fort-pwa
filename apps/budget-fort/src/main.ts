import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { firebaseApp, firebaseAnalytics } from './app/firebase';

// Inicjalizacja Firebase — przed bootstrapem aplikacji
firebaseApp();
firebaseAnalytics();

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
