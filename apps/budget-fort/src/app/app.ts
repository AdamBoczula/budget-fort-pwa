import { Component, OnInit, signal } from '@angular/core';
import { RouterModule } from '@angular/router';

type ThemeMode = 'light' | 'dark';

@Component({
  imports: [RouterModule],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  protected currentTheme = signal<ThemeMode>('light');

  ngOnInit(): void {
    const preferredTheme = this.getInitialTheme();
    this.setTheme(preferredTheme);
  }

  protected toggleTheme(): void {
    const nextTheme: ThemeMode =
      this.currentTheme() === 'light' ? 'dark' : 'light';
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

    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
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
