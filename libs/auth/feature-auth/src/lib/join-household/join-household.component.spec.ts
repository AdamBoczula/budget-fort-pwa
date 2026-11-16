// spec: docs/specs/sync/03-household-invite-link.md

import { signal } from '@angular/core';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { render, screen, waitFor, fireEvent } from '@testing-library/angular';
import { AuthService } from '@data-access-auth';
import {
  BF_PENDING_INVITE_CODE_KEY,
  getPendingInviteCode,
  SyncEngineService,
  SyncState,
} from '@data-access-sync';
import { Household } from 'local-db';
import { JoinHouseholdComponent } from './join-household.component';

describe('JoinHouseholdComponent', () => {
  let mockRouter: { navigate: ReturnType<typeof vi.fn> };
  let mockSnackBar: { open: ReturnType<typeof vi.fn> };
  let mockAuthService: {
    waitForAuthReady: ReturnType<typeof vi.fn>;
    isAuthorized: ReturnType<typeof vi.fn>;
    isGuest: ReturnType<typeof vi.fn>;
  };
  let mockSyncEngine: {
    joinHousehold: ReturnType<typeof vi.fn>;
  };
  let mockSyncState: {
    currentHousehold: ReturnType<typeof signal<Household | null>>;
  };

  const defaultHousehold: Household = {
    id: 'hh-1',
    name: 'Budżet Domowy',
    ownerUid: 'owner-1',
    members: ['owner-1'],
    inviteCode: 'ABC123',
    createdAt: '2026-11-16T00:00:00Z',
    updatedAt: '2026-11-16T00:00:00Z',
  };

  const setup = async (
    queryParams: Record<string, string> = { code: 'ABC123' },
  ): Promise<ReturnType<typeof render<JoinHouseholdComponent>>> => {
    sessionStorage.clear();
    mockRouter = { navigate: vi.fn(async () => true) };
    mockSnackBar = { open: vi.fn() };
    mockAuthService = {
      waitForAuthReady: vi.fn(async () => undefined),
      isAuthorized: vi.fn(() => true),
      isGuest: vi.fn(() => false),
    };
    mockSyncEngine = {
      joinHousehold: vi.fn(async () => defaultHousehold),
    };
    mockSyncState = {
      currentHousehold: signal<Household | null>(null),
    };

    return await render(JoinHouseholdComponent, {
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: AuthService, useValue: mockAuthService },
        { provide: SyncEngineService, useValue: mockSyncEngine },
        { provide: SyncState, useValue: mockSyncState },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: convertToParamMap(queryParams),
            },
          },
        },
      ],
    });
  };

  // covers: docs/specs/sync/03-household-invite-link.md#AC-6
  it('should display error when no invite code is provided', async () => {
    await setup({});

    expect(screen.getByTestId('join-household-error-msg').textContent).toContain(
      'Brak kodu zaproszenia w linku.',
    );
    expect(mockSyncEngine.joinHousehold).not.toHaveBeenCalled();
  });

  // covers: docs/specs/sync/03-household-invite-link.md#AC-3
  it('should store pending invite code in sessionStorage and redirect to login when not authenticated', async () => {
    mockAuthService = {
      waitForAuthReady: vi.fn(async () => undefined),
      isAuthorized: vi.fn(() => false),
      isGuest: vi.fn(() => false),
    };

    sessionStorage.clear();
    mockRouter = { navigate: vi.fn(async () => true) };
    mockSnackBar = { open: vi.fn() };
    mockSyncEngine = { joinHousehold: vi.fn(async () => defaultHousehold) };
    mockSyncState = { currentHousehold: signal<Household | null>(null) };

    await render(JoinHouseholdComponent, {
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: AuthService, useValue: mockAuthService },
        { provide: SyncEngineService, useValue: mockSyncEngine },
        { provide: SyncState, useValue: mockSyncState },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: convertToParamMap({ code: 'BF89X2' }),
            },
          },
        },
      ],
    });

    await waitFor(() => {
      expect(sessionStorage.getItem(BF_PENDING_INVITE_CODE_KEY)).toBe('BF89X2');
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/auth/login'], {
        queryParams: { returnUrl: '/join?code=BF89X2' },
      });
    });
  });

  // covers: docs/specs/sync/03-household-invite-link.md#AC-3
  it('should redirect guest user to login as well', async () => {
    mockAuthService = {
      waitForAuthReady: vi.fn(async () => undefined),
      isAuthorized: vi.fn(() => true),
      isGuest: vi.fn(() => true),
    };

    sessionStorage.clear();
    mockRouter = { navigate: vi.fn(async () => true) };
    mockSnackBar = { open: vi.fn() };
    mockSyncEngine = { joinHousehold: vi.fn(async () => defaultHousehold) };
    mockSyncState = { currentHousehold: signal<Household | null>(null) };

    await render(JoinHouseholdComponent, {
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: AuthService, useValue: mockAuthService },
        { provide: SyncEngineService, useValue: mockSyncEngine },
        { provide: SyncState, useValue: mockSyncState },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: convertToParamMap({ invite: 'GUEST77' }),
            },
          },
        },
      ],
    });

    await waitFor(() => {
      expect(getPendingInviteCode()).toBe('GUEST77');
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/auth/login'], {
        queryParams: { returnUrl: '/join?code=GUEST77' },
      });
    });
  });

  // covers: docs/specs/sync/03-household-invite-link.md#AC-2
  it('should join household and redirect to dashboard when authenticated', async () => {
    await setup({ code: 'BF89X2' });

    await waitFor(() => {
      expect(mockSyncEngine.joinHousehold).toHaveBeenCalledWith('BF89X2');
      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Pomyślnie dołączono do gospodarstwa domowego!',
        'OK',
        expect.any(Object),
      );
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
    });
  });

  // covers: docs/specs/sync/03-household-invite-link.md#AC-2
  it('should handle case when user is already in target household', async () => {
    sessionStorage.clear();
    mockRouter = { navigate: vi.fn(async () => true) };
    mockSnackBar = { open: vi.fn() };
    mockAuthService = {
      waitForAuthReady: vi.fn(async () => undefined),
      isAuthorized: vi.fn(() => true),
      isGuest: vi.fn(() => false),
    };
    mockSyncEngine = { joinHousehold: vi.fn(async () => defaultHousehold) };
    mockSyncState = { currentHousehold: signal<Household | null>(defaultHousehold) };

    await render(JoinHouseholdComponent, {
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: AuthService, useValue: mockAuthService },
        { provide: SyncEngineService, useValue: mockSyncEngine },
        { provide: SyncState, useValue: mockSyncState },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: convertToParamMap({ code: defaultHousehold.inviteCode }),
            },
          },
        },
      ],
    });

    await waitFor(() => {
      expect(mockSyncEngine.joinHousehold).not.toHaveBeenCalled();
      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Należysz już do tego gospodarstwa domowego!',
        'OK',
        expect.any(Object),
      );
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
    });
  });

  // covers: docs/specs/sync/03-household-invite-link.md#AC-6
  it('should display error message when joining fails and allow retry', async () => {
    sessionStorage.clear();
    mockRouter = { navigate: vi.fn(async () => true) };
    mockSnackBar = { open: vi.fn() };
    mockAuthService = {
      waitForAuthReady: vi.fn(async () => undefined),
      isAuthorized: vi.fn(() => true),
      isGuest: vi.fn(() => false),
    };
    mockSyncEngine = {
      joinHousehold: vi
        .fn()
        .mockRejectedValueOnce(new Error('Nie znaleziono gospodarstwa domowego.'))
        .mockResolvedValueOnce(defaultHousehold),
    };
    mockSyncState = { currentHousehold: signal<Household | null>(null) };

    const { fixture } = await render(JoinHouseholdComponent, {
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: AuthService, useValue: mockAuthService },
        { provide: SyncEngineService, useValue: mockSyncEngine },
        { provide: SyncState, useValue: mockSyncState },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: convertToParamMap({ code: 'FAIL01' }),
            },
          },
        },
      ],
    });

    await waitFor(() => {
      expect(screen.getByTestId('join-household-error-msg').textContent).toContain(
        'Nie znaleziono gospodarstwa domowego.',
      );
    });

    const retryBtn = screen.getByTestId('join-retry-btn');
    fireEvent.click(retryBtn);
    fixture.detectChanges();

    await waitFor(() => {
      expect(mockSyncEngine.joinHousehold).toHaveBeenCalledTimes(2);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
    });
  });
});
