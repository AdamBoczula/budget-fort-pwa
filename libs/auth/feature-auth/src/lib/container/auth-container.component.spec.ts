// spec: docs/specs/auth/01-firebase-authentication.md

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthContainerComponent } from './auth-container.component';
import { describe, expect, it } from 'vitest';

describe('AuthContainerComponent', () => {
  let fixture: ComponentFixture<AuthContainerComponent>;
  let component: AuthContainerComponent;

  it('should render title and subtitle centered', async () => {
    await TestBed.configureTestingModule({
      imports: [AuthContainerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AuthContainerComponent);
    fixture.componentRef.setInput('title', 'Budget Fort');
    fixture.componentRef.setInput('subtitle', 'Zaloguj się, aby kontynuować');
    fixture.detectChanges();

    const titleEl = fixture.nativeElement.querySelector('.bf-auth-container__logo-title');
    const subtitleEl = fixture.nativeElement.querySelector('.bf-auth-container__subtitle');

    expect(titleEl?.textContent?.trim()).toBe('Budget Fort');
    expect(subtitleEl?.textContent?.trim()).toBe('Zaloguj się, aby kontynuować');
  });

  it('should display error message when provided', async () => {
    await TestBed.configureTestingModule({
      imports: [AuthContainerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AuthContainerComponent);
    fixture.componentRef.setInput('errorMessage', 'Nieprawidłowe dane logowania.');
    fixture.detectChanges();

    const errorEl = fixture.nativeElement.querySelector('.bf-auth-container__error-alert');
    expect(errorEl?.textContent).toContain('Nieprawidłowe dane logowania.');
  });
});
