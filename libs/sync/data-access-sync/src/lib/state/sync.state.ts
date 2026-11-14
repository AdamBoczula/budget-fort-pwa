// spec: docs/specs/sync/01-firestore-sync.md
// spec: docs/specs/sync/02-multi-user-household.md

import { computed, Injectable, signal, Signal } from '@angular/core';
import { Household, SyncStateModel, SyncStatus } from '../types/sync.types';

@Injectable({ providedIn: 'root' })
export class SyncState {
  private readonly _status = signal<SyncStatus>('idle');
  private readonly _lastSyncedAt = signal<string | null>(null);
  private readonly _pendingCount = signal<number>(0);
  private readonly _errorMessage = signal<string | null>(null);
  private readonly _currentHousehold = signal<Household | null>(null);

  readonly status: Signal<SyncStatus> = this._status.asReadonly();
  readonly lastSyncedAt: Signal<string | null> = this._lastSyncedAt.asReadonly();
  readonly pendingCount: Signal<number> = this._pendingCount.asReadonly();
  readonly errorMessage: Signal<string | null> = this._errorMessage.asReadonly();
  readonly currentHousehold: Signal<Household | null> = this._currentHousehold.asReadonly();

  readonly householdId: Signal<string> = computed(() => this._currentHousehold()?.id ?? 'local');

  readonly isSyncing: Signal<boolean> = computed(() => this._status() === 'syncing');
  readonly isOffline: Signal<boolean> = computed(() => this._status() === 'offline');
  readonly isError: Signal<boolean> = computed(() => this._status() === 'error');
  readonly isGuest: Signal<boolean> = computed(() => this._status() === 'guest');

  readonly state: Signal<SyncStateModel> = computed(() => ({
    status: this._status(),
    lastSyncedAt: this._lastSyncedAt(),
    pendingCount: this._pendingCount(),
    errorMessage: this._errorMessage(),
    currentHousehold: this._currentHousehold(),
  }));

  setIdle(): void {
    this._status.set('idle');
    this._errorMessage.set(null);
  }

  setSyncing(): void {
    this._status.set('syncing');
    this._errorMessage.set(null);
  }

  setOffline(): void {
    this._status.set('offline');
  }

  setError(message: string): void {
    this._status.set('error');
    this._errorMessage.set(message);
  }

  setGuest(): void {
    this._status.set('guest');
    this._errorMessage.set(null);
    this._currentHousehold.set(null);
  }

  setPendingCount(count: number): void {
    this._pendingCount.set(count);
  }

  setLastSyncedAt(timestamp: string): void {
    this._lastSyncedAt.set(timestamp);
  }

  setCurrentHousehold(household: Household | null): void {
    this._currentHousehold.set(household);
  }
}
