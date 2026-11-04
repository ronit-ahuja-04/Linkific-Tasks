import { describe, it, expect } from 'vitest';
import {
  calculateSubtotal,
  calculateDiscount,
  calculateTotal,
  calculateTotalItemCount,
  addToCart,
  updateCartQuantity,
  removeFromCart,
  validateCoupon,
  formatCurrencyINR,
  MAX_QUANTITY_PER_ITEM,
} from '../src/lib/cart.js';

describe('Swag Shop cart pure logic (src/lib/cart.js)', () => {
  const sampleProducts = [
    { id: 'p1', price: 100 },
    { id: 'p2', price: 500 },
    { id: 'p3', price: 1000 },
  ];

  describe('calculateSubtotal', () => {
    it('returns 0 for an empty cart', () => {
      expect(calculateSubtotal([], sampleProducts)).toBe(0);
      expect(calculateSubtotal(null, sampleProducts)).toBe(0);
    });

    it('correctly calculates subtotal with multiple line items', () => {
      const cart = [
        { productId: 'p1', quantity: 2 }, // 200
        { productId: 'p2', quantity: 1 }, // 500
      ];
      expect(calculateSubtotal(cart, sampleProducts)).toBe(700);
    });
  });

  describe('calculateDiscount & calculateTotal', () => {
    it('calculates 10% discount for HACK10 coupon', () => {
      const coupon = { code: 'HACK10', discountPct: 10 };
      const subtotal = 1000;
      const discount = calculateDiscount(subtotal, coupon);
      expect(discount).toBe(100);
      expect(calculateTotal(subtotal, discount)).toBe(900);
    });

    it('returns 0 discount when no coupon is applied', () => {
      expect(calculateDiscount(500, null)).toBe(0);
      expect(calculateTotal(500, 0)).toBe(500);
    });
  });

  describe('calculateTotalItemCount', () => {
    it('sums the quantities of all line items', () => {
      const cart = [
        { productId: 'p1', quantity: 3 },
        { productId: 'p2', quantity: 2 },
      ];
      expect(calculateTotalItemCount(cart)).toBe(5);
    });
  });

  describe('addToCart', () => {
    it('adds a new product line with quantity 1', () => {
      const initial = [];
      const updated = addToCart(initial, 'p1');
      expect(updated).toEqual([{ productId: 'p1', quantity: 1 }]);
    });

    it('increments quantity on an existing product line', () => {
      const initial = [{ productId: 'p1', quantity: 1 }];
      const updated = addToCart(initial, 'p1');
      expect(updated).toEqual([{ productId: 'p1', quantity: 2 }]);
    });

    it('caps quantity at MAX_QUANTITY_PER_ITEM (10)', () => {
      const initial = [{ productId: 'p1', quantity: MAX_QUANTITY_PER_ITEM }];
      const updated = addToCart(initial, 'p1');
      expect(updated[0].quantity).toBe(MAX_QUANTITY_PER_ITEM);
    });
  });

  describe('updateCartQuantity', () => {
    it('increments and decrements quantity within bounds', () => {
      const initial = [{ productId: 'p1', quantity: 2 }];
      const inc = updateCartQuantity(initial, 'p1', 1);
      expect(inc[0].quantity).toBe(3);

      const dec = updateCartQuantity(initial, 'p1', -1);
      expect(dec[0].quantity).toBe(1);
    });

    it('removes line item when decreasing from quantity 1 to 0 (SW-3)', () => {
      const initial = [
        { productId: 'p1', quantity: 1 },
        { productId: 'p2', quantity: 3 },
      ];
      const updated = updateCartQuantity(initial, 'p1', -1);
      expect(updated).toHaveLength(1);
      expect(updated[0].productId).toBe('p2');
    });
  });

  describe('removeFromCart', () => {
    it('removes target line item cleanly without mutating', () => {
      const initial = [
        { productId: 'p1', quantity: 2 },
        { productId: 'p2', quantity: 1 },
      ];
      const updated = removeFromCart(initial, 'p1');
      expect(updated).toEqual([{ productId: 'p2', quantity: 1 }]);
      expect(initial).toHaveLength(2); // Immutability verified
    });
  });

  describe('validateCoupon', () => {
    it('validates HACK10 coupon case-insensitively', () => {
      expect(validateCoupon('HACK10').isValid).toBe(true);
      expect(validateCoupon('hack10').isValid).toBe(true);
      expect(validateCoupon('  HACK10  ').isValid).toBe(true);
    });

    it('rejects invalid or blank coupon codes', () => {
      const invalid = validateCoupon('INVALID_CODE');
      expect(invalid.isValid).toBe(false);
      expect(invalid.message).toBe('That code is not valid. Try HACK10.');

      const empty = validateCoupon('');
      expect(empty.isValid).toBe(false);
    });
  });

  describe('formatCurrencyINR', () => {
    it('formats numbers with INR currency symbol and commas', () => {
      const formatted = formatCurrencyINR(1846);
      expect(formatted).toContain('1,846');
    });
  });
});
