import { Component, inject, OnInit, signal } from '@angular/core';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
  RouterModule,
} from '@angular/router';
import { SplashComponent } from './splash/splash.component';

type ThemeMode = 'light' | 'dark';

@Component({
  imports: [RouterModule, SplashComponent],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  private readonly router = inject(Router, { optional: true });
  protected readonly isInitialLoading = signal<boolean>(false);
  private initialDataLoaded = false;
  protected currentTheme = signal<ThemeMode>('light');

  constructor() {
    this.router?.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        const isAuthRoute = event.url.startsWith('/auth');
        if (isAuthRoute) {
          // If navigating to /auth (e.g. logout), reset the initialDataLoaded flag
          this.initialDataLoaded = false;
          this.isInitialLoading.set(false);
        } else if (!this.initialDataLoaded) {
          // First entry / post-login data loading: show the landing splash screen
          this.isInitialLoading.set(true);
        }
      } else if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        if (event instanceof NavigationEnd) {
          const isAuthRoute = event.urlAfterRedirects.startsWith('/auth');
          if (!isAuthRoute) {
            this.initialDataLoaded = true;
          }
        }
        this.isInitialLoading.set(false);
      }
    });
  }

  ngOnInit(): void {
    const preferredTheme = this.getInitialTheme();
    this.setTheme(preferredTheme);
  }

  protected toggleTheme(): void {
    const nextTheme: ThemeMode = this.currentTheme() === 'light' ? 'dark' : 'light';
    this.setTheme(nextTheme);
  }

  private getInitialTheme(): ThemeMode {
    if (typeof window === 'undefined') {
      return 'light';
    }

    const storedTheme = window.localStorage.getItem('app-theme');
    if (storedTheme === 'light' || storedTheme === 'dark') {
      return storedTheme;
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  private setTheme(theme: ThemeMode): void {
    if (typeof document !== 'undefined') {
      const html = document.documentElement;
      html.classList.remove('light-theme', 'dark-theme');
      html.classList.add(`${theme}-theme`);
    }

    if (typeof window !== 'undefined') {
      window.localStorage.setItem('app-theme', theme);
    }

    this.currentTheme.set(theme);
  }
}
