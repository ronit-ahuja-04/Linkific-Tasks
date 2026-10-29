import { describe, it, expect } from 'vitest';
import {
  clampCount,
  calculateCapacityPercentage,
  getCapacityStatus,
  formatFlapDigits,
  parseCapacityInput,
} from '../src/lib/counter.js';

describe('Check-in counter pure logic (src/lib/counter.js)', () => {
  describe('clampCount', () => {
    it('clamps negative values to 0', () => {
      expect(clampCount(-5, 200)).toBe(0);
      expect(clampCount(-1, 50)).toBe(0);
    });

    it('clamps values exceeding capacity to capacity', () => {
      expect(clampCount(250, 200)).toBe(200);
      expect(clampCount(1001, 500)).toBe(500);
    });

    it('keeps valid values within range unchanged', () => {
      expect(clampCount(0, 200)).toBe(0);
      expect(clampCount(127, 200)).toBe(127);
      expect(clampCount(200, 200)).toBe(200);
    });

    it('handles non-numeric inputs gracefully', () => {
      expect(clampCount(NaN, 200)).toBe(0);
      expect(clampCount(null, 200)).toBe(0);
    });
  });

  describe('calculateCapacityPercentage', () => {
    it('calculates correct percentages', () => {
      expect(calculateCapacityPercentage(0, 200)).toBe(0);
      expect(calculateCapacityPercentage(100, 200)).toBe(50);
      expect(calculateCapacityPercentage(160, 200)).toBe(80);
      expect(calculateCapacityPercentage(200, 200)).toBe(100);
    });

    it('caps percentage at 100%', () => {
      expect(calculateCapacityPercentage(250, 200)).toBe(100);
    });

    it('handles invalid capacity or division by zero safely', () => {
      expect(calculateCapacityPercentage(50, 0)).toBe(0);
      expect(calculateCapacityPercentage(50, -10)).toBe(0);
      expect(calculateCapacityPercentage(-5, 100)).toBe(0);
    });
  });

  describe('getCapacityStatus', () => {
    it('returns "Plenty of room" below 80% threshold', () => {
      const status = getCapacityStatus(50, 200);
      expect(status.label).toBe('Plenty of room');
      expect(status.tone).toBe('normal');
    });

    it('returns "Nearly full" from 80% to 99%', () => {
      const status160 = getCapacityStatus(160, 200);
      expect(status160.label).toBe('Nearly full');
      expect(status160.tone).toBe('warning');

      const status199 = getCapacityStatus(199, 200);
      expect(status199.label).toBe('Nearly full');
      expect(status199.tone).toBe('warning');
    });

    it('returns "Full" when capacity is reached or exceeded', () => {
      const statusFull = getCapacityStatus(200, 200);
      expect(statusFull.label).toBe('Full');
      expect(statusFull.tone).toBe('alert');
    });
  });

  describe('formatFlapDigits', () => {
    it('pads single and double digit numbers to at least 3 digits', () => {
      expect(formatFlapDigits(0)).toEqual(['0', '0', '0']);
      expect(formatFlapDigits(7)).toEqual(['0', '0', '7']);
      expect(formatFlapDigits(42)).toEqual(['0', '4', '2']);
    });

    it('formats 3-digit and larger numbers properly', () => {
      expect(formatFlapDigits(127)).toEqual(['1', '2', '7']);
      expect(formatFlapDigits(1000)).toEqual(['1', '0', '0', '0']);
    });

    it('handles non-numeric edge cases without throwing', () => {
      expect(formatFlapDigits(null)).toEqual(['0', '0', '0']);
      expect(formatFlapDigits(-10)).toEqual(['0', '0', '0']);
    });
  });

  describe('parseCapacityInput', () => {
    it('validates and converts valid strings to integer capacity', () => {
      const res = parseCapacityInput('350', 200);
      expect(res.isValid).toBe(true);
      expect(res.value).toBe(350);
    });

    it('clamps values below 1 to 1 with an error message', () => {
      const res = parseCapacityInput('0', 200);
      expect(res.isValid).toBe(false);
      expect(res.value).toBe(1);
    });

    it('clamps values above 1000 to 1000 with an error message', () => {
      const res = parseCapacityInput('1500', 200);
      expect(res.isValid).toBe(false);
      expect(res.value).toBe(1000);
    });

    it('handles blank or non-numeric inputs safely using fallback', () => {
      const emptyRes = parseCapacityInput('', 200);
      expect(emptyRes.isValid).toBe(false);
      expect(emptyRes.value).toBe(200);

      const nanRes = parseCapacityInput('abc', 200);
      expect(nanRes.isValid).toBe(false);
      expect(nanRes.value).toBe(200);
    });
  });
});

