// spec: docs/specs/budget/poprawa-ux-ui-mvp.md

import { describe, expect, it } from 'vitest';
import { getUserAvatarInitials } from './avatar-utils';

describe('getUserAvatarInitials', () => {
  // covers: docs/specs/budget/poprawa-ux-ui-mvp.md
  it('should return "B" for "boczuleq@gmail.com"', () => {
    expect(getUserAvatarInitials('boczuleq@gmail.com')).toBe('B');
  });

  // covers: docs/specs/budget/poprawa-ux-ui-mvp.md
  it('should return "AB" for "arnold.boczek@whotever.pl"', () => {
    expect(getUserAvatarInitials('arnold.boczek@whotever.pl')).toBe('AB');
  });

  // covers: docs/specs/budget/poprawa-ux-ui-mvp.md
  it('should return "WT" for "whatever.tutaj.jest@blabla.pl"', () => {
    expect(getUserAvatarInitials('whatever.tutaj.jest@blabla.pl')).toBe('WT');
  });

  // covers: docs/specs/budget/poprawa-ux-ui-mvp.md
  it('should return "ST" for "SomethingTutaj@asdf.pl"', () => {
    expect(getUserAvatarInitials('SomethingTutaj@asdf.pl')).toBe('ST');
  });

  it('should return "C" for single word before @ like "cokolwiek@domain.com"', () => {
    expect(getUserAvatarInitials('cokolwiek@domain.com')).toBe('C');
  });

  it('should handle camelCase with lowercase first word', () => {
    expect(getUserAvatarInitials('somethingTutaj@asdf.pl')).toBe('ST');
  });

  it('should handle dots with trailing dot', () => {
    expect(getUserAvatarInitials('boczuleq.@gmail.com')).toBe('B');
  });

  it('should return "?" for empty or null identifier', () => {
    expect(getUserAvatarInitials(null)).toBe('?');
    expect(getUserAvatarInitials(undefined)).toBe('?');
    expect(getUserAvatarInitials('')).toBe('?');
    expect(getUserAvatarInitials('  ')).toBe('?');
  });
});
