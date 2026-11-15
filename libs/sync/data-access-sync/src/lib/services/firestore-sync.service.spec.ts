// spec: docs/specs/sync/01-firestore-sync.md
// spec: docs/specs/sync/02-multi-user-household.md

import { TestBed } from '@angular/core/testing';
import { FIREBASE_FIRESTORE, FirestoreSyncService } from './firestore-sync.service';

describe('FirestoreSyncService', () => {
  let service: FirestoreSyncService;
  let mockFirestore: Record<string, unknown>;

  beforeEach(() => {
    mockFirestore = {
      _isMock: true,
    };

    TestBed.configureTestingModule({
      providers: [
        FirestoreSyncService,
        {
          provide: FIREBASE_FIRESTORE,
          useValue: mockFirestore,
        },
      ],
    });

    service = TestBed.inject(FirestoreSyncService);
  });

  it('should confirm availability when firestore token is present', () => {
    expect(service.isAvailable()).toBe(true);
  });

  // covers: docs/specs/sync/01-firestore-sync.md#AC-2
  // covers: docs/specs/sync/02-multi-user-household.md#AC-3
  it('should return empty array if items is empty', async () => {
    const result = await service.pushBatch('household-1', []);
    expect(result).toEqual([]);
  });

  // covers: docs/specs/sync/01-firestore-sync.md#AC-4
  it('should handle missing firestore safely', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        FirestoreSyncService,
        {
          provide: FIREBASE_FIRESTORE,
          useValue: undefined,
        },
      ],
    });

    const fallbackService = TestBed.inject(FirestoreSyncService);
    expect(fallbackService.isAvailable()).toBe(false);
  });

  // covers: docs/specs/sync/02-multi-user-household.md#AC-4
  it('should throw error when joining household with empty invite code', async () => {
    await expect(service.joinHouseholdByInviteCode('   ', { uid: 'user-1' })).rejects.toThrow(
      'Kod zaproszenia nie może być pusty.',
    );
  });

  // covers: docs/specs/sync/01-firestore-sync.md#AC-2
  it('should sanitize payload by removing undefined properties', () => {
    const raw = {
      id: 'tx-123',
      amount: 150,
      comment: undefined,
      subcategory: undefined,
      recurringRuleId: undefined,
      authorName: 'Adam',
    };
    const cleaned = service.sanitizePayload(raw);
    expect(cleaned).toEqual({
      id: 'tx-123',
      amount: 150,
      authorName: 'Adam',
    });
    expect('comment' in cleaned).toBe(false);
    expect('subcategory' in cleaned).toBe(false);
  });
});
