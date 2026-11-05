import { useState, useId } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
import styled from 'styled-components';
import {
  Alert,
  Badge,
  Button,
  Card,
  Eyebrow,
  Grid,
  Input,
  Mono,
  PulseDot,
  Stack,
  ErrorText,
} from '../ui.jsx';
import { animateRise, animateSettle, animateFade } from '../../styles/animations.js';
import ContentModal from '../ContentModal.jsx';
import StateXray from '../StateXray.jsx';
import { SWAG_PRODUCTS } from '../../data/products.js';
import { productPath } from '../../lib/routes.js';
import {
  calculateDiscount,
  calculateTotal,
  validateCoupon,
  formatCurrencyINR,
  MAX_QUANTITY_PER_ITEM,
} from '../../lib/cart.js';
import {
  addItem,
  changeQuantity,
  removeItem,
  clearCart,
  selectCartItems,
  selectCartCount,
  selectCartSubtotal,
} from '../../store/slices/cartSlice.js';
import { selectXrayOn, toggleXray } from '../../store/slices/uiSlice.js';
import { notify } from '../../store/slices/toastsSlice.js';

const Header = styled.header`
  margin-bottom: ${({ theme }) => theme.space(4)};
  ${animateRise}
`;
const Crumb = styled.span`
  color: ${({ theme }) => theme.colors.muted};
`;
const CrumbCurrent = styled.span`
  color: ${({ theme }) => theme.colors.ink};
`;
const HeaderRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space(3)};
`;
const TitleRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.space(3)};
  h1 {
    margin: 0;
    font-size: 2.5rem;
    font-weight: 700;
  }
`;
const CartPill = styled.div`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(2)};
  border-radius: ${({ theme }) => theme.radii.pill};
  border: 1px solid ${({ theme }) => theme.colors.line};
  background: ${({ theme }) => theme.colors.surface};
  padding: ${({ theme }) => `${theme.space(2)} ${theme.space(3)}`};
  font-size: 0.875rem;
`;
const Layout = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.space(4)};
  align-items: start;
  grid-template-columns: minmax(0, 1fr);
  ${({ theme }) => theme.media.up('lg')} {
    grid-template-columns: minmax(0, 7fr) minmax(0, 5fr);
  }
  ${({ theme }) => theme.media.up('xl')} {
    grid-template-columns: minmax(0, 8fr) minmax(0, 4fr);
  }
`;
const CatalogHead = styled.div`
  margin-bottom: ${({ theme }) => theme.space(3)};
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space(2)};
  h2 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 700;
  }
`;
const CatalogNote = styled.span`
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: ${({ theme }) => theme.colors.muted};
`;
const ProductGrid = styled(Grid).attrs({ as: 'ul' })`
  list-style: none;
  margin: 0;
  padding: 0;
`;
const ProductCard = styled(Card).attrs({ $padded: false })`
  height: 100%;
  display: flex;
  flex-direction: column;
`;
const ProductBody = styled.div`
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(2)};
  padding: ${({ theme }) => theme.space(4)};
  h3 {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
  }
  h3 a {
    color: ${({ theme }) => theme.colors.ink};
    text-decoration: none;
  }
  h3 a:hover {
    text-decoration: underline;
  }
`;
const ProductDesc = styled.p`
  margin: 0;
  flex-grow: 1;
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.muted};
`;
const Price = styled.div`
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 1.25rem;
  font-weight: 700;
`;
const ProductFooter = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.space(2)};
  padding: ${({ theme }) => `${theme.space(3)} ${theme.space(4)}`};
  border-top: 1px solid ${({ theme }) => theme.colors.line};
  > :last-child {
    margin-left: auto;
  }
`;
const CartCard = styled(Card).attrs({ $padded: false })`
  ${animateSettle}
  ${({ theme }) => theme.media.up('lg')} {
    position: sticky;
    top: 1rem;
  }
`;
const CartHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(2)};
  padding: ${({ theme }) => `${theme.space(3)} ${theme.space(4)}`};
  background: ${({ theme }) => theme.colors.surface2};
  border-bottom: 1px solid ${({ theme }) => theme.colors.line};
  border-radius: ${({ theme }) => `${theme.radii.lg} ${theme.radii.lg} 0 0`};
  font-weight: 700;
`;
const OrderMeta = styled.span`
  margin-left: auto;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.875rem;
  font-weight: 400;
  color: ${({ theme }) => theme.colors.muted};
