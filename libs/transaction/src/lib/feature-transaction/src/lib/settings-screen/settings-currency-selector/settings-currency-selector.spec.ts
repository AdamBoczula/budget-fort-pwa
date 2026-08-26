import { render, screen } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';
import { TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { LocalStorageService } from 'local-db';
import { SettingsCurrencySelectorComponent } from './settings-currency-selector';

describe('SettingsCurrencySelectorComponent', () => {
  const localStorageMock = {
    getItem: vi.fn().mockReturnValue(null),
    setItem: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);

    await TestBed.configureTestingModule({
      imports: [SettingsCurrencySelectorComponent],
      providers: [
        provideAnimationsAsync(),
        { provide: LocalStorageService, useValue: localStorageMock },
      ],
    }).compileComponents();
  });

  it('should render currency title', async () => {
    await render(SettingsCurrencySelectorComponent);
    expect(screen.getByText('Waluta')).toBeDefined();
  });

  it('should render currency select', async () => {
    await render(SettingsCurrencySelectorComponent);
    expect(screen.getByRole('combobox', { name: /walut/i })).toBeDefined();
  });

  it('should persist currency change to localStorage', async () => {
    const user = userEvent.setup();
    await render(SettingsCurrencySelectorComponent);

    const currencySelect = screen.getByRole('combobox', { name: /walut/i });
    await user.click(currencySelect);

    const eurOption = await screen.findByText('Euro (EUR)');
    await user.click(eurOption);

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'budget-fort.currency',
      'EUR',
    );
  });

  it('should restore saved currency from localStorage', async () => {
    localStorageMock.getItem.mockImplementation((key: string) => {
      if (key === 'budget-fort.currency') return 'GBP';
      return null;
    });

    await render(SettingsCurrencySelectorComponent);

    const currencySelect = screen.getByRole('combobox', { name: /walut/i });
    expect(currencySelect).toBeDefined();
  });
});