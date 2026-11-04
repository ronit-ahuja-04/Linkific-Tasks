/**
 * Pure functions for Swag Shop cart calculations & order logic (SW-2 to SW-6)
 */

export const MAX_QUANTITY_PER_ITEM = 10;
export const VALID_COUPONS = {
  HACK10: { code: 'HACK10', discountPct: 10, label: '10% Hackathon Discount' },
};

/**
 * Format number to INR currency string using Intl.NumberFormat
 * @param {number} amount
 * @returns {string}
 */
export function formatCurrencyINR(amount) {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(safeAmount);
}

/**
 * Pure computation of cart subtotal using Array.reduce (SW-5)
 * @param {Array<{ productId: string, quantity: number }>} cart
 * @param {Array<{ id: string, price: number }>} products
 * @returns {number}
 */
export function calculateSubtotal(cart, products) {
  if (!Array.isArray(cart) || cart.length === 0) return 0;
  const productMap = new Map((products || []).map((p) => [p.id, p.price]));

  return cart.reduce((accum, line) => {
    const price = productMap.get(line.productId) || 0;
    const qty = Math.max(0, line.quantity || 0);
    return accum + price * qty;
  }, 0);
}

/**
 * Pure computation of discount amount from coupon object
 * @param {number} subtotal
 * @param {{ discountPct: number } | null} appliedCoupon
 * @returns {number}
 */
export function calculateDiscount(subtotal, appliedCoupon) {
  if (!appliedCoupon || !Number.isFinite(appliedCoupon.discountPct) || subtotal <= 0) {
    return 0;
  }
  return Math.round(subtotal * (appliedCoupon.discountPct / 100));
}

/**
 * Pure computation of final total
 * @param {number} subtotal
 * @param {number} discount
 * @returns {number}
 */
export function calculateTotal(subtotal, discount) {
  return Math.max(0, (subtotal || 0) - (discount || 0));
}

/**
 * Pure computation of total items count in cart (SW-9)
 * @param {Array<{ quantity: number }>} cart
 * @returns {number}
 */
export function calculateTotalItemCount(cart) {
  if (!Array.isArray(cart)) return 0;
  return cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
}

/**
 * Immutable addition of a product to cart (SW-2)
 * Adds new line or increments up to MAX_QUANTITY_PER_ITEM
 * @param {Array} cart
 * @param {string} productId
 * @returns {Array}
 */
export function addToCart(cart, productId) {
  const safeCart = Array.isArray(cart) ? cart : [];
  const existingLine = safeCart.find((line) => line.productId === productId);

  if (!existingLine) {
    return [...safeCart, { productId, quantity: 1 }];
  }

  if (existingLine.quantity >= MAX_QUANTITY_PER_ITEM) {
    return safeCart; // Cap reached, cannot exceed max
  }

  return safeCart.map((line) =>
    line.productId === productId ? { ...line, quantity: line.quantity + 1 } : line
  );
}

/**
 * Immutable update of cart line item quantity (SW-3)
 * If quantity drops to 0 or below, removes line item automatically
 * @param {Array} cart
 * @param {string} productId
 * @param {number} delta (+1 or -1)
 * @returns {Array}
 */
export function updateCartQuantity(cart, productId, delta) {
  if (!Array.isArray(cart)) return [];

  return cart
    .map((line) => {
      if (line.productId !== productId) return line;
      const nextQty = line.quantity + delta;
      return nextQty > 0 ? { ...line, quantity: Math.min(MAX_QUANTITY_PER_ITEM, nextQty) } : null;
    })
    .filter(Boolean); // Auto-removes lines where nextQty <= 0
}

/**
 * Immutable removal of a line item from cart (SW-4)
 * @param {Array} cart
 * @param {string} productId
 * @returns {Array}
 */
export function removeFromCart(cart, productId) {
  if (!Array.isArray(cart)) return [];
  return cart.filter((line) => line.productId !== productId);
}

/**
 * Validate coupon code input (case-insensitive) (SW-6)
 * @param {string} rawCode
 * @returns {{ isValid: boolean, coupon?: object, message?: string }}
 */
export function validateCoupon(rawCode) {
  if (!rawCode || typeof rawCode !== 'string') {
    return { isValid: false, message: 'Please enter a coupon code.' };
  }

  const clean = rawCode.trim().toUpperCase();

  if (VALID_COUPONS[clean]) {
    return { isValid: true, coupon: VALID_COUPONS[clean] };
  }

  return { isValid: false, message: 'That code is not valid. Try HACK10.' };
}
