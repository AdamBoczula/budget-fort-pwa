// spec: docs/specs/settings/data-export-import.md

import { describe, expect, it } from 'vitest';
import { AppLanguageService } from './app-language.service';

describe('AppLanguageService', () => {
  // covers: docs/specs/settings/data-export-import.md#AC-2
  it('should detect Polish locale correctly', () => {
    const service = new AppLanguageService('pl-PL');
    expect(service.isPolish()).toBe(true);
    expect(service.isEnglish()).toBe(false);
    expect(service.languageCode()).toBe('pl');
  });

  // covers: docs/specs/settings/data-export-import.md#AC-2
  it('should detect English locale correctly', () => {
    const service = new AppLanguageService('en-US');
    expect(service.isPolish()).toBe(false);
    expect(service.isEnglish()).toBe(true);
    expect(service.languageCode()).toBe('en');
  });
});
