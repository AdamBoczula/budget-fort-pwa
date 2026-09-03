import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { registerLocaleData } from '@angular/common';
import localePl from '@angular/common/locales/pl';
import { DashboardCategoryDetailComponent } from './dashboard-category-detail';
import { Transaction } from '@data-access-transaction';

describe('DashboardCategoryDetailComponent', () => {
  let fixture: ComponentFixture<DashboardCategoryDetailComponent>;

  beforeAll(() => {
    registerLocaleData(localePl);
  });

  const mockTransactions: Transaction[] = [
    { id: '1', amount: -150, date: '2026-07-15T12:00:00.000Z', categoryId: 'food', accountId: 'default', comment: 'Obiad', subcategory: 'Jedzenie na mieście' },
    { id: '2', amount: -80, date: '2026-07-20T12:00:00.000Z', categoryId: 'food', accountId: 'default', subcategory: 'Zakupy' },
    { id: '3', amount: -50, date: '2026-07-10T12:00:00.000Z', categoryId: 'food', accountId: 'default' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardCategoryDetailComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardCategoryDetailComponent);
    fixture.componentRef.setInput('transactions', mockTransactions);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render a table with transaction rows', () => {
    const rows = fixture.debugElement.queryAll(By.css('table tbody tr'));
    expect(rows.length).toBe(3);
  });

  it('should display date for each transaction', () => {
    const firstDate = fixture.debugElement.query(By.css('table tbody tr:first-child td:first-child'));
    expect(firstDate).toBeTruthy();
    expect(firstDate.nativeElement.textContent.trim()).toBeTruthy();
  });

  it('should display subcategory or dash when missing', () => {
    const cells = fixture.debugElement.queryAll(By.css('table tbody tr td:nth-child(2)'));
    expect(cells[0].nativeElement.textContent.trim()).toContain('Jedzenie na mieście');
    expect(cells[1].nativeElement.textContent.trim()).toContain('Zakupy');
    expect(cells[2].nativeElement.textContent.trim()).toContain('—');
  });

  it('should display comment when present', () => {
    const firstCell = fixture.debugElement.query(By.css('table tbody tr:first-child td:nth-child(2)'));
    expect(firstCell.nativeElement.textContent).toContain('Obiad');
  });

  it('should render amount with PLN formatting', () => {
    const amountCells = fixture.debugElement.queryAll(By.css('table tbody tr td:nth-child(3)'));
    expect(amountCells.length).toBe(3);
    expect(amountCells[0].nativeElement.textContent).toContain('zł');
  });

  it('should render edit button for each transaction', () => {
    const editButtons = fixture.debugElement.queryAll(By.css('table tbody tr button[mat-icon-button]'));
    expect(editButtons.length).toBe(3);
  });

  it('should emit edit event on edit button click', () => {
    const editSpy = vi.fn();
    fixture.componentInstance.edit.subscribe(editSpy);
    fixture.detectChanges();

    const editButton = fixture.debugElement.query(By.css('table tbody tr:first-child button[mat-icon-button]'));
    editButton.nativeElement.click();

    expect(editSpy).toHaveBeenCalledTimes(1);
    expect(editSpy).toHaveBeenCalledWith(mockTransactions[0]);
  });
});