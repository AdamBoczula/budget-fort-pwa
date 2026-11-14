// spec: docs/specs/settings/data-export-import.md

import {
  computed,
  inject,
  Injectable,
  InjectionToken,
  LOCALE_ID,
  signal,
  Signal,
} from '@angular/core';

export const APP_CUSTOM_LOCALE = new InjectionToken<string>('APP_CUSTOM_LOCALE');

/**
 * Global application language / locale helper service.
 * Exposes current locale information and language helper flags using Signal API.
 */
@Injectable({ providedIn: 'root' })
export class AppLanguageService {
  private readonly _customLocale = inject(APP_CUSTOM_LOCALE, { optional: true });
  private readonly _defaultLocale = inject(LOCALE_ID, { optional: true });

  /**
   * Signal holding the active application locale (e.g., 'pl-PL', 'en-US').
   */
  public readonly localeId: Signal<string> = signal<string>(
    this._customLocale ?? this._defaultLocale ?? 'en',
  );

  /**
   * Whether the active application locale is Polish.
   */
  public readonly isPolish: Signal<boolean> = computed(() =>
    this.localeId().toLowerCase().startsWith('pl'),
  );

  /**
   * Whether the active application locale is English.
   */
  public readonly isEnglish: Signal<boolean> = computed(() =>
    this.localeId().toLowerCase().startsWith('en'),
  );

  /**
   * Active ISO language code (e.g., 'pl', 'en').
   */
  public readonly languageCode: Signal<string> = computed(
    () => this.localeId().toLowerCase().split('-')[0],
  );
}
