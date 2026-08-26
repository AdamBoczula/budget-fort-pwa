import { render, screen } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';
import { TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { LocalStorageService } from 'local-db';
import { SettingsThemeSelectorComponent } from './settings-theme-selector';

describe('SettingsThemeSelectorComponent', () => {
  const localStorageMock = {
    getItem: vi.fn().mockReturnValue(null),
    setItem: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);

    await TestBed.configureTestingModule({
      imports: [SettingsThemeSelectorComponent],
      providers: [
        provideAnimationsAsync(),
        { provide: LocalStorageService, useValue: localStorageMock },
      ],
    }).compileComponents();
  });

  it('should render theme title', async () => {
    await render(SettingsThemeSelectorComponent);
    expect(screen.getByText('Motyw kolorystyczny')).toBeDefined();
  });

  it('should render theme select', async () => {
    await render(SettingsThemeSelectorComponent);

    const themeSelect = screen.getByRole('combobox', { name: /motyw/i });
    expect(themeSelect).toBeDefined();
  });

  it('should persist theme change to localStorage', async () => {
    const user = userEvent.setup();
    await render(SettingsThemeSelectorComponent);

    const themeSelect = screen.getByRole('combobox', { name: /motyw/i });
    await user.click(themeSelect);

    const option = await screen.findByText('Rose & Red');
    await user.click(option);

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'budget-fort.theme',
      'rose-red',
    );
  });
});