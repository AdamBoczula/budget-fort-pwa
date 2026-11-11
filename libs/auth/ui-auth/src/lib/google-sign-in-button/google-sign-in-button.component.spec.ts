// spec: docs/specs/auth/01-firebase-authentication.md

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GoogleSignInButtonComponent } from './google-sign-in-button.component';
import { describe, beforeEach, it, expect, vi } from 'vitest';

describe('GoogleSignInButtonComponent', () => {
  let fixture: ComponentFixture<GoogleSignInButtonComponent>;
  let component: GoogleSignInButtonComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GoogleSignInButtonComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GoogleSignInButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // covers: docs/specs/auth/01-firebase-authentication.md#AC-4
  it('should render google sign-in button and emit clicked event on click', () => {
    const clickSpy = vi.fn();
    component.clicked.subscribe(clickSpy);

    const button = fixture.nativeElement.querySelector('button');
    expect(button).toBeTruthy();
    expect(button.textContent).toContain('Zaloguj przez Google');

    button.click();
    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled input is true', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('button');
    expect(button.disabled).toBe(true);
  });

  it('should show spinner when loading is true', () => {
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();

    const spinner = fixture.nativeElement.querySelector('mat-spinner');
    expect(spinner).toBeTruthy();
    const button = fixture.nativeElement.querySelector('button');
    expect(button.disabled).toBe(true);
  });
});
