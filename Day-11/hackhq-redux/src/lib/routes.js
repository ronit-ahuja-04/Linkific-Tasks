import { SWAG_PRODUCTS } from '../data/products.js';

/**
 * Pure route helpers. Every path is absolute ("/swag/...") so a link
 * means the same thing no matter which route renders it.
 */
export function productPath(productId) {
  return `/swag/${productId}`;
}

export function userPath(userId) {
  return `/directory/${userId}`;
}

/**
 * Looks up a product by its URL param. Returns null for unknown ids.
 */
export function findProduct(productId, products = SWAG_PRODUCTS) {
  return products.find((product) => product.id === productId) ?? null;
}

/**
 * Previous/next products for detail-page browsing, wrapping at both ends.
 * Returns null when the product is unknown.
 */
export function getAdjacentProducts(productId, products = SWAG_PRODUCTS) {
  const index = products.findIndex((product) => product.id === productId);
  if (index === -1) return null;

  const count = products.length;
  return {
    index,
    count,
    previous: products[(index - 1 + count) % count],
    next: products[(index + 1) % count],
  };
}

/**
 * URL params are always strings (or undefined). Converts a userId param
 * to a positive integer, or null when it is missing or not a valid id.
 */
export function parseUserId(param) {
  if (typeof param !== 'string' || !/^\d+$/.test(param)) return null;
  const id = Number(param);
  return id > 0 ? id : null;
}
