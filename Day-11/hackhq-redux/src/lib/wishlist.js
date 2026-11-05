import { MAX_QUANTITY_PER_ITEM } from './cart.js';

/**
 * Pure wishlist helpers. The wishlist is just a list of product ids; the products themselves
 * come from the catalog, so a stale id (product removed from the catalog) is simply ignored.
 */

/** Add the id if missing, remove it if present. Unknown ids are rejected. */
export function toggleWishlistId(ids, productId, products) {
  const list = Array.isArray(ids) ? ids : [];
  if (list.includes(productId)) return list.filter((id) => id !== productId);
  if (!products.some((p) => p.id === productId)) return list;
  return [...list, productId];
}

/** Resolve ids to catalog products, in the order they were saved, skipping unknown ids */
export function getWishlistProducts(ids, products) {
  const byId = new Map(products.map((p) => [p.id, p]));
  return (Array.isArray(ids) ? ids : []).map((id) => byId.get(id)).filter(Boolean);
}

export function calculateWishlistTotal(wishlistProducts) {
  return wishlistProducts.reduce((sum, p) => sum + p.price, 0);
}

/** Which wishlist items can still be added to the cart (a line is capped at 10 per item) */
export function splitByCartCapacity(wishlistProducts, cart) {
  const addable = [];
  const blocked = [];
  for (const product of wishlistProducts) {
    const qty = cart.find((line) => line.productId === product.id)?.quantity ?? 0;
    (qty >= MAX_QUANTITY_PER_ITEM ? blocked : addable).push(product);
  }
  return { addable, blocked };
}