`;
const EmptyCart = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.space(2)};
  padding: ${({ theme }) => `${theme.space(5)} ${theme.space(4)}`};
  text-align: center;
  color: ${({ theme }) => theme.colors.muted};
  p {
    margin: 0;
  }
`;
const Rows = styled.div`
  > * + * {
    border-top: 1px solid ${({ theme }) => theme.colors.line};
  }
`;
const CartLine = styled.div`
  padding: ${({ theme }) => `${theme.space(3)} ${theme.space(4)}`};
  ${animateFade}
`;
const LineTop = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space(2)};
  > span {
    font-weight: 600;
  }
`;
const LineBottom = styled.div`
  margin-top: ${({ theme }) => theme.space(2)};
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space(2)};
`;
const Qty = styled(Mono)`
  min-width: 1.5rem;
  text-align: center;
  font-weight: 600;
`;
const UnitPrice = styled(Mono)`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.muted};
`;
const LineTotal = styled(Mono)`
  font-weight: 600;
`;
const CartSection = styled.div`
  padding: ${({ theme }) => theme.space(4)};
  ${({ theme, $top }) => $top && `border-top: 1px solid ${theme.colors.line};`}
`;
const CouponAlert = styled(Alert).attrs({ $tone: 'good' })`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(2)};
  padding: ${({ theme }) => `${theme.space(2)} ${theme.space(3)}`};
  > span {
    flex-grow: 1;
    font-weight: 600;
  }
`;
const CouponGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  > ${Input} {
    flex: 1 1 auto;
    width: 1%;
    min-width: 0;
    text-transform: uppercase;
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
  }
  > ${Button} {
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
  }
`;
const CouponError = styled(ErrorText)`
  width: 100%;
  margin-top: ${({ theme }) => theme.space(1)};
`;
const HiddenLabel = styled.label`
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;
const TotalRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: ${({ $baseline }) => ($baseline ? 'baseline' : 'normal')};
  padding: ${({ theme }) => `${theme.space(3)} ${theme.space(4)}`};
  border-top: 1px solid ${({ theme }) => theme.colors.line};
  ${({ theme, $good }) =>
    $good && `font-weight: 600; background: ${theme.colors.goodSoft}; color: ${theme.colors.good};`}
`;
const TotalLabel = styled.span`
  font-weight: 700;
  letter-spacing: 0.08em;
`;
const TotalAmount = styled(Mono)`
  font-size: 1.5rem;
  font-weight: 700;
`;
const PosCode = styled.p`
  margin: ${({ theme }) => `${theme.space(3)} 0 0`};
  text-align: center;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.875rem;
  letter-spacing: 0.18em;
  color: ${({ theme }) => theme.colors.muted};
`;
const ModalBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(3)};
  p {
    margin: 0;
  }
`;
const ModalDesc = styled.p`
  color: ${({ theme }) => theme.colors.muted};
`;
const ModalPrice = styled.p`
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 1.75rem;
  font-weight: 700;
