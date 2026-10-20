// spec: docs/specs/budget/planowanie-budzetu.md

/**
 * Returns a color based on budget progress percentage.
 * - < 80%  → green  (#4caf50)
 * - 80–99% → yellow (#ff9800)
 * - ≥ 100% → red    (#f44336)
 */
export function getProgressColor(percentage: number): string {
  if (percentage >= 100) {
    return '#f44336';
  }
  if (percentage >= 80) {
    return '#ff9800';
  }
  return '#4caf50';
}
