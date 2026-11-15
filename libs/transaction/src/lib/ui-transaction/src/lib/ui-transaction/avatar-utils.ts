// spec: docs/specs/budget/poprawa-ux-ui-mvp.md

/**
 * Generates user avatar initials based on email or identifier.
 *
 * Rules:
 * 1. Takes username part before '@' (e.g. 'boczuleq@gmail.com' -> 'boczuleq').
 * 2. If contains dots (e.g. 'arnold.boczek@domain.pl' or 'whatever.tutaj.jest@blabla.pl'),
 *    splits by '.' and takes first letters of the first two parts (-> 'AB', 'WT').
 * 3. If contains camelCase/PascalCase (e.g. 'SomethingTutaj@asdf.pl'),
 *    splits by uppercase transitions and takes first letters of the first two parts (-> 'ST').
 * 4. Otherwise takes the first letter (e.g. 'boczuleq@gmail.com' -> 'B').
 */
export function getUserAvatarInitials(identifier?: string | null): string {
  if (!identifier) {
    return '?';
  }

  const atIndex = identifier.indexOf('@');
  const namePart = (atIndex >= 0 ? identifier.slice(0, atIndex) : identifier).trim();

  if (!namePart) {
    return '?';
  }

  // 1. Split by dot (e.g. "arnold.boczek", "whatever.tutaj.jest")
  if (namePart.includes('.')) {
    const dotParts = namePart.split('.').filter((part) => part.length > 0);
    if (dotParts.length >= 2) {
      return (dotParts[0][0] + dotParts[1][0]).toUpperCase();
    }
    if (dotParts.length === 1) {
      return dotParts[0][0].toUpperCase();
    }
  }

  // 2. Split by camelCase / PascalCase words (e.g. "SomethingTutaj", "somethingTutaj")
  const camelParts = namePart.match(/[A-Z]?[a-z0-9]+|[A-Z]+(?=[A-Z][a-z0-9]|$)/g);
  if (camelParts && camelParts.length >= 2) {
    return (camelParts[0][0] + camelParts[1][0]).toUpperCase();
  }

  // 3. Single word / Fallback: first letter
  return namePart[0].toUpperCase();
}
