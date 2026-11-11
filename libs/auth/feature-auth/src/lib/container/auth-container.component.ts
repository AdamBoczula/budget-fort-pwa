// spec: docs/specs/auth/01-firebase-authentication.md

import { Component, computed, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'auth-container',
  imports: [MatCardModule, MatIconModule, MatProgressBarModule],
  template: `
    <div
      class="bf-auth-container bf-auth-page"
      [class.bf-auth-container--has-bg]="hasBackgroundImage()"
    >
      <mat-card class="bf-auth-container__card bf-auth-page__card">
        <div class="bf-auth-container__header bf-auth-page__header">
          @if (logoImage()) {
            <div class="bf-auth-container__logo-img-box">
              <img
                [src]="logoImage()"
                alt="Budget Fort"
                class="bf-auth-container__logo-img"
                width="72"
                height="72"
              />
            </div>
          }

          <div class="bf-auth-container__logo bf-auth-page__logo">
            @if (icon()) {
              <mat-icon class="bf-auth-container__logo-icon" color="primary">{{ icon() }}</mat-icon>
            }
            <span class="bf-auth-container__logo-title">{{ title() }}</span>
          </div>

          @if (subtitle()) {
            <p class="bf-auth-container__subtitle bf-auth-page__subtitle">{{ subtitle() }}</p>
          }
        </div>

        <mat-card-content class="bf-auth-container__content">
          @if (loading()) {
            <mat-progress-bar
              mode="indeterminate"
              class="bf-auth-container__progress"
            ></mat-progress-bar>
          }

          @if (errorMessage()) {
            <div class="bf-auth-container__error-alert" role="alert">
              <mat-icon class="bf-auth-container__error-icon">error_outline</mat-icon>
              <span>{{ errorMessage() }}</span>
            </div>
          }

          <ng-content></ng-content>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styleUrl: './auth-container.component.scss',
})
export class AuthContainerComponent {
  readonly title = input<string>('Budget Fort');
  readonly subtitle = input<string>('');
  readonly icon = input<string | null>(null);
  readonly logoImage = input<string | null>(null);
  readonly backgroundImage = input<string | null>('/images/login-screen-logo.png');
  readonly loading = input<boolean>(false);
  readonly errorMessage = input<string | null>(null);

  protected readonly hasBackgroundImage = computed(() => Boolean(this.backgroundImage()));
}
