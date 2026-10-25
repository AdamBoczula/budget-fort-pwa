// spec: docs/qa/2026-10-21-ui-ux-audit.md

import { getProgressColor, getProgressGradient } from './progress-color-utils';

describe('getProgressColor', () => {
  // covers: docs/specs/budget/planowanie-budzetu.md#AC-3
  it('should return green (#4caf50) for percentage below 80%', () => {
    expect(getProgressColor(0)).toBe('#4caf50');
    expect(getProgressColor(40)).toBe('#4caf50');
    expect(getProgressColor(79)).toBe('#4caf50');
  });

  // covers: docs/specs/budget/planowanie-budzetu.md#AC-4
  // covers: docs/specs/budget/planowanie-budzetu.md#AC-6
  it('should return yellow (#ff9800) for percentage between 80% and 99% (inclusive)', () => {
    expect(getProgressColor(80)).toBe('#ff9800');
    expect(getProgressColor(90)).toBe('#ff9800');
    expect(getProgressColor(99)).toBe('#ff9800');
  });

  // covers: docs/specs/budget/planowanie-budzetu.md#AC-5
  it('should return red (#f44336) for percentage at or above 100%', () => {
    expect(getProgressColor(100)).toBe('#f44336');
    expect(getProgressColor(150)).toBe('#f44336');
    expect(getProgressColor(200)).toBe('#f44336');
  });
});

describe('getProgressGradient', () => {
  // covers: docs/qa/2026-10-21-ui-ux-audit.md
  it('should return green-to-lime gradient for percentages <= 50%', () => {
    const result = getProgressGradient(0);
    expect(result).toContain('linear-gradient');
    expect(result).toContain('#4caf50 0%');
    expect(result).toContain('#cddc39 0%');

    const mid = getProgressGradient(25);
    expect(mid).toContain('#4caf50 0%');
    expect(mid).toContain('#cddc39 50%');

    const edge = getProgressGradient(50);
    expect(edge).toContain('#4caf50 0%');
    expect(edge).toContain('#cddc39 100%');
  });

  it('should return lime-through-orange-to-red gradient for percentages > 50%', () => {
    const result = getProgressGradient(75);
    expect(result).toContain('linear-gradient');
    expect(result).toContain('#cddc39 0%');
    expect(result).toContain('#ff9800 25%');
    expect(result).toContain('#f44336 50%');

    const full = getProgressGradient(100);
    expect(full).toContain('#cddc39 0%');
    expect(full).toContain('#ff9800 50%');
    expect(full).toContain('#f44336 100%');
  });

  it('should clamp values outside 0-100 range', () => {
    const negative = getProgressGradient(-10);
    expect(negative).toContain('#cddc39 0%'); // treated as 0%

    const overflow = getProgressGradient(200);
    expect(overflow).toContain('#f44336 100%'); // treated as 100%
  });
});