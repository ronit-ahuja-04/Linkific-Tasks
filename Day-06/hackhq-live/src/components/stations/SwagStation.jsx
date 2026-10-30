import { useState, useId } from 'react';
import {
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  Tag,
  Receipt,
  AlertCircle,
  X,
  CreditCard,
} from 'lucide-react';
import StateXray from '../StateXray.jsx';
import { SWAG_PRODUCTS } from '../../data/products.js';
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
} from '../../lib/cart.js';

export default function SwagStation({ xrayOn, onToggleXray, onNotify }) {
  // Cart line items array state (SW-2)
  const [cart, setCart] = useState([]);

  // Controlled coupon input state & applied coupon object (SW-6)
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');

  const couponInputId = useId();

  // Pure derived calculations during render (SW-5, zero totals stored in state)
  const totalItems = calculateTotalItemCount(cart);
  const subtotal = calculateSubtotal(cart, SWAG_PRODUCTS);
  const discount = calculateDiscount(subtotal, appliedCoupon);
  const total = calculateTotal(subtotal, discount);

  // Cart Handlers
  const handleAddToCart = (productId) => {
    setCart((prev) => addToCart(prev, productId));
    const product = SWAG_PRODUCTS.find((p) => p.id === productId);
    onNotify(`Added ${product?.name || 'item'} to cart`, null, 'info');
  };

  const handleUpdateQuantity = (productId, delta) => {
    setCart((prev) => updateCartQuantity(prev, productId, delta));
  };

  const handleRemoveLine = (productId) => {
    setCart((prev) => removeFromCart(prev, productId));
    onNotify('Item removed from cart', null, 'info');
  };

  // Coupon Handlers (SW-6)
  const handleApplyCoupon = (e) => {
    e.preventDefault();
    const result = validateCoupon(couponInput);

    if (!result.isValid) {
      setCouponError(result.message || 'Invalid coupon code');
      return;
    }

    setAppliedCoupon(result.coupon);
    setCouponError('');
    setCouponInput('');
    onNotify(`Coupon ${result.coupon.code} applied (10% off)!`, null, 'success');
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError('');
    onNotify('Coupon removed', null, 'info');
  };

  // Checkout Action (SW-8)
  const handlePlaceOrder = () => {
    if (cart.length === 0) return;

    const formattedTotal = formatCurrencyINR(total);
    const orderItemCount = totalItems;

    setCart([]);
    setAppliedCoupon(null);
    onNotify(
      `Order placed: ${orderItemCount} items, ${formattedTotal}`,
      null,
      'success'
    );
  };

  const statePayload = {
    totalItems,
    subtotal,
    discount,
    total,
    appliedCoupon,
    cartLinesCount: cart.length,
    cart,
  };

  return (
    <div className="station-view station-swag">
      <div className="station-breadcrumb">CONTROL ROOM / SWAG</div>

      <div className="station-header">
        <div className="station-title-row">
          <h1 className="station-title">Swag shop</h1>
          <span className="live-status-pill">
            <span className="pulse-dot" aria-hidden="true" />
            <span>Live</span>
          </span>
        </div>
        {/* Item count in header (SW-9) */}
        <div className="station-header-actions">
          <div className="cart-badge-pill" aria-label={`Cart contains ${totalItems} items`}>
            <ShoppingBag size={16} aria-hidden="true" />
            <span className="cart-badge-text">
              Cart: <strong className="tabular-nums">{totalItems}</strong> items
            </span>
          </div>
        </div>
      </div>

      <div className="station-layout swag-station-layout">
        <div className="station-workspace">

          <div className="swag-catalog-receipt-grid">
            {/* Products Ruled Catalog (SW-1) */}
            <div className="swag-products-column">
              <div className="column-heading-wrap">
                <h2 className="catalog-heading">Merchandise Catalog</h2>
                <span className="sample-disclaimer">Sample prices for hackathon demo</span>
              </div>

              <ul className="products-ruled-list" aria-label="Available merchandise">
                {SWAG_PRODUCTS.map((product) => {
                  const cartLine = cart.find((l) => l.productId === product.id);
                  const currentQty = cartLine?.quantity || 0;
                  const isMaxReached = currentQty >= MAX_QUANTITY_PER_ITEM;

                  return (
                    <li key={product.id} className="product-ruled-item">
                      <div className="product-info-block">
                        <div className="product-name-row">
                          <h3 className="product-name">{product.name}</h3>
                          <span className="product-category-tag">{product.category}</span>
                        </div>
                        <p className="product-description">{product.description}</p>
                      </div>

                      <div className="product-pricing-action">
                        <div className="product-price tabular-nums">
                          {formatCurrencyINR(product.price)}
                        </div>

                        <button
                          type="button"
                          className="btn btn-add-swag"
                          onClick={() => handleAddToCart(product.id)}
                          disabled={isMaxReached}
                          title={isMaxReached ? 'Maximum 10 per item reached' : 'Add to cart'}
                          aria-label={`Add ${product.name} to cart`}
                        >
                          <Plus size={16} aria-hidden="true" />
                          <span>{isMaxReached ? 'Max 10' : 'Add'}</span>
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Thermal Receipt Shopping Cart (SW-8) */}
            <div className="swag-receipt-column">
              <div className="thermal-receipt-card" aria-label="Thermal Shopping Receipt">
                {/* Perforated Sawtooth Top Edge */}
                <div className="receipt-perforation-edge top" aria-hidden="true" />

                <div className="receipt-inner">
                  {/* Receipt Header */}
                  <div className="receipt-header-banner">
                    <div className="receipt-logo">
                      <Receipt size={20} aria-hidden="true" />
                      <span className="receipt-brand">HACKHQ STORE</span>
                    </div>
                    <span className="receipt-subtitle">OFFICIAL SWAG COUNTER</span>
                    <div className="receipt-date-row tabular-nums">
                      <span>ORD #{Date.now().toString().slice(-6)}</span>
                      <span>{new Date().toLocaleDateString('en-GB')}</span>
                    </div>
                  </div>

                  <div className="receipt-divider" />

                  {/* Line Items */}
                  {cart.length === 0 ? (
                    <div className="receipt-empty-state">
                      <ShoppingBag size={28} className="receipt-empty-icon" aria-hidden="true" />
                      <p className="receipt-empty-text">
                        Nothing in the cart. Add something from the list.
                      </p>
                    </div>
                  ) : (
                    <div className="receipt-items-list" aria-label="Cart items">
                      {cart.map((line) => {
                        const product = SWAG_PRODUCTS.find((p) => p.id === line.productId);
                        if (!product) return null;

                        const lineTotal = product.price * line.quantity;

                        return (
                          <div key={line.productId} className="receipt-line-item">
                            <div className="receipt-item-title-row">
                              <span className="receipt-item-name">{product.name}</span>
                              <button
                                type="button"
                                className="btn-receipt-remove"
                                onClick={() => handleRemoveLine(line.productId)}
                                title="Remove line item"
                                aria-label={`Remove ${product.name}`}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>

                            <div className="receipt-item-pricing-row">
                              <div className="receipt-qty-controls">
                                <button
                                  type="button"
                                  className="btn-qty-step"
                                  onClick={() => handleUpdateQuantity(line.productId, -1)}
                                  title="Decrease quantity"
                                  aria-label={`Decrease ${product.name} quantity`}
                                >
                                  <Minus size={12} />
                                </button>
                                <span className="receipt-qty-count tabular-nums">
                                  {line.quantity}
                                </span>
                                <button
                                  type="button"
                                  className="btn-qty-step"
                                  onClick={() => handleUpdateQuantity(line.productId, 1)}
                                  disabled={line.quantity >= MAX_QUANTITY_PER_ITEM}
                                  title="Increase quantity"
                                  aria-label={`Increase ${product.name} quantity`}
                                >
                                  <Plus size={12} />
                                </button>
                                <span className="receipt-unit-price tabular-nums">
                                  @ {formatCurrencyINR(product.price)}
                                </span>
                              </div>

                              <span className="receipt-line-total tabular-nums">
                                {formatCurrencyINR(lineTotal)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="receipt-divider" />

                  {/* Coupon Entry Field (SW-6) */}
                  <div className="receipt-coupon-section">
                    {appliedCoupon ? (
                      <div className="applied-coupon-pill">
                        <Tag size={14} className="coupon-icon" aria-hidden="true" />
                        <span className="applied-code-name">
                          {appliedCoupon.code} (-{appliedCoupon.discountPct}%)
                        </span>
                        <button
                          type="button"
                          className="btn-remove-coupon"
                          onClick={handleRemoveCoupon}
                          title="Remove coupon discount"
                          aria-label="Remove coupon"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleApplyCoupon} className="coupon-entry-form">
                        <label htmlFor={couponInputId} className="sr-only">
                          Coupon Code
                        </label>
                        <div className="coupon-input-wrap">
                          <input
                            id={couponInputId}
                            type="text"
                            placeholder="Coupon (e.g. HACK10)"
                            value={couponInput}
                            onChange={(e) => {
                              setCouponInput(e.target.value);
                              if (couponError) setCouponError('');
                            }}
                            className={`coupon-input ${couponError ? 'coupon-input-error' : ''}`}
                          />
                          <button
                            type="submit"
                            className="btn btn-apply-coupon"
                            disabled={!couponInput.trim()}
                          >
                            Apply
                          </button>
                        </div>
                        {couponError && (
                          <p className="coupon-error-message" role="alert">
                            <AlertCircle size={12} aria-hidden="true" />
                            <span>{couponError}</span>
                          </p>
                        )}
                      </form>
                    )}
                  </div>

                  <div className="receipt-divider double" />

                  {/* Summary Totals Breakdown (SW-5) */}
                  <div className="receipt-totals-breakdown">
                    <div className="receipt-total-row">
                      <span>Subtotal ({totalItems} items)</span>
                      <span className="tabular-nums">{formatCurrencyINR(subtotal)}</span>
                    </div>

                    {discount > 0 && (
                      <div className="receipt-total-row discount-row">
                        <span>Discount ({appliedCoupon?.code})</span>
                        <span className="tabular-nums">-{formatCurrencyINR(discount)}</span>
                      </div>
                    )}

                    <div className="receipt-total-row grand-total-row">
                      <span className="grand-total-label">TOTAL AMOUNT</span>
                      <span className="grand-total-value tabular-nums">
                        {formatCurrencyINR(total)}
                      </span>
                    </div>
                  </div>

                  {/* Place Order CTA (SW-8) */}
                  <div className="receipt-action-wrap">
                    <button
                      type="button"
                      className="btn btn-primary btn-place-order"
                      onClick={handlePlaceOrder}
                      disabled={cart.length === 0}
                      title={cart.length === 0 ? 'Add items to place order' : 'Submit order'}
                    >
                      <CreditCard size={18} aria-hidden="true" />
                      <span>Place Order</span>
                    </button>
                  </div>

                  <div className="receipt-footer-barcode" aria-hidden="true">
                    <div className="receipt-barcode-lines" />
                    <span className="receipt-barcode-code">
                      HACKHQ-POS-{totalItems * 42}
                    </span>
                  </div>
                </div>

                {/* Perforated Sawtooth Bottom Edge */}
                <div className="receipt-perforation-edge bottom" aria-hidden="true" />
              </div>
            </div>
          </div>
        </div>

        <StateXray
          isOpen={xrayOn}
          stationName="Swag shop"
          statePayload={statePayload}
          onClose={onToggleXray}
        />
      </div>
    </div>
  );
}
