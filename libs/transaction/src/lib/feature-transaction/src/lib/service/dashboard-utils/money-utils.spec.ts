import { describe, it, expect } from 'vitest';
import {
  roundHalfUp,
  calculatePercentage,
  formatCurrency,
  formatCompactCurrency,
} from './money-utils';

describe('money-utils', () => {
  describe('roundHalfUp', () => {
    it('should round half up to 2 decimals', () => {
      expect(roundHalfUp(10.345)).toBe(10.35);
      expect(roundHalfUp(10.344)).toBe(10.34);
      expect(roundHalfUp(0.1 + 0.2)).toBe(0.3);
    });

    it('should round half up to 0 decimals', () => {
      expect(roundHalfUp(10.5, 0)).toBe(11);
      expect(roundHalfUp(10.4, 0)).toBe(10);
    });

    it('should handle negative numbers', () => {
      expect(roundHalfUp(-10.345)).toBe(-10.35);
      expect(roundHalfUp(-10.344)).toBe(-10.34);
    });
  });

  describe('calculatePercentage', () => {
    it('should calculate correct percentage', () => {
      expect(calculatePercentage(30, 100)).toBe(30);
      expect(calculatePercentage(50, 200)).toBe(25);
    });

    it('should handle rounding in percentage', () => {
      expect(calculatePercentage(33.33, 100)).toBe(33.3);
      expect(calculatePercentage(16.66, 100)).toBe(16.7);
    });

    it('should return 0 when total is 0', () => {
      expect(calculatePercentage(10, 0)).toBe(0);
    });

    it('should handle negative values', () => {
      expect(calculatePercentage(-30, -100)).toBe(30);
      expect(calculatePercentage(30, -100)).toBe(30);
    });
  });

  describe('formatCurrency', () => {
    it('should format PLN in Polish locale', () => {
      const result = formatCurrency(1234.56, 'PLN', 'pl');
      expect(result).toContain('1');
      expect(result).toContain('zł');
    });

    it('should format negative amounts', () => {
      const result = formatCurrency(-500, 'PLN', 'pl');
      expect(result).toContain('500');
    });
  });

  describe('formatCompactCurrency', () => {
    it('should format thousands', () => {
      const result = formatCompactCurrency(12345, 'PLN', 'pl');
      expect(result).toContain('12,3');
      expect(result).toContain('tys');
    });

    it('should format millions', () => {
      const result = formatCompactCurrency(1234567, 'PLN', 'pl');
      expect(result).toContain('1,2');
      expect(result).toContain('mln');
    });

    it('should format small amounts normally', () => {
      const result = formatCompactCurrency(999, 'PLN', 'pl');
      expect(result).toContain('999');
    });

    it('should format in English locale', () => {
      const result = formatCompactCurrency(12345, 'PLN', 'en');
      expect(result).toContain('k');
    });
  });
});