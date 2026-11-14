// spec: docs/specs/settings/data-export-import.md

import { Injector, runInInjectionContext } from '@angular/core';
import { describe, expect, it } from 'vitest';
import { AppLanguageService, APP_CUSTOM_LOCALE } from './app-language.service';

describe('AppLanguageService', () => {
  // covers: docs/specs/settings/data-export-import.md#AC-2
  it('should detect Polish locale correctly', () => {
    const injector = Injector.create({
      providers: [{ provide: APP_CUSTOM_LOCALE, useValue: 'pl-PL' }],
    });

    const service = runInInjectionContext(injector, () => new AppLanguageService());

    expect(service.localeId()).toBe('pl-PL');
    expect(service.isPolish()).toBe(true);
    expect(service.isEnglish()).toBe(false);
    expect(service.languageCode()).toBe('pl');
  });

  // covers: docs/specs/settings/data-export-import.md#AC-2
  it('should detect English locale correctly', () => {
    const injector = Injector.create({
      providers: [{ provide: APP_CUSTOM_LOCALE, useValue: 'en-US' }],
    });

    const service = runInInjectionContext(injector, () => new AppLanguageService());

    expect(service.localeId()).toBe('en-US');
    expect(service.isPolish()).toBe(false);
    expect(service.isEnglish()).toBe(true);
    expect(service.languageCode()).toBe('en');
  });

  it('should fallback to en when no custom locale provided', () => {
    const injector = Injector.create({
      providers: [],
    });

    const service = runInInjectionContext(injector, () => new AppLanguageService());

    expect(service.localeId()).toBe('en');
    expect(service.isPolish()).toBe(false);
    expect(service.isEnglish()).toBe(true);
    expect(service.languageCode()).toBe('en');
  });
});
