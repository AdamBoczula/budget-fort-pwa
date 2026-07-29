import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LocalStorageService {
  public getItem(key: string): string | null {
    if (!this.isLocalStorageAvailable()) {
      return null;
    }

    try {
      return globalThis.localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  public setItem(key: string, value: string): void {
    if (!this.isLocalStorageAvailable()) {
      return;
    }

    try {
      globalThis.localStorage.setItem(key, value);
    } catch {
      // Ignore write failures such as private mode quota errors.
    }
  }

  private isLocalStorageAvailable(): boolean {
    return typeof globalThis.localStorage !== 'undefined';
  }
}
