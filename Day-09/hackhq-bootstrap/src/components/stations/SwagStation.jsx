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
  Eye,
  X,
  CreditCard,
} from 'lucide-react';
import { Row, Col, Card as BsCard, ListGroup, Form, InputGroup, Alert } from 'react-bootstrap';
import { Badge, Button, Eyebrow, PulseDot, buttonClass } from '../ui.jsx';
import ContentModal from '../ContentModal.jsx';
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

export default function SwagStation({ cart, setCart, xrayOn, onToggleXray, onNotify }) {
  // Cart line items (SW-2) now live in App so they survive list <-> detail navigation

  // Controlled coupon input state & applied coupon object (SW-6)
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');

  const couponInputId = useId();

  // Product shown in the Quick view modal (null = closed)
  const [quickView, setQuickView] = useState(null);

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

  const quickViewQty = quickView
    ? cart.find((l) => l.productId === quickView.id)?.quantity || 0
    : 0;
  const quickViewMaxed = quickViewQty >= MAX_QUANTITY_PER_ITEM;

  return (
    <div>
      <header className="mb-4 animate-rise">
        <Eyebrow className="mb-3">
          Control room <span className="text-body-tertiary">/</span>{' '}
          <span className="text-body">SWAG</span>
        </Eyebrow>
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div className="d-flex flex-wrap align-items-center gap-3">
            <h1 className="display-6 fw-bold mb-0">Swag shop</h1>
            <Badge tone="good">
              <PulseDot />
              <span>Live</span>
            </Badge>
          </div>
          {/* Item count in header (SW-9) */}
          <div
            className="d-inline-flex align-items-center gap-2 rounded-pill border bg-body px-3 py-2 small"
            aria-label={`Cart contains ${totalItems} items`}
          >
            <ShoppingBag size={16} aria-hidden="true" />
            <span>
              Cart: <strong className="font-monospace">{totalItems}</strong> items
            </span>
          </div>
        </div>
      </header>

      <Row className="g-4 align-items-start">
        {/* Products catalog (SW-1) */}
        <Col xs={12} lg={7} xl={8}>
          <div className="mb-3 d-flex flex-wrap align-items-end justify-content-between gap-2">
            <h2 className="fs-4 fw-bold mb-0">Merchandise Catalog</h2>
            <span className="font-monospace small text-uppercase ls-wide text-body-secondary">
              Sample prices for hackathon demo
            </span>
          </div>

          <Row
            as="ul"
            className="list-unstyled g-3 row-cols-1 row-cols-sm-2 row-cols-xl-3 mb-0"
            aria-label="Available merchandise"
          >
            {SWAG_PRODUCTS.map((product) => {
              const cartLine = cart.find((l) => l.productId === product.id);
              const currentQty = cartLine?.quantity || 0;
              const isMaxReached = currentQty >= MAX_QUANTITY_PER_ITEM;

              return (
                <Col as="li" key={product.id}>
                  <BsCard className="h-100 shadow-sm">
                    <BsCard.Body className="d-flex flex-column gap-2">
                      <div>
                        <Badge tone="accent">{product.category}</Badge>
                      </div>
                      <BsCard.Title as="h3" className="fs-6 fw-semibold mb-0">
                        <Link to={productPath(product.id)} className="text-body">
                          {product.name}
                        </Link>
                      </BsCard.Title>
                      <BsCard.Text className="small text-body-secondary flex-grow-1 mb-0">
                        {product.description}
                      </BsCard.Text>
                      <div className="fs-5 fw-bold font-monospace">
                        {formatCurrencyINR(product.price)}
                      </div>
                    </BsCard.Body>
                    <BsCard.Footer className="d-flex gap-2 bg-transparent">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setQuickView(product)}
                        aria-label={`Quick view ${product.name}`}
                      >
                        <Eye size={16} aria-hidden="true" />
                        <span>Quick view</span>
                      </Button>
                      <Button
                        size="sm"
                        className="ms-auto"
                        onClick={() => handleAddToCart(product.id)}
                        disabled={isMaxReached}
                        title={isMaxReached ? 'Maximum 10 per item reached' : 'Add to cart'}
                        aria-label={`Add ${product.name} to cart`}
                      >
                        <Plus size={16} aria-hidden="true" />
                        <span>{isMaxReached ? 'Max 10' : 'Add'}</span>
                      </Button>
                    </BsCard.Footer>
                  </BsCard>
                </Col>
              );
            })}
          </Row>
        </Col>

        {/* Shopping cart (SW-8) */}
        <Col xs={12} lg={5} xl={4}>
          <BsCard
            className="shadow-sm sticky-lg-top animate-settle"
            style={{ top: '1rem' }}
            aria-label="Shopping cart"
          >
            <BsCard.Header className="d-flex align-items-center gap-2 fw-bold">
              <Receipt size={18} aria-hidden="true" />
              <span>HACKHQ STORE</span>
              <span className="ms-auto small font-monospace fw-normal text-body-secondary">
                ORD #{Date.now().toString().slice(-6)} · {new Date().toLocaleDateString('en-GB')}
              </span>
            </BsCard.Header>

            {/* Line Items */}
            {cart.length === 0 ? (
              <BsCard.Body className="d-flex flex-column align-items-center gap-2 py-5 text-center text-body-secondary">
                <ShoppingBag size={28} aria-hidden="true" />
                <p className="mb-0">Nothing in the cart. Add something from the list.</p>
              </BsCard.Body>
            ) : (
              <ListGroup variant="flush" aria-label="Cart items">
                {cart.map((line) => {
                  const product = SWAG_PRODUCTS.find((p) => p.id === line.productId);
                  if (!product) return null;

                  const lineTotal = product.price * line.quantity;

                  return (
                    <ListGroup.Item key={line.productId} className="animate-fade">
                      <div className="d-flex align-items-start justify-content-between gap-2">
                        <span className="fw-semibold">{product.name}</span>
                        <Button
                          variant="danger"
                          size="sm"
                          className="py-0 px-1 border-0"
                          onClick={() => handleRemoveLine(line.productId)}
                          title="Remove line item"
                          aria-label={`Remove ${product.name}`}
                        >
                          <Trash2 size={13} />
                        </Button>
                      </div>
                      <div className="mt-2 d-flex flex-wrap align-items-center justify-content-between gap-2">
                        <div className="d-flex align-items-center gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="px-2 py-1"
                            onClick={() => handleUpdateQuantity(line.productId, -1)}
                            title="Decrease quantity"
                            aria-label={`Decrease ${product.name} quantity`}
                          >
                            <Minus size={12} />
                          </Button>
                          <span
                            className="fw-semibold font-monospace text-center"
                            style={{ minWidth: '1.5rem' }}
                          >
                            {line.quantity}
                          </span>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="px-2 py-1"
                            onClick={() => handleUpdateQuantity(line.productId, 1)}
                            disabled={line.quantity >= MAX_QUANTITY_PER_ITEM}
                            title="Increase quantity"
                            aria-label={`Increase ${product.name} quantity`}
                          >
                            <Plus size={12} />
                          </Button>
                          <span className="small text-body-secondary font-monospace">
                            @ {formatCurrencyINR(product.price)}
                          </span>
                        </div>
                        <span className="fw-semibold font-monospace">
                          {formatCurrencyINR(lineTotal)}
                        </span>
                      </div>
                    </ListGroup.Item>
                  );
                })}
              </ListGroup>
            )}

            <BsCard.Body className="border-top">
              {/* Coupon Entry Field (SW-6) */}
              {appliedCoupon ? (
                <Alert variant="success" className="d-flex align-items-center gap-2 py-2 px-3 mb-0">
                  <Tag size={14} aria-hidden="true" />
                  <span className="flex-grow-1 fw-semibold">
                    {appliedCoupon.code} (-{appliedCoupon.discountPct}%)
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-1"
                    onClick={handleRemoveCoupon}
                    title="Remove coupon discount"
                    aria-label="Remove coupon"
                  >
                    <X size={13} />
                  </Button>
                </Alert>
              ) : (
                <Form onSubmit={handleApplyCoupon} noValidate>
                  <Form.Label htmlFor={couponInputId} visuallyHidden>
                    Coupon Code
                  </Form.Label>
                  <InputGroup hasValidation>
                    <Form.Control
                      id={couponInputId}
                      type="text"
                      placeholder="Coupon (e.g. HACK10)"
                      value={couponInput}
                      onChange={(e) => {
                        setCouponInput(e.target.value);
                        if (couponError) setCouponError('');
                      }}
                      isInvalid={Boolean(couponError)}
                      aria-invalid={couponError ? 'true' : undefined}
                      className="text-uppercase"
                    />
                    <Button type="submit" variant="dark" disabled={!couponInput.trim()}>
                      Apply
                    </Button>
                    {couponError && (
                      <Form.Control.Feedback type="invalid" role="alert">
                        <AlertCircle size={12} aria-hidden="true" /> <span>{couponError}</span>
                      </Form.Control.Feedback>
                    )}
                  </InputGroup>
                </Form>
              )}
            </BsCard.Body>

            {/* Summary Totals Breakdown (SW-5) */}
            <ListGroup variant="flush">
              <ListGroup.Item className="d-flex justify-content-between">
                <span>Subtotal ({totalItems} items)</span>
                <span className="font-monospace">{formatCurrencyINR(subtotal)}</span>
              </ListGroup.Item>
              {discount > 0 && (
                <ListGroup.Item
                  variant="success"
                  className="d-flex justify-content-between fw-semibold"
                >
                  <span>Discount ({appliedCoupon?.code})</span>
                  <span className="font-monospace">-{formatCurrencyINR(discount)}</span>
                </ListGroup.Item>
              )}
              <ListGroup.Item className="d-flex align-items-baseline justify-content-between">
                <span className="fw-bold ls-wide">TOTAL AMOUNT</span>
                <span className="fs-4 fw-bold font-monospace">{formatCurrencyINR(total)}</span>
              </ListGroup.Item>
            </ListGroup>

            {/* Place Order CTA (SW-8) */}
            <BsCard.Body>
              <Button
                size="lg"
                className="w-100"
                onClick={handlePlaceOrder}
                disabled={cart.length === 0}
                title={cart.length === 0 ? 'Add items to place order' : 'Submit order'}
              >
                <CreditCard size={18} aria-hidden="true" />
                <span>Place Order</span>
              </Button>
              <p
                className="mt-3 mb-0 text-center small font-monospace text-body-secondary ls-wider"
                aria-hidden="true"
              >
                HACKHQ-POS-{totalItems * 42}
              </p>
            </BsCard.Body>
          </BsCard>
        </Col>
      </Row>

      <div className="mt-4">
        <StateXray
          isOpen={xrayOn}
          stationName="Swag shop"
          statePayload={statePayload}
          onClose={onToggleXray}
        />
      </div>

      {/* CONCEPT: one modal, content chosen by the quickView state */}
      <ContentModal
        show={quickView !== null}
        onHide={() => setQuickView(null)}
        title={quickView?.name}
        footer={
          quickView && (
            <>
              <Link
                to={productPath(quickView.id)}
                className={buttonClass({ variant: 'secondary' })}
                onClick={() => setQuickView(null)}
              >
                Full product page
              </Link>
              <Button onClick={() => handleAddToCart(quickView.id)} disabled={quickViewMaxed}>
                <Plus size={16} aria-hidden="true" />
                <span>{quickViewMaxed ? 'Max 10 reached' : 'Add to cart'}</span>
              </Button>
            </>
          )
        }
      >
        {quickView && (
          <div className="d-flex flex-column gap-3">
            <div>
              <Badge tone="accent">{quickView.category}</Badge>
            </div>
            <p className="mb-0 text-body-secondary">{quickView.description}</p>
            <p className="fs-3 fw-bold font-monospace mb-0">{formatCurrencyINR(quickView.price)}</p>
            <p className="small text-body-secondary mb-0">
              In your cart: <strong>{quickViewQty}</strong>
            </p>
          </div>
        )}
      </ContentModal>
    </div>
  );
}
