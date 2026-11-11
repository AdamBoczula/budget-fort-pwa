import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SplashComponent } from './splash.component';
import { describe, expect, it } from 'vitest';

describe('SplashComponent', () => {
  let fixture: ComponentFixture<SplashComponent>;
  let component: SplashComponent;

  it('should create and render loading logo and text', async () => {
    await TestBed.configureTestingModule({
      imports: [SplashComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SplashComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component).toBeTruthy();
    const logoEl = fixture.nativeElement.querySelector('.bf-splash-screen__logo');
    const textEl = fixture.nativeElement.querySelector('.bf-splash-screen__text');

    expect(logoEl).toBeTruthy();
    expect(textEl?.textContent).toContain('Wczytywanie danych...');
  });
});
