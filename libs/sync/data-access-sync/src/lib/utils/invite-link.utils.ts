// spec: docs/specs/sync/03-household-invite-link.md

export const BF_PENDING_INVITE_CODE_KEY = 'bf_pending_invite_code';

/**
 * Retrieves the pending household invite code from sessionStorage if present.
 */
export function getPendingInviteCode(): string | null {
  if (typeof sessionStorage === 'undefined') {
    return null;
  }
  try {
    const code = sessionStorage.getItem(BF_PENDING_INVITE_CODE_KEY);
    return code ? code.trim().toUpperCase() : null;
  } catch {
    return null;
  }
}

/**
 * Stores a pending household invite code in sessionStorage.
 */
export function setPendingInviteCode(code: string): void {
  if (typeof sessionStorage === 'undefined') {
    return;
  }
  const normalized = code.trim().toUpperCase();
  if (normalized) {
    try {
      sessionStorage.setItem(BF_PENDING_INVITE_CODE_KEY, normalized);
    } catch {
      // Ignore sessionStorage write errors (e.g. private mode quota)
    }
  }
}

/**
 * Clears the pending household invite code from sessionStorage.
 */
export function clearPendingInviteCode(): void {
  if (typeof sessionStorage === 'undefined') {
    return;
  }
  try {
    sessionStorage.removeItem(BF_PENDING_INVITE_CODE_KEY);
  } catch {
    // Ignore errors
  }
}

/**
 * Builds the canonical deep link URL for joining a household by invite code.
 */
export function buildInviteUrl(inviteCode: string, origin?: string): string {
  const normalized = inviteCode.trim().toUpperCase();
  const baseOrigin =
    origin ??
    (typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : 'https://budget-fort.app');
  return `${baseOrigin}/join?code=${encodeURIComponent(normalized)}`;
}
