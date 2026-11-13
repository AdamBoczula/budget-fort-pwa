// spec: docs/specs/sync/01-firestore-sync.md

import { TestBed } from '@angular/core/testing';
import { NetworkStatusService } from './network-status.service';

describe('NetworkStatusService', () => {
  let service: NetworkStatusService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [NetworkStatusService],
    });
    service = TestBed.inject(NetworkStatusService);
  });

  // covers: docs/specs/sync/01-firestore-sync.md#AC-2
  it('should initialize with default online status', () => {
    expect(typeof service.isOnline()).toBe('boolean');
  });

  // covers: docs/specs/sync/01-firestore-sync.md#AC-2
  it('should update online status when setOnline is called', () => {
    service.setOnline(false);
    expect(service.isOnline()).toBe(false);

    service.setOnline(true);
    expect(service.isOnline()).toBe(true);
  });

  // covers: docs/specs/sync/01-firestore-sync.md#AC-2
  it('should respond to window online and offline events', () => {
    window.dispatchEvent(new Event('offline'));
    expect(service.isOnline()).toBe(false);

    window.dispatchEvent(new Event('online'));
    expect(service.isOnline()).toBe(true);
  });
});
