// spec: docs/specs/sync/03-household-invite-link.md

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  BF_PENDING_INVITE_CODE_KEY,
  buildInviteUrl,
  clearPendingInviteCode,
  getPendingInviteCode,
  setPendingInviteCode,
} from './invite-link.utils';

describe('invite-link.utils', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  // covers: docs/specs/sync/03-household-invite-link.md#AC-1
  describe('buildInviteUrl', () => {
    it('should generate URL with normalized code and custom origin', () => {
      const url = buildInviteUrl('bf89x2', 'https://budget-fort.app');
      expect(url).toBe('https://budget-fort.app/join?code=BF89X2');
    });

    it('should use window.location.origin when origin is not provided', () => {
      const url = buildInviteUrl('ABC123');
      expect(url).toContain('/join?code=ABC123');
    });
  });

  // covers: docs/specs/sync/03-household-invite-link.md#AC-3
  describe('pending invite storage', () => {
    it('should return null when no code is stored', () => {
      expect(getPendingInviteCode()).toBeNull();
    });

    it('should store normalized code in sessionStorage', () => {
      setPendingInviteCode(' abcd12 ');
      expect(sessionStorage.getItem(BF_PENDING_INVITE_CODE_KEY)).toBe('ABCD12');
      expect(getPendingInviteCode()).toBe('ABCD12');
    });

    it('should clear stored code', () => {
      setPendingInviteCode('TEST99');
      expect(getPendingInviteCode()).toBe('TEST99');

      clearPendingInviteCode();
      expect(getPendingInviteCode()).toBeNull();
      expect(sessionStorage.getItem(BF_PENDING_INVITE_CODE_KEY)).toBeNull();
    });

    it('should gracefully handle storage errors', () => {
      vi.spyOn(sessionStorage, 'getItem').mockImplementationOnce(() => {
        throw new Error('Access denied');
      });
      expect(getPendingInviteCode()).toBeNull();
    });
  });
});
