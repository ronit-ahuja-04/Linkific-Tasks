import { useState, useId } from 'react';
import { Link } from 'react-router-dom';
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
import { Badge, Eyebrow, PulseDot, buttonClass, cx } from '../ui.jsx';
import StateXray from '../StateXray.jsx';
import { SWAG_PRODUCTS } from '../../data/products.js';
import { productPath } from '../../lib/routes.js';
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

const PERF_TOP =
  'h-2 bg-[linear-gradient(135deg,transparent_75%,#faf8f1_75%),linear-gradient(225deg,transparent_75%,#faf8f1_75%)] bg-[length:12px_12px] bg-repeat-x';
const PERF_BOTTOM =
  'h-2 bg-[linear-gradient(45deg,transparent_75%,#faf8f1_75%),linear-gradient(315deg,transparent_75%,#faf8f1_75%)] bg-[length:12px_12px] bg-repeat-x';
const DIVIDER = 'my-3 border-t border-dashed border-neutral-400';
const QTY_BTN =
  'inline-flex size-6 items-center justify-center rounded-md border border-neutral-300 bg-white text-neutral-700 transition hover:bg-neutral-100 disabled:pointer-events-none disabled:opacity-40';

export default function SwagStation({ cart, setCart, xrayOn, onToggleXray, onNotify }) {
  // Cart line items (SW-2) now live in App so they survive list <-> detail navigation

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
    onNotify(`Order placed: ${orderItemCount} items, ${formattedTotal}`, null, 'success');
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
    <div>
      <header className="mb-8 animate-rise">
        <Eyebrow className="mb-3">
          Control room <span className="text-line">/</span> <span className="text-ink">SWAG</span>
        </Eyebrow>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold sm:text-4xl">Swag shop</h1>
            <Badge tone="good">
              <PulseDot />
              <span>Live</span>
            </Badge>
          </div>
          {/* Item count in header (SW-9) */}
          <div
            className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-sm"
            aria-label={`Cart contains ${totalItems} items`}
          >
            <ShoppingBag size={16} aria-hidden="true" />
            <span>
              Cart: <strong className="tabular-nums">{totalItems}</strong> items
            </span>
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-6">
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_400px]">
          {/* Products Ruled Catalog (SW-1) */}
          <div>
            <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
              <h2 className="text-xl font-bold sm:text-2xl">Merchandise Catalog</h2>
              <span className="font-mono text-xs uppercase tracking-wider text-muted">
                Sample prices for hackathon demo
              </span>
            </div>

            <ul
              className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface shadow-card"
              aria-label="Available merchandise"
            >
              {SWAG_PRODUCTS.map((product) => {
                const cartLine = cart.find((l) => l.productId === product.id);
                const currentQty = cartLine?.quantity || 0;
                const isMaxReached = currentQty >= MAX_QUANTITY_PER_ITEM;

                return (
                  <li
                    key={product.id}
                    className="flex flex-col gap-4 p-5 transition hover:bg-surface-2 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold">
                          <Link
                            to={productPath(product.id)}
                            className="underline-offset-4 hover:text-accent hover:underline focus-visible:underline"
                          >
                            {product.name}
                          </Link>
                        </h3>
                        <Badge tone="accent">{product.category}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted">{product.description}</p>
                    </div>

                    <div className="flex shrink-0 items-center justify-between gap-4 sm:justify-end">
                      <div className="font-display text-lg font-bold tabular-nums">
                        {formatCurrencyINR(product.price)}
                      </div>

                      <button
                        type="button"
                        className={buttonClass({ variant: 'secondary', size: 'sm' })}
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
          <div className="mx-auto w-full max-w-md lg:sticky lg:top-6 lg:max-w-none">
            <div
              className="animate-settle font-mono text-neutral-800 drop-shadow-xl"
              aria-label="Thermal Shopping Receipt"
            >
              {/* Perforated Sawtooth Top Edge */}
              <div className={PERF_TOP} aria-hidden="true" />

              <div className="bg-[#faf8f1] px-5 py-5 text-xs">
                {/* Receipt Header */}
                <div className="flex flex-col items-center gap-1 text-center">
                  <div className="flex items-center gap-2">
                    <Receipt size={20} aria-hidden="true" />
                    <span className="font-display text-lg font-bold tracking-widest">
                      HACKHQ STORE
                    </span>
                  </div>
                  <span className="text-[0.68rem] tracking-[0.2em] text-neutral-500">
                    OFFICIAL SWAG COUNTER
                  </span>
                  <div className="mt-2 flex w-full justify-between text-[0.68rem] tabular-nums text-neutral-500">
                    <span>ORD #{Date.now().toString().slice(-6)}</span>
                    <span>{new Date().toLocaleDateString('en-GB')}</span>
                  </div>
                </div>

                <div className={DIVIDER} />

                {/* Line Items */}
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-6 text-center text-neutral-500">
                    <ShoppingBag size={28} aria-hidden="true" />
                    <p>Nothing in the cart. Add something from the list.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3" aria-label="Cart items">
                    {cart.map((line) => {
                      const product = SWAG_PRODUCTS.find((p) => p.id === line.productId);
                      if (!product) return null;

                      const lineTotal = product.price * line.quantity;

                      return (
                        <div key={line.productId} className="flex animate-fade flex-col gap-1.5">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-sm font-semibold uppercase">{product.name}</span>
                            <button
                              type="button"
                              className="rounded-md p-1 text-neutral-400 transition hover:bg-red-100 hover:text-red-600"
                              onClick={() => handleRemoveLine(line.productId)}
                              title="Remove line item"
                              aria-label={`Remove ${product.name}`}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>

                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                className={QTY_BTN}
                                onClick={() => handleUpdateQuantity(line.productId, -1)}
                                title="Decrease quantity"
                                aria-label={`Decrease ${product.name} quantity`}
                              >
                                <Minus size={12} />
                              </button>
                              <span className="min-w-5 text-center font-semibold tabular-nums">
                                {line.quantity}
                              </span>
                              <button
                                type="button"
                                className={QTY_BTN}
                                onClick={() => handleUpdateQuantity(line.productId, 1)}
                                disabled={line.quantity >= MAX_QUANTITY_PER_ITEM}
                                title="Increase quantity"
                                aria-label={`Increase ${product.name} quantity`}
                              >
                                <Plus size={12} />
                              </button>
                              <span className="ml-1 text-neutral-500 tabular-nums">
                                @ {formatCurrencyINR(product.price)}
                              </span>
                            </div>

                            <span className="font-semibold tabular-nums">
                              {formatCurrencyINR(lineTotal)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className={DIVIDER} />

                {/* Coupon Entry Field (SW-6) */}
                <div>
                  {appliedCoupon ? (
                    <div className="flex items-center gap-2 rounded-lg border border-dashed border-emerald-600 bg-emerald-50 px-3 py-2 text-emerald-800">
                      <Tag size={14} aria-hidden="true" />
                      <span className="flex-1 font-semibold">
                        {appliedCoupon.code} (-{appliedCoupon.discountPct}%)
                      </span>
                      <button
                        type="button"
                        className="rounded-md p-1 transition hover:bg-emerald-200"
                        onClick={handleRemoveCoupon}
                        title="Remove coupon discount"
                        aria-label="Remove coupon"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleApplyCoupon}>
                      <label htmlFor={couponInputId} className="sr-only">
                        Coupon Code
                      </label>
                      <div className="flex gap-2">
                        <input
                          id={couponInputId}
                          type="text"
                          placeholder="Coupon (e.g. HACK10)"
                          value={couponInput}
                          onChange={(e) => {
                            setCouponInput(e.target.value);
                            if (couponError) setCouponError('');
                          }}
                          aria-invalid={couponError ? 'true' : undefined}
                          className={cx(
                            'min-w-0 flex-1 rounded-lg border bg-white px-3 py-2 text-xs uppercase text-neutral-900 placeholder:normal-case placeholder:text-neutral-400',
                            'focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-300',
                            couponError
                              ? 'border-red-500 ring-2 ring-red-100'
                              : 'border-neutral-300'
                          )}
                        />
                        <button
                          type="submit"
                          className="rounded-lg bg-neutral-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-neutral-700 disabled:pointer-events-none disabled:opacity-40"
                          disabled={!couponInput.trim()}
                        >
                          Apply
                        </button>
                      </div>
                      {couponError && (
                        <p
                          className="mt-1.5 flex items-center gap-1.5 text-[0.7rem] font-medium text-red-700"
                          role="alert"
                        >
                          <AlertCircle size={12} aria-hidden="true" />
                          <span>{couponError}</span>
                        </p>
                      )}
                    </form>
                  )}
                </div>

                <div className="my-3 border-t-4 border-double border-neutral-400" />

                {/* Summary Totals Breakdown (SW-5) */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between">
                    <span>Subtotal ({totalItems} items)</span>
                    <span className="tabular-nums">{formatCurrencyINR(subtotal)}</span>
                  </div>

                  {discount > 0 && (
                    <div className="flex justify-between font-semibold text-emerald-700">
                      <span>Discount ({appliedCoupon?.code})</span>
                      <span className="tabular-nums">-{formatCurrencyINR(discount)}</span>
                    </div>
                  )}

                  <div className="mt-1 flex items-baseline justify-between border-t border-neutral-800 pt-2">
                    <span className="text-sm font-bold tracking-wider">TOTAL AMOUNT</span>
                    <span className="font-display text-xl font-bold tabular-nums">
                      {formatCurrencyINR(total)}
                    </span>
                  </div>
                </div>

                {/* Place Order CTA (SW-8) */}
                <div className="mt-4">
                  <button
                    type="button"
                    className={buttonClass({ size: 'lg', className: 'w-full' })}
                    onClick={handlePlaceOrder}
                    disabled={cart.length === 0}
                    title={cart.length === 0 ? 'Add items to place order' : 'Submit order'}
                  >
                    <CreditCard size={18} aria-hidden="true" />
                    <span>Place Order</span>
                  </button>
                </div>

                <div className="mt-5 flex flex-col items-center gap-1" aria-hidden="true">
                  <div className="h-10 w-full bg-[repeating-linear-gradient(90deg,#1f2937_0,#1f2937_2px,transparent_2px,transparent_4px,#1f2937_4px,#1f2937_5px,transparent_5px,transparent_8px)]" />
                  <span className="text-[0.65rem] tracking-[0.25em] text-neutral-500">
                    HACKHQ-POS-{totalItems * 42}
                  </span>
                </div>
              </div>

              {/* Perforated Sawtooth Bottom Edge */}
              <div className={PERF_BOTTOM} aria-hidden="true" />
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
