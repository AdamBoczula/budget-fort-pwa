// spec: docs/specs/budget/planowanie-budzetu.md

import { getProgressColor } from './progress-color-utils';

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
