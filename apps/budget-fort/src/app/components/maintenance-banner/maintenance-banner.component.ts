// spec: docs/specs/pwa/01-app-update-and-maintenance-banner.md
// uc: UC-3

import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { AnnouncementService } from '../../services/announcement.service';

@Component({
  selector: 'app-maintenance-banner',
  imports: [CommonModule, MatIconModule],
  template: `
    @if (announcement(); as item) {
      <aside
        class="maintenance-banner maintenance-banner--{{ item.severity }}"
        role="status"
        aria-live="polite"
      >
        <div class="maintenance-banner__content">
          <span class="maintenance-banner__icon">
            <mat-icon>{{ getIcon(item.severity) }}</mat-icon>
          </span>
          <div class="maintenance-banner__text">
            @if (item.title) {
              <strong class="maintenance-banner__title">{{ item.title }}</strong>
            }
            <span class="maintenance-banner__message">{{ item.message }}</span>
          </div>
        </div>

        @if (item.dismissible) {
          <button
            type="button"
            class="maintenance-banner__close"
            (click)="dismiss()"
            aria-label="Zamknij powiadomienie"
            i18n-aria-label="@@maintenance.banner.close"
          >
            <mat-icon>close</mat-icon>
          </button>
        }
      </aside>
    }
  `,
  styleUrl: './maintenance-banner.component.scss',
})
export class MaintenanceBannerComponent implements OnInit {
  private readonly announcementService = inject(AnnouncementService);
  protected readonly announcement = this.announcementService.activeAnnouncement;

  ngOnInit(): void {
    this.announcementService.init();
  }

  protected dismiss(): void {
    this.announcementService.dismissCurrent();
  }

  protected getIcon(severity: string): string {
    switch (severity) {
      case 'critical':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
      default:
        return 'info';
    }
  }
}
