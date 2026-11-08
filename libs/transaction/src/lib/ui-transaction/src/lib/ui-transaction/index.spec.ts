// spec: docs/specs/budget/poprawa-ux-ui-mvp.md
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TransactionBottomNavComponent } from './transaction-bottom-nav.component';
import { TransactionHeaderToolbarComponent } from './transaction-header-toolbar.component';
import { TransactionNavigationDrawerComponent } from './transaction-navigation-drawer.component';

describe('@ui-transaction exports', () => {
  it('should export TransactionHeaderToolbarComponent', () => {
    expect(TransactionHeaderToolbarComponent).toBeDefined();
  });

  it('should export TransactionNavigationDrawerComponent', () => {
    expect(TransactionNavigationDrawerComponent).toBeDefined();
  });

  it('should export TransactionBottomNavComponent', () => {
    expect(TransactionBottomNavComponent).toBeDefined();
  });

  // covers: docs/specs/budget/przeglad-historii-budzetu.md#AC-4
  it('should render flat navigation items without expansion panels', async () => {
    await TestBed.configureTestingModule({
      imports: [TransactionNavigationDrawerComponent],
      providers: [provideRouter([]), { provide: LOCALE_ID, useValue: 'pl' }],
    }).compileComponents();

    const fixture = TestBed.createComponent(TransactionNavigationDrawerComponent);
    fixture.detectChanges();

    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelectorAll('mat-expansion-panel').length).toBe(0);

    const links = Array.from(element.querySelectorAll('a[mat-list-item]')).map((a) =>
      a.textContent?.trim(),
    );
    expect(links).toHaveLength(4);
    expect(links.join(' ')).toContain('Strona główna');
    expect(links.join(' ')).toContain('Dashboard');
    expect(links.join(' ')).toContain('Budżet');
    expect(links.join(' ')).toContain('Ustawienia');
  });

  it('should render 4 mobile bottom navigation links', async () => {
    await TestBed.configureTestingModule({
      imports: [TransactionBottomNavComponent],
      providers: [provideRouter([]), { provide: LOCALE_ID, useValue: 'pl' }],
    }).compileComponents();

    const fixture = TestBed.createComponent(TransactionBottomNavComponent);
    fixture.detectChanges();

    const element: HTMLElement = fixture.nativeElement;
    const links = Array.from(element.querySelectorAll('a.bottom-nav__item'));
    expect(links).toHaveLength(4);
    const text = links.map((a) => a.textContent?.trim()).join(' ');
    expect(text).toContain('Start');
    expect(text).toContain('Analiza');
    expect(text).toContain('Budżet');
    expect(text).toContain('Ustawienia');
  });
});
