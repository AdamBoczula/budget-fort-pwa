// spec: docs/specs/pwa/01-app-update-and-maintenance-banner.md
// uc: UC-1, UC-2

import { inject, Injectable, signal } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { MatSnackBar } from '@angular/material/snack-bar';
import { filter } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PwaUpdateService {
  private readonly swUpdate = inject(SwUpdate);
  private readonly snackBar = inject(MatSnackBar);

  readonly isUpdateAvailable = signal<boolean>(false);

  init(): void {
    if (!this.swUpdate.isEnabled) {
      return;
    }

    this.swUpdate.versionUpdates
      .pipe(filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY'))
      .subscribe(() => {
        this.isUpdateAvailable.set(true);
        this.promptUser();
      });
  }

  async checkForUpdate(): Promise<boolean> {
    if (!this.swUpdate.isEnabled) {
      return false;
    }
    try {
      return await this.swUpdate.checkForUpdate();
    } catch {
      return false;
    }
  }

  async activateUpdate(): Promise<void> {
    if (!this.swUpdate.isEnabled) {
      return;
    }
    await this.swUpdate.activateUpdate();
    this.reloadApp();
  }

  protected reloadApp(): void {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }

  private promptUser(): void {
    const message = $localize`:@@pwa.update.available:Dostępna jest nowa wersja Budget Fort`;
    const action = $localize`:@@pwa.update.action:Zaktualizuj`;

    const ref = this.snackBar.open(message, action, {
      duration: 0, // nie znika automatycznie
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });

    ref.onAction().subscribe(() => {
      void this.activateUpdate();
    });
  }
}
