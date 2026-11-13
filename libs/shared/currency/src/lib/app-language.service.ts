// spec: docs/specs/settings/data-export-import.md

import { computed, inject, Injectable, InjectionToken, LOCALE_ID, Signal } from '@angular/core';

export const APP_CUSTOM_LOCALE = new InjectionToken<string>('APP_CUSTOM_LOCALE');

/**
 * Global application language / locale helper service.
 * Exposes current locale information and language helper flags.
 */
@Injectable({ providedIn: 'root' })
export class AppLanguageService {
  private readonly _localeId: string;

  constructor(customLocale?: string) {
    if (customLocale) {
      this._localeId = customLocale;
    } else {
      const injectedCustom = inject(APP_CUSTOM_LOCALE, { optional: true });
      const injectedLocaleId = inject(LOCALE_ID, { optional: true });
      this._localeId = injectedCustom ?? injectedLocaleId ?? 'en';
    }
  }

  public get localeId(): string {
    return this._localeId;
  }

  /**
   * Whether the active application locale is Polish.
   */
  public readonly isPolish: Signal<boolean> = computed(() =>
    this.localeId.toLowerCase().startsWith('pl'),
  );

  /**
   * Whether the active application locale is English.
   */
  public readonly isEnglish: Signal<boolean> = computed(() =>
    this.localeId.toLowerCase().startsWith('en'),
  );

  /**
   * Active ISO language code (e.g., 'pl', 'en').
   */
  public readonly languageCode: Signal<string> = computed(
    () => this.localeId.toLowerCase().split('-')[0],
  );
}
