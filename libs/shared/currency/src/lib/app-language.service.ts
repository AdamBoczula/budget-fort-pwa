// spec: docs/specs/settings/data-export-import.md

import { computed, inject, Injectable, LOCALE_ID, Signal } from '@angular/core';

/**
 * Global application language / locale helper service.
 * Exposes current locale information and language helper flags.
 */
@Injectable({ providedIn: 'root' })
export class AppLanguageService {
  private readonly localeId = inject(LOCALE_ID, { optional: true }) ?? 'en';

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
