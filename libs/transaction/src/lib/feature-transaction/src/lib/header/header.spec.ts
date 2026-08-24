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

    const childToolbar = fixture.debugElement.query(
      By.css('transaction-header-toolbar'),
    );
    expect(childToolbar).toBeTruthy();
    expect(childToolbar.componentInstance.monthName()).toBe('Sierpień 2026');
  });

  it('should pass balance input to child component', () => {
    fixture.componentRef.setInput('balance', 1250.5);
    fixture.detectChanges();

    const childToolbar = fixture.debugElement.query(
      By.css('transaction-header-toolbar'),
    );
    expect(childToolbar.componentInstance.balance()).toBe(1250.5);
  });

  it('should emit menuClick when menu button is clicked', () => {
    const menuSpy = vi.fn();
    component.menuClick.subscribe(menuSpy);

    component.requestMenuOpen();

    expect(menuSpy).toHaveBeenCalledOnce();
  });
});
