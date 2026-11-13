// spec: docs/specs/sync/01-firestore-sync.md

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
  it('should return empty array if items is empty', async () => {
    const result = await service.pushBatch('user-1', []);
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
});
