import { describe, it, expect } from 'vitest';
import {
  getCurrentLocalMonth,
  getMonthRange,
  getYearRange,
  getAvailableYears,
  getMonthName,
  isInMonth,
  isInYear,
} from './period-utils';

describe('period-utils', () => {
  describe('getCurrentLocalMonth', () => {
    it('should return current year and month', () => {
      const now = new Date();
      const result = getCurrentLocalMonth();
      expect(result.year).toBe(now.getFullYear());
      expect(result.month).toBe(now.getMonth());
    });
  });

  describe('getMonthRange', () => {
    it('should return correct range for January 2026', () => {
      const { startDate, endDate } = getMonthRange(2026, 0);
      // Weryfikujemy składowe daty lokalnej, a nie ISO string
      const start = new Date(startDate);
      const end = new Date(endDate);
      expect(start.getFullYear()).toBe(2026);
      expect(start.getMonth()).toBe(0);
      expect(start.getDate()).toBe(1);
      expect(end.getFullYear()).toBe(2026);
      expect(end.getMonth()).toBe(0);
      expect(end.getDate()).toBe(31);
    });

    it('should return correct range for December 2026', () => {
      const { startDate, endDate } = getMonthRange(2026, 11);
      const start = new Date(startDate);
      const end = new Date(endDate);
      expect(start.getFullYear()).toBe(2026);
      expect(start.getMonth()).toBe(11);
      expect(start.getDate()).toBe(1);
      expect(end.getFullYear()).toBe(2026);
      expect(end.getMonth()).toBe(11);
      expect(end.getDate()).toBe(31);
    });
  });

  describe('getYearRange', () => {
    it('should return correct range for a year', () => {
      const { startDate, endDate } = getYearRange(2026);
      const start = new Date(startDate);
      const end = new Date(endDate);
      expect(start.getFullYear()).toBe(2026);
      expect(start.getMonth()).toBe(0);
      expect(start.getDate()).toBe(1);
      expect(end.getFullYear()).toBe(2026);
      expect(end.getMonth()).toBe(11);
      expect(end.getDate()).toBe(31);
    });
  });

  describe('getAvailableYears', () => {
    it('should return sorted unique years in descending order', () => {
      const dates = [
        '2025-03-15T12:00:00.000Z',
        '2026-07-22T12:00:00.000Z',
        '2024-01-01T12:00:00.000Z',
        '2026-08-01T12:00:00.000Z',
      ];
      const result = getAvailableYears(dates);
      expect(result).toEqual([2026, 2025, 2024]);
    });

    it('should skip invalid dates', () => {
      const dates = ['invalid', '2026-01-01T12:00:00.000Z', ''];
      const result = getAvailableYears(dates);
      expect(result).toEqual([2026]);
    });

    it('should return empty array for empty input', () => {
      expect(getAvailableYears([])).toEqual([]);
    });
  });

  describe('getMonthName', () => {
    it('should return Polish month name', () => {
      expect(getMonthName(0, 'pl')).toBe('styczeń');
      expect(getMonthName(5, 'pl')).toBe('czerwiec');
      expect(getMonthName(11, 'pl')).toBe('grudzień');
    });

    it('should return English month name', () => {
      expect(getMonthName(0, 'en')).toBe('January');
      expect(getMonthName(11, 'en')).toBe('December');
    });
  });

  describe('isInMonth', () => {
    it('should return true for date in the same month', () => {
      expect(isInMonth('2026-07-15T12:00:00.000Z', 2026, 6)).toBe(true);
    });

    it('should return false for date in different month', () => {
      expect(isInMonth('2026-07-15T12:00:00.000Z', 2026, 5)).toBe(false);
    });

    it('should return false for invalid date', () => {
      expect(isInMonth('invalid', 2026, 0)).toBe(false);
    });
  });

  describe('isInYear', () => {
    it('should return true for date in the same year', () => {
      expect(isInYear('2026-07-15T12:00:00.000Z', 2026)).toBe(true);
    });

    it('should return false for date in different year', () => {
      expect(isInYear('2025-07-15T12:00:00.000Z', 2026)).toBe(false);
    });
  });
});