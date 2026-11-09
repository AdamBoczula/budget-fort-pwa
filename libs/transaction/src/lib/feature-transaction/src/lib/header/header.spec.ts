// spec: docs/specs/budget/redesign-home-minimalist.md
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';
import { TransactionTopBarComponent } from './header';

describe('TransactionTopBarComponent', () => {
  let component: TransactionTopBarComponent;
  let fixture: ComponentFixture<TransactionTopBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransactionTopBarComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(TransactionTopBarComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should pass monthName input to child component', () => {
    fixture.componentRef.setInput('monthName', 'Sierpień 2026');
    fixture.detectChanges();

    const childToolbar = fixture.debugElement.query(By.css('transaction-header-toolbar'));
    expect(childToolbar).toBeTruthy();
    expect(childToolbar.componentInstance.monthName()).toBe('Sierpień 2026');
  });

  it('should not render a balance pill in the toolbar', () => {
    fixture.detectChanges();

    const balanceEl = fixture.debugElement.query(By.css('.transaction-header-toolbar__balance'));
    expect(balanceEl).toBeNull();
  });

  it('should emit menuClick when menu button is clicked', () => {
    const menuSpy = vi.fn();
    component.menuClick.subscribe(menuSpy);

    component.requestMenuOpen();

    expect(menuSpy).toHaveBeenCalledOnce();
  });
});
