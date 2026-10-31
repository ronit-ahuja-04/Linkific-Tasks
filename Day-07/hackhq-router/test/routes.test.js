import { describe, it, expect } from 'vitest';
import {
  productPath,
  userPath,
  findProduct,
  getAdjacentProducts,
  parseUserId,
} from '../src/lib/routes.js';

const PRODUCTS = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];

describe('Route helpers (src/lib/routes.js)', () => {
  it('builds absolute product and user paths', () => {
    expect(productPath('swag-tee')).toBe('/swag/swag-tee');
    expect(userPath(7)).toBe('/directory/7');
  });

  it('finds a product by id and returns null for unknown ids', () => {
    expect(findProduct('b', PRODUCTS)).toEqual({ id: 'b' });
    expect(findProduct('nope', PRODUCTS)).toBeNull();
    expect(findProduct(undefined, PRODUCTS)).toBeNull();
  });

  it('finds the real catalog by default', () => {
    expect(findProduct('swag-tee')?.category).toBe('Apparel');
  });

  it('returns previous and next products, wrapping at both ends', () => {
    expect(getAdjacentProducts('a', PRODUCTS)).toEqual({
      index: 0,
      count: 3,
      previous: { id: 'c' },
      next: { id: 'b' },
    });
    expect(getAdjacentProducts('c', PRODUCTS).next).toEqual({ id: 'a' });
    expect(getAdjacentProducts('nope', PRODUCTS)).toBeNull();
  });

  it('parses valid userId params into positive integers', () => {
    expect(parseUserId('1')).toBe(1);
    expect(parseUserId('208')).toBe(208);
  });

  it('rejects missing or invalid userId params', () => {
    expect(parseUserId(undefined)).toBeNull();
    expect(parseUserId('')).toBeNull();
    expect(parseUserId('abc')).toBeNull();
    expect(parseUserId('0')).toBeNull();
    expect(parseUserId('-3')).toBeNull();
    expect(parseUserId('2.5')).toBeNull();
    expect(parseUserId('7abc')).toBeNull();
  });
});
