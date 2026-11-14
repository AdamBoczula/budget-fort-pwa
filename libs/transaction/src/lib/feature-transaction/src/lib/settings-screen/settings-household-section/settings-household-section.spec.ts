// spec: docs/specs/sync/02-multi-user-household.md

import { signal } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { render, screen, waitFor, fireEvent } from '@testing-library/angular';
import { AuthService } from '@data-access-auth';
import { SyncEngineService, SyncState } from '@data-access-sync';
import { Household } from 'local-db';
import { SettingsHouseholdSectionComponent } from './settings-household-section';

describe('SettingsHouseholdSectionComponent', () => {
  let mockAuth: { isGuest: ReturnType<typeof signal<boolean>> };
  let mockSyncState: {
    currentHousehold: ReturnType<typeof signal<Household | null>>;
  };
  let mockSyncEngine: {
    joinHousehold: ReturnType<typeof vi.fn>;
  };
  let mockSnackBar: {
    open: ReturnType<typeof vi.fn>;
  };

  const defaultHousehold: Household = {
    id: 'hh-1',
    name: 'Nasze Mieszkanie',
    ownerUid: 'uid-adam',
    members: ['uid-adam', 'uid-partner'],
    inviteCode: 'BF7788',
    createdAt: '2026-11-14T10:00:00Z',
    updatedAt: '2026-11-14T10:00:00Z',
    isDeleted: false,
  };

  beforeEach(() => {
    mockAuth = { isGuest: signal(false) };
    mockSyncState = { currentHousehold: signal(defaultHousehold) };
    mockSyncEngine = {
      joinHousehold: vi.fn(async () => defaultHousehold),
    };
    mockSnackBar = {
      open: vi.fn(),
    };
  });

  const renderComponent = async () => {
    return render(SettingsHouseholdSectionComponent, {
      providers: [
        { provide: AuthService, useValue: mockAuth },
        { provide: SyncState, useValue: mockSyncState },
        { provide: SyncEngineService, useValue: mockSyncEngine },
        { provide: MatSnackBar, useValue: mockSnackBar },
      ],
    });
  };

  // covers: docs/specs/sync/02-multi-user-household.md#AC-4
  it('should render guest banner when in guest mode', async () => {
    mockAuth.isGuest.set(true);
    await renderComponent();

    expect(screen.getByTestId('household-guest-banner')).toBeInTheDocument();
    expect(screen.queryByTestId('household-card')).not.toBeInTheDocument();
  });

  // covers: docs/specs/sync/02-multi-user-household.md#AC-1
  // covers: docs/specs/sync/02-multi-user-household.md#AC-4
  it('should render household details when authenticated', async () => {
    await renderComponent();

    expect(screen.getByTestId('household-card')).toBeInTheDocument();
    expect(screen.getByTestId('household-name')).toHaveTextContent('Nasze Mieszkanie');
    expect(screen.getByTestId('household-members-count')).toHaveTextContent('2');
    expect(screen.getByTestId('household-invite-code')).toHaveTextContent('BF7788');
  });

  // covers: docs/specs/sync/02-multi-user-household.md#AC-4
  it('should call copy invite code when copy button is clicked', async () => {
    const { fixture } = await renderComponent();

    const copyBtn = screen.getByTestId('copy-invite-code-btn');
    fireEvent.click(copyBtn);
    fixture.detectChanges();

    await waitFor(() => {
      expect(mockSnackBar.open).toHaveBeenCalledWith(
        expect.stringMatching(/skopiowany|BF7788/),
        'OK',
        expect.any(Object),
      );
    });
  });

  // covers: docs/specs/sync/02-multi-user-household.md#AC-4
  it('should join household when valid invite code is submitted', async () => {
    const { fixture } = await renderComponent();

    const input = screen.getByTestId('join-household-input');
    fireEvent.input(input, { target: { value: 'BF9900' } });
    fixture.detectChanges();

    const joinBtn = screen.getByTestId('join-household-btn');
    expect(joinBtn).toBeEnabled();

    fireEvent.click(joinBtn);
    fixture.detectChanges();

    await waitFor(() => {
      expect(mockSyncEngine.joinHousehold).toHaveBeenCalledWith('BF9900');
      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Pomyślnie dołączono do gospodarstwa domowego!',
        'OK',
        expect.any(Object),
      );
    });
  });

  // covers: docs/specs/sync/02-multi-user-household.md#AC-4
  it('should display error message when joining fails', async () => {
    mockSyncEngine.joinHousehold.mockRejectedValueOnce(
      new Error('Nie znaleziono gospodarstwa domowego.'),
    );

    const { fixture } = await renderComponent();

    const input = screen.getByTestId('join-household-input');
    fireEvent.input(input, { target: { value: 'BADCOD' } });
    fixture.detectChanges();

    const joinBtn = screen.getByTestId('join-household-btn');
    fireEvent.click(joinBtn);
    fixture.detectChanges();

    await waitFor(() => {
      expect(screen.getByTestId('join-household-error')).toHaveTextContent(
        'Nie znaleziono gospodarstwa domowego.',
      );
    });
  });
});
