// spec: docs/specs/sync/01-firestore-sync.md

import { DestroyRef, inject, Injectable, signal, Signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class NetworkStatusService {
  private readonly _isOnline = signal<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  );

  readonly isOnline: Signal<boolean> = this._isOnline.asReadonly();

  constructor() {
    if (typeof window !== 'undefined') {
      const handleOnline = (): void => this._isOnline.set(true);
      const handleOffline = (): void => this._isOnline.set(false);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      const destroyRef = inject(DestroyRef, { optional: true });
      destroyRef?.onDestroy(() => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      });
    }
  }

  /** Metoda pomocnicza do manualnego testowania lub wymuszenia stanu w testach */
  setOnline(status: boolean): void {
    this._isOnline.set(status);
  }
}