`;
const ModalSmall = styled.p`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.muted};
`;

export default function SwagStation() {
  // REDUX: useSelector subscribes this component to just these slices of state; the cart
  // lives in the store so it survives list <-> detail navigation. useDispatch sends actions.
  const cart = useSelector(selectCartItems);
  const totalItems = useSelector(selectCartCount);
  const subtotal = useSelector(selectCartSubtotal);
  const xrayOn = useSelector(selectXrayOn);
  const dispatch = useDispatch();
  const onNotify = (message, action, type) => dispatch(notify(message, action, type));

  // Controlled coupon input state & applied coupon object (SW-6)
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');

  const couponInputId = useId();

  // Product shown in the Quick view modal (null = closed)
  const [quickView, setQuickView] = useState(null);

  // Pure derived calculations during render (SW-5, zero totals stored in state)
  const discount = calculateDiscount(subtotal, appliedCoupon);
  const total = calculateTotal(subtotal, discount);

  // Cart Handlers
  const handleAddToCart = (productId) => {
    dispatch(addItem(productId));
    const product = SWAG_PRODUCTS.find((p) => p.id === productId);
    onNotify(`Added ${product?.name || 'item'} to cart`, null, 'info');
  };

  const handleUpdateQuantity = (productId, delta) => {
    dispatch(changeQuantity({ productId, delta }));
  };

  const handleRemoveLine = (productId) => {
    dispatch(removeItem(productId));
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

    dispatch(clearCart());
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
      <Header>
        <Eyebrow style={{ marginBottom: '0.75rem' }}>
          Control room <Crumb>/</Crumb> <CrumbCurrent>SWAG</CrumbCurrent>
        </Eyebrow>
        <HeaderRow>
          <TitleRow>
            <h1>Swag shop</h1>
            <Badge $tone="good">
              <PulseDot />
              <span>Live</span>
            </Badge>
          </TitleRow>
          {/* Item count in header (SW-9) */}
          <CartPill aria-label={`Cart contains ${totalItems} items`}>
            <ShoppingBag size={16} aria-hidden="true" />
            <span>
              Cart: <Mono as="strong">{totalItems}</Mono> items
            </span>
          </CartPill>
        </HeaderRow>
      </Header>

      <Layout>
        {/* Products catalog (SW-1) */}
        <div>
          <CatalogHead>
            <h2>Merchandise Catalog</h2>
            <CatalogNote>Sample prices for hackathon demo</CatalogNote>
          </CatalogHead>

          <ProductGrid
            $cols={{ base: 1, sm: 2, xl: 3 }}
            $gap={3}
            aria-label="Available merchandise"
          >
            {SWAG_PRODUCTS.map((product) => {
              const cartLine = cart.find((l) => l.productId === product.id);
              const currentQty = cartLine?.quantity || 0;
              const isMaxReached = currentQty >= MAX_QUANTITY_PER_ITEM;

              return (
                <li key={product.id}>
                  <ProductCard>
                    <ProductBody>
                      <div>
                        <Badge $tone="accent">{product.category}</Badge>
                      </div>
                      <h3>
                        <Link to={productPath(product.id)}>{product.name}</Link>
                      </h3>
                      <ProductDesc>{product.description}</ProductDesc>
                      <Price>{formatCurrencyINR(product.price)}</Price>
                    </ProductBody>
                    <ProductFooter>
                      <Button
                        $variant="secondary"
                        $size="sm"
                        onClick={() => setQuickView(product)}
                        aria-label={`Quick view ${product.name}`}
                      >
                        <Eye size={16} aria-hidden="true" />
                        <span>Quick view</span>
                      </Button>
                      <Button
                        $size="sm"
                        onClick={() => handleAddToCart(product.id)}
                        disabled={isMaxReached}
                        title={isMaxReached ? 'Maximum 10 per item reached' : 'Add to cart'}
                        aria-label={`Add ${product.name} to cart`}
                      >
                        <Plus size={16} aria-hidden="true" />
                        <span>{isMaxReached ? 'Max 10' : 'Add'}</span>
                      </Button>
                    </ProductFooter>
                  </ProductCard>
                </li>
              );
            })}
          </ProductGrid>
        </div>

        {/* Shopping cart (SW-8) */}
        <div>
          <CartCard aria-label="Shopping cart">
            <CartHeader>
              <Receipt size={18} aria-hidden="true" />
              <span>HACKHQ STORE</span>
              <OrderMeta>
                ORD #{Date.now().toString().slice(-6)} · {new Date().toLocaleDateString('en-GB')}
              </OrderMeta>
            </CartHeader>

            {/* Line Items */}
            {cart.length === 0 ? (
              <EmptyCart>
                <ShoppingBag size={28} aria-hidden="true" />
                <p>Nothing in the cart. Add something from the list.</p>
              </EmptyCart>
            ) : (
              <Rows aria-label="Cart items">
                {cart.map((line) => {
                  const product = SWAG_PRODUCTS.find((p) => p.id === line.productId);
                  if (!product) return null;

                  const lineTotal = product.price * line.quantity;

                  return (
                    <CartLine key={line.productId}>
                      <LineTop>
                        <span>{product.name}</span>
                        <Button
                          $variant="danger"
                          $size="sm"
                          style={{ padding: '0 0.25rem', border: 0 }}
                          onClick={() => handleRemoveLine(line.productId)}
                          title="Remove line item"
                          aria-label={`Remove ${product.name}`}
                        >
                          <Trash2 size={13} />
                        </Button>
                      </LineTop>
                      <LineBottom>
                        <Stack $dir="row" $gap={2} $align="center">
                          <Button
                            $variant="secondary"
                            $size="sm"
                            style={{ padding: '0.25rem 0.5rem' }}
                            onClick={() => handleUpdateQuantity(line.productId, -1)}
                            title="Decrease quantity"
                            aria-label={`Decrease ${product.name} quantity`}
                          >
                            <Minus size={12} />
                          </Button>
                          <Qty>{line.quantity}</Qty>
                          <Button
                            $variant="secondary"
                            $size="sm"
                            style={{ padding: '0.25rem 0.5rem' }}
                            onClick={() => handleUpdateQuantity(line.productId, 1)}
                            disabled={line.quantity >= MAX_QUANTITY_PER_ITEM}
                            title="Increase quantity"
                            aria-label={`Increase ${product.name} quantity`}
                          >
                            <Plus size={12} />
                          </Button>
                          <UnitPrice>@ {formatCurrencyINR(product.price)}</UnitPrice>
                        </Stack>
                        <LineTotal>{formatCurrencyINR(lineTotal)}</LineTotal>
                      </LineBottom>
                    </CartLine>
                  );
                })}
              </Rows>
            )}

            <CartSection $top>
              {/* Coupon Entry Field (SW-6) */}
              {appliedCoupon ? (
                <CouponAlert>
                  <Tag size={14} aria-hidden="true" />
                  <span>
                    {appliedCoupon.code} (-{appliedCoupon.discountPct}%)
                  </span>
                  <Button
                    $variant="ghost"
                    $size="sm"
                    style={{ padding: '0.25rem' }}
                    onClick={handleRemoveCoupon}
                    title="Remove coupon discount"
                    aria-label="Remove coupon"
                  >
                    <X size={13} />
                  </Button>
                </CouponAlert>
              ) : (
                <form onSubmit={handleApplyCoupon} noValidate>
                  <HiddenLabel htmlFor={couponInputId}>Coupon Code</HiddenLabel>
                  <CouponGroup>
                    <Input
                      id={couponInputId}
                      type="text"
                      placeholder="Coupon (e.g. HACK10)"
                      value={couponInput}
                      onChange={(e) => {
                        setCouponInput(e.target.value);
                        if (couponError) setCouponError('');
                      }}
                      $invalid={Boolean(couponError)}
                      aria-invalid={couponError ? 'true' : undefined}
                    />
                    <Button type="submit" $variant="dark" disabled={!couponInput.trim()}>
                      Apply
                    </Button>
                    {couponError && (
                      <CouponError role="alert">
                        <AlertCircle size={12} aria-hidden="true" /> <span>{couponError}</span>
                      </CouponError>
                    )}
                  </CouponGroup>
                </form>
              )}
            </CartSection>

            {/* Summary Totals Breakdown (SW-5) */}
            <div>
              <TotalRow>
                <span>Subtotal ({totalItems} items)</span>
                <Mono>{formatCurrencyINR(subtotal)}</Mono>
              </TotalRow>
              {discount > 0 && (
                <TotalRow $good>
                  <span>Discount ({appliedCoupon?.code})</span>
                  <Mono>-{formatCurrencyINR(discount)}</Mono>
                </TotalRow>
              )}
              <TotalRow $baseline>
                <TotalLabel>TOTAL AMOUNT</TotalLabel>
                <TotalAmount>{formatCurrencyINR(total)}</TotalAmount>
              </TotalRow>
            </div>

            {/* Place Order CTA (SW-8) */}
            <CartSection>
              <Button
                $size="lg"
                $block
                onClick={handlePlaceOrder}
                disabled={cart.length === 0}
                title={cart.length === 0 ? 'Add items to place order' : 'Submit order'}
              >
                <CreditCard size={18} aria-hidden="true" />
                <span>Place Order</span>
              </Button>
              <PosCode aria-hidden="true">HACKHQ-POS-{totalItems * 42}</PosCode>
            </CartSection>
          </CartCard>
        </div>
      </Layout>

      <div style={{ marginTop: '1.5rem' }}>
        <StateXray
          isOpen={xrayOn}
          stationName="Swag shop"
          statePayload={statePayload}
          onClose={() => dispatch(toggleXray())}
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
              <Button
                as={Link}
                $variant="secondary"
                to={productPath(quickView.id)}
                onClick={() => setQuickView(null)}
              >
                Full product page
              </Button>
              <Button onClick={() => handleAddToCart(quickView.id)} disabled={quickViewMaxed}>
                <Plus size={16} aria-hidden="true" />
                <span>{quickViewMaxed ? 'Max 10 reached' : 'Add to cart'}</span>
              </Button>
            </>
          )
        }
      >
        {quickView && (
          <ModalBody>
            <div>
              <Badge $tone="accent">{quickView.category}</Badge>
            </div>
            <ModalDesc>{quickView.description}</ModalDesc>
            <ModalPrice>{formatCurrencyINR(quickView.price)}</ModalPrice>
            <ModalSmall>
              In your cart: <strong>{quickViewQty}</strong>
            </ModalSmall>
          </ModalBody>
        )}
      </ContentModal>
    </div>
  );
}
