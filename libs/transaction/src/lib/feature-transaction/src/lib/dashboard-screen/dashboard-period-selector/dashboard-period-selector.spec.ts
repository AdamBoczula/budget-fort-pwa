import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { registerLocaleData } from '@angular/common';
import localePl from '@angular/common/locales/pl';
import { DashboardPeriodSelectorComponent } from './dashboard-period-selector';
import { provideNativeDateAdapter } from '@angular/material/core';
import { DashboardState } from '../../service/dashboard-state/dashboard-state';

describe('DashboardPeriodSelectorComponent', () => {
  let fixture: ComponentFixture<DashboardPeriodSelectorComponent>;
  let component: DashboardPeriodSelectorComponent;

  beforeAll(() => {
    registerLocaleData(localePl);
  });

  let mockDashboardState: ReturnType<typeof createMockState>;
  const createMockState = (overrides?: Partial<ReturnType<typeof createMockState>>) => ({
    periodMode: vi.fn(() => 'month' as const),
    selectedYear: vi.fn(() => 2026),
    selectedMonth: vi.fn(() => 6),
    availableYears: vi.fn(() => [2026, 2025, 2024]),
    periodLabel: vi.fn(() => 'lipiec 2026'),
    canGoNext: vi.fn(() => false),
    canGoPrevious: vi.fn(() => true),
    goToPrevious: vi.fn(),
    goToNext: vi.fn(),
    setPeriodMode: vi.fn(),
    setMonth: vi.fn(),
    setYear: vi.fn(),
    categorySpending: vi.fn(() => []),
    totalSpending: vi.fn(() => 0),
    expenseTransactions: vi.fn(() => []),
    expenseCategories: vi.fn(() => []),
    categoryWithSubcategories: vi.fn(() => []),
    transactionCount: vi.fn(() => 0),
    filteredTransactions: vi.fn(() => []),
    allTransactions: vi.fn(() => []),
    categories: vi.fn(() => []),
    ...overrides,
  });

  beforeEach(async () => {
    mockDashboardState = createMockState();
    await TestBed.configureTestingModule({
      imports: [DashboardPeriodSelectorComponent],
      providers: [
        { provide: DashboardState, useValue: mockDashboardState },
        provideNativeDateAdapter(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardPeriodSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render period label as a clickable button', () => {
    const label = fixture.debugElement.query(By.css('.period-selector__label'));
    expect(label).toBeTruthy();
    expect(label.nativeElement.tagName).toBe('BUTTON');
    expect(label.nativeElement.textContent).toContain('lipiec 2026');
  });

  it('should render previous and next navigation buttons', () => {
    const buttons = fixture.debugElement.queryAll(
      By.css('.period-selector__navigation button[mat-icon-button]'),
    );
    expect(buttons.length).toBe(2);
  });

  it('should render period mode toggle (month/year)', () => {
    const toggleGroup = fixture.debugElement.query(By.css('mat-button-toggle-group'));
    expect(toggleGroup).toBeTruthy();
    const toggles = toggleGroup.queryAll(By.css('mat-button-toggle'));
    expect(toggles.length).toBe(2);
  });

  it('should call goToPrevious on left arrow click', () => {
    const buttons = fixture.debugElement.queryAll(
      By.css('.period-selector__navigation button[mat-icon-button]'),
    );
    buttons[0].triggerEventHandler('click');
    expect(mockDashboardState.goToPrevious).toHaveBeenCalled();
  });

  it('should call goToNext on right arrow click', () => {
    mockDashboardState.canGoNext.mockReturnValue(true);
    fixture.detectChanges();
    const buttons = fixture.debugElement.queryAll(
      By.css('.period-selector__navigation button[mat-icon-button]'),
    );
    buttons[1].triggerEventHandler('click');
    expect(mockDashboardState.goToNext).toHaveBeenCalled();
  });

  it('should call setPeriodMode on toggle change', () => {
    component.onModeChange('year');
    expect(mockDashboardState.setPeriodMode).toHaveBeenCalledWith('year');
  });

  it('should call setMonth and setYear on monthSelected in month mode', () => {
    const testDate = new Date(2025, 3, 15); // kwiecień 2025
    const fakePicker = { close: vi.fn() } as unknown as import('@angular/material/datepicker').MatDatepicker<Date>;

    component.onMonthSelected(testDate, fakePicker);

    expect(mockDashboardState.setMonth).toHaveBeenCalledWith(3);
    expect(mockDashboardState.setYear).toHaveBeenCalledWith(2025);
    expect(fakePicker.close).toHaveBeenCalled();
  });

  it('should call setYear and close on yearSelected in year mode', () => {
    mockDashboardState.periodMode.mockReturnValue('year');
    const testDate = new Date(2025, 0, 1);
    const fakePicker = { close: vi.fn() } as unknown as import('@angular/material/datepicker').MatDatepicker<Date>;

    component.onYearSelected(testDate, fakePicker);

    expect(mockDashboardState.setYear).toHaveBeenCalledWith(2025);
    expect(fakePicker.close).toHaveBeenCalled();
    expect(mockDashboardState.setMonth).not.toHaveBeenCalled();
  });

  it('should ignore monthSelected in year mode', () => {
    mockDashboardState.periodMode.mockReturnValue('year');
    const testDate = new Date(2025, 3, 15);
    const fakePicker = { close: vi.fn() } as unknown as import('@angular/material/datepicker').MatDatepicker<Date>;

    component.onMonthSelected(testDate, fakePicker);

    expect(mockDashboardState.setMonth).not.toHaveBeenCalled();
    expect(mockDashboardState.setYear).not.toHaveBeenCalled();
    expect(fakePicker.close).not.toHaveBeenCalled();
  });

  it('should ignore yearSelected in month mode', () => {
    const testDate = new Date(2025, 0, 1);
    const fakePicker = { close: vi.fn() } as unknown as import('@angular/material/datepicker').MatDatepicker<Date>;

    component.onYearSelected(testDate, fakePicker);

    expect(mockDashboardState.setYear).not.toHaveBeenCalled();
    expect(fakePicker.close).not.toHaveBeenCalled();
  });

  it('should not render month/year mat-select dropdowns', () => {
    const selects = fixture.debugElement.queryAll(By.css('mat-select'));
    expect(selects.length).toBe(0);
  });

  it('should render mat-datepicker element', () => {
    const datepicker = fixture.debugElement.query(By.css('mat-datepicker'));
    expect(datepicker).toBeTruthy();
  });
});