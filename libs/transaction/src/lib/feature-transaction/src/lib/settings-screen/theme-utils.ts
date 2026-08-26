import { TransactionThemeId } from '@ui-transaction';
import { THEME_ROOT_CLASS_PREFIX } from './settings-constants';

const THEME_IDS: ReadonlyArray<TransactionThemeId> = [
  'azure-blue',
  'rose-red',
  'magenta-violet',
  'cyan-orange',
];

/**
 * Applies the given theme to the document root by toggling CSS classes
 * on `document.documentElement`. Removes all known theme-* classes first,
 * then adds the selected one.
 */
export function applyThemeClass(themeId: TransactionThemeId): void {
  const classList = document.documentElement.classList;

  for (const id of THEME_IDS) {
    classList.remove(`${THEME_ROOT_CLASS_PREFIX}${id}`);
  }

  classList.add(`${THEME_ROOT_CLASS_PREFIX}${themeId}`);
}

/**
 * Resolves a raw string candidate into a valid TransactionThemeId,
 * falling back to the default if the candidate is invalid.
 */
export function resolveThemeId(
  candidate: string | null,
  themeOptions: ReadonlyArray<{ id: TransactionThemeId }>,
  defaultId: TransactionThemeId,
): TransactionThemeId {
  if (candidate && themeOptions.some((t) => t.id === candidate)) {
    return candidate as TransactionThemeId;
  }
  return defaultId;
}