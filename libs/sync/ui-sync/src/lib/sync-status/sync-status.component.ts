// spec: docs/specs/sync/01-firestore-sync.md

import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SyncEngineService, SyncState } from '@data-access-sync';

@Component({
  selector: 'sync-status',
  imports: [CommonModule, MatIconModule, MatTooltipModule],
  template: `
    <div class="bf-sync-status" role="status" aria-live="polite">
      <button
        type="button"
        class="bf-sync-status__button"
        [matTooltip]="tooltipText()"
        [attr.aria-label]="tooltipText()"
        [disabled]="isButtonDisabled()"
        (click)="onTriggerSync()"
      >
        <mat-icon
          class="bf-sync-status__icon"
          [ngClass]="'bf-sync-status__icon--' + iconModifier()"
        >
          {{ iconName() }}
        </mat-icon>

        @if (pendingCount() > 0 && !isSyncing()) {
          <span class="bf-sync-status__badge" aria-hidden="true">
            {{ pendingCount() > 99 ? '99+' : pendingCount() }}
          </span>
        }
      </button>
    </div>
  `,
  styleUrl: './sync-status.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SyncStatusComponent {
  private readonly syncState = inject(SyncState);
  private readonly syncEngine = inject(SyncEngineService);

  readonly status = this.syncState.status;
  readonly isSyncing = this.syncState.isSyncing;
  readonly isOffline = this.syncState.isOffline;
  readonly isError = this.syncState.isError;
  readonly isGuest = this.syncState.isGuest;
  readonly pendingCount = this.syncState.pendingCount;

  readonly isButtonDisabled = computed(() => {
    return this.isSyncing() || this.isOffline() || this.isGuest();
  });

  readonly iconName = computed(() => {
    switch (this.status()) {
      case 'syncing':
        return 'sync';
      case 'offline':
        return 'cloud_off';
      case 'error':
        return 'sync_problem';
      case 'guest':
        return 'person_outline';
      case 'idle':
      default:
        return 'cloud_done';
    }
  });

  readonly iconModifier = computed(() => {
    switch (this.status()) {
      case 'syncing':
        return 'syncing';
      case 'offline':
        return 'offline';
      case 'error':
        return 'error';
      case 'guest':
        return 'guest';
      case 'idle':
      default:
        return 'synced';
    }
  });

  readonly tooltipText = computed(() => {
    const pending = this.pendingCount();

    switch (this.status()) {
      case 'syncing':
        return 'Trwa synchronizacja danych z chmurą...';
      case 'offline':
        return pending > 0
          ? `Tryb offline. Oczekujące operacje: ${pending}.`
          : 'Jesteś offline. Dane są zapisywane lokalnie.';
      case 'error':
        return 'Błąd synchronizacji. Kliknij, aby ponowić próbę.';
      case 'guest':
        return 'Tryb gościa. Dane są bezpiecznie zapisywane wyłącznie na tym urządzeniu.';
      case 'idle':
      default:
        return pending > 0
          ? `Zapisano lokalnie. Oczekujące: ${pending}. Kliknij, aby zsynchronizować.`
          : 'Wszystkie dane są zsynchronizowane z chmurą.';
    }
  });

  onTriggerSync(): void {
    if (!this.isButtonDisabled()) {
      this.syncEngine.syncNow().catch((err) => {
        console.error('[SyncStatusComponent] Manual sync failed:', err);
      });
    }
  }
}
