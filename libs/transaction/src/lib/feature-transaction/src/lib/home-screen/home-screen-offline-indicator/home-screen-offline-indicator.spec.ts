import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { HomeScreenOfflineIndicatorComponent } from './home-screen-offline-indicator';

describe('HomeScreenOfflineIndicatorComponent', () => {
  let fixture: ComponentFixture<HomeScreenOfflineIndicatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeScreenOfflineIndicatorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeScreenOfflineIndicatorComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render info text when error is provided', () => {
    fixture.componentRef.setInput('error', 'Some error');
    fixture.detectChanges();
    const paragraph = fixture.debugElement.query(By.css('.info'));
    expect(paragraph).toBeTruthy();
    expect(paragraph.nativeElement.textContent).toContain('Tryb offline');
  });

  it('should not render info text when error is null', () => {
    fixture.componentRef.setInput('error', null);
    fixture.detectChanges();
    const paragraph = fixture.debugElement.query(By.css('.info'));
    expect(paragraph).toBeFalsy();
  });

  it('should not render info text when error is undefined', () => {
    fixture.detectChanges();
    const paragraph = fixture.debugElement.query(By.css('.info'));
    expect(paragraph).toBeFalsy();
  });
});