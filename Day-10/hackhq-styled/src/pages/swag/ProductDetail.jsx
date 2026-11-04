import { Link, useParams } from 'react-router-dom';
import {
  Sticker,
  Shirt,
  CupSoda,
  Keyboard,
  Mouse,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  PackageSearch,
  Plus,
} from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader.jsx';
import RouteBadge from '../../components/layout/RouteBadge.jsx';
import BackButton from '../../components/layout/BackButton.jsx';
import styled from 'styled-components';
import { Badge, Button, Card, Mono, Stack } from '../../components/ui.jsx';
import { animateRise, animateFloat } from '../../styles/animations.js';
import { findProduct, getAdjacentProducts, productPath } from '../../lib/routes.js';
import {
  addToCart,
  calculateTotalItemCount,
  formatCurrencyINR,
  MAX_QUANTITY_PER_ITEM,
} from '../../lib/cart.js';

const CATEGORY_VISUALS = {
  Stickers: { icon: Sticker, gradient: 'linear-gradient(135deg, #7c3aed, #6366f1)' },
  Apparel: { icon: Shirt, gradient: 'linear-gradient(135deg, #4f46e5, #0ea5e9)' },
  Drinkware: { icon: CupSoda, gradient: 'linear-gradient(135deg, #0d9488, #10b981)' },
  Hardware: { icon: Keyboard, gradient: 'linear-gradient(135deg, #d97706, #f43f5e)' },
  Accessories: { icon: Mouse, gradient: 'linear-gradient(135deg, #db2777, #7c3aed)' },
};

const HeaderTools = styled(Stack).attrs({ $dir: 'row', $gap: 3, $align: 'center', $wrap: true })``;

const NotFound = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.space(3)};
  padding: ${({ theme }) => `${theme.space(5)} ${theme.space(3)}`};
  text-align: center;
  svg {
    color: ${({ theme }) => theme.colors.muted};
  }
  strong {
    font-size: 1.25rem;
    font-weight: 700;
  }
  p {
    margin: 0;
    max-width: 28rem;
    font-size: 0.875rem;
    color: ${({ theme }) => theme.colors.muted};
  }
  a {
    margin-top: ${({ theme }) => theme.space(2)};
  }
`;

const Hero = styled.section`
  display: grid;
  gap: ${({ theme }) => theme.space(4)};
  grid-template-columns: minmax(0, 1fr);
  ${animateRise}
  ${({ theme }) => theme.media.up('md')} {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const Visual = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  aspect-ratio: 1 / 1;
  border-radius: 1rem;
  color: #fff;
  background: ${({ $gradient }) => $gradient};
  box-shadow: 0 0.5rem 1rem rgb(0 0 0 / 0.15);
`;
const Ring = styled.div`
  position: absolute;
  border-radius: 50%;
  width: ${({ $size }) => $size};
  height: ${({ $size }) => $size};
  border: 1px solid rgb(255 255 255 / ${({ $alpha }) => $alpha});
`;
const FloatIcon = styled.div`
  position: relative;
  ${animateFloat}
`;
const Counter = styled.span`
  position: absolute;
  bottom: 0;
  right: 0;
  margin: ${({ theme }) => theme.space(3)};
  padding: ${({ theme }) => `${theme.space(1)} ${theme.space(3)}`};
  border-radius: ${({ theme }) => theme.radii.pill};
  background: rgb(0 0 0 / 0.25);
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: 0.875rem;
  letter-spacing: 0.08em;
`;

const Info = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: ${({ theme }) => theme.space(3)};
  min-width: 0;
  h2 {
    margin: 0;
    font-size: 2.5rem;
    font-weight: 700;
  }
`;
const Description = styled.p`
  margin: 0;
  font-size: 1rem;
  color: ${({ theme }) => theme.colors.muted};
`;
const BigPrice = styled(Mono).attrs({ as: 'p' })`
  margin: 0;
  font-size: 3rem;
  font-weight: 700;
`;

const Facts = styled.dl`
  margin: ${({ theme }) => `${theme.space(2)} 0 0`};
  border: 1px solid ${({ theme }) => theme.colors.line};
  border-radius: 1rem;
  background: ${({ theme }) => theme.colors.surface};
  overflow: hidden;
  > div {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: ${({ theme }) => theme.space(3)};
    padding: ${({ theme }) => `${theme.space(2)} ${theme.space(3)}`};
  }
  > div + div {
    border-top: 1px solid ${({ theme }) => theme.colors.line};
  }
  dt {
    font-family: ${({ theme }) => theme.fonts.mono};
    font-size: 0.875rem;
    font-weight: 400;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: ${({ theme }) => theme.colors.muted};
  }
  dd {
    margin: 0;
    font-size: 0.875rem;
    font-weight: 500;
  }
`;

const Pager = styled.nav`
  margin-top: ${({ theme }) => theme.space(4)};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(3)};
  ${({ theme }) => theme.media.up('sm')} {
    flex-direction: row;
  }
`;
const PagerLink = styled(Link)`
  display: flex;
  flex: 1 1 auto;
  align-items: center;
  gap: ${({ theme }) => theme.space(3)};
  justify-content: ${({ $next }) => ($next ? 'space-between' : 'flex-start')};
  text-align: ${({ $next }) => ($next ? 'end' : 'start')};
  padding: ${({ theme }) => theme.space(3)};
  border: 1px solid ${({ theme }) => theme.colors.line};
  border-radius: 1rem;
  background: ${({ theme }) => theme.colors.surface};
  font-size: 0.875rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.ink};
  text-decoration: none;
  svg {
    color: ${({ theme }) => theme.colors.muted};
    flex-shrink: 0;
  }
  &:hover {
    border-color: ${({ theme }) => theme.colors.accent};
  }
`;
const PagerLabel = styled.small`
  display: block;
  margin-bottom: ${({ theme }) => theme.space(1)};
  font-family: ${({ theme }) => theme.fonts.mono};
  font-weight: 500;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: ${({ theme }) => theme.colors.muted};
`;

const StickyBar = styled.div`
  position: sticky;
  bottom: 0.75rem;
  margin-top: ${({ theme }) => theme.space(4)};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(3)};
  padding: ${({ theme }) => theme.space(3)};
  border: 1px solid ${({ theme }) => theme.colors.line};
  border-radius: 1rem;
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: 0 0.5rem 1rem rgb(0 0 0 / 0.15);
  z-index: 10;
`;
const BarInfo = styled.div`
  margin-right: auto;
  display: flex;
  flex-direction: column;
  font-size: 0.875rem;
  min-width: 0;
  strong {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 600;
  }
  span {
    font-family: ${({ theme }) => theme.fonts.mono};
    color: ${({ theme }) => theme.colors.muted};
  }
`;

/**
 * CONCEPT: Dynamic segment - "/swag/:productId" renders this page for every product.
 * useParams reads the id from the URL; the catalog lookup happens during render.
 */
export default function ProductDetail({ cart, setCart, onNotify }) {
  const { productId } = useParams();
  const product = findProduct(productId);

  if (!product) {
    return (
      <div>
        <PageHeader breadcrumb={`SWAG / ${productId}`} title="Product not found">
          <HeaderTools>
            <BackButton fallback="/swag" />
            <RouteBadge pattern="/swag/:productId" />
          </HeaderTools>
        </PageHeader>
        <Card>
          <NotFound role="alert">
            <PackageSearch size={36} aria-hidden="true" />
            <strong>Nothing on the shelf called “{productId}”</strong>
            <p>The route matched, but no product has this id. That is a data miss, not a 404.</p>
            <Button as={Link} to="/swag">
              Browse the swag shop
            </Button>
          </NotFound>
        </Card>
      </div>
    );
  }

  const { index, count, previous, next } = getAdjacentProducts(product.id);
  const visual = CATEGORY_VISUALS[product.category] ?? CATEGORY_VISUALS.Stickers;
  const Icon = visual.icon;

  const quantityInCart = cart.find((line) => line.productId === product.id)?.quantity ?? 0;
  const totalItems = calculateTotalItemCount(cart);
  const isMaxReached = quantityInCart >= MAX_QUANTITY_PER_ITEM;

  const handleAddToCart = () => {
    setCart((prev) => addToCart(prev, product.id));
    onNotify(`Added ${product.name} to cart`, null, 'success');
  };

  return (
    <div>
      <PageHeader breadcrumb={`SWAG / ${product.id}`} title={product.category}>
        <HeaderTools>
          <BackButton fallback="/swag" />
          <RouteBadge pattern="/swag/:productId" />
        </HeaderTools>
      </PageHeader>

      {/* key: same route, new product -> remount so the entrance animation replays */}
      <Hero key={product.id} aria-labelledby="product-title">
        <Visual $gradient={visual.gradient} aria-hidden="true">
          <Ring $size="70%" $alpha="0.25" />
          <Ring $size="95%" $alpha="0.1" />
          <FloatIcon>
            <Icon size={96} strokeWidth={1.4} />
          </FloatIcon>
          <Counter>
            {String(index + 1).padStart(2, '0')} / {String(count).padStart(2, '0')}
          </Counter>
        </Visual>

        <Info>
          <div>
            <Badge $tone="accent">{product.category}</Badge>
          </div>
          <h2 id="product-title">{product.name}</h2>
          <Description>{product.description}</Description>
          <BigPrice>{formatCurrencyINR(product.price)}</BigPrice>

          <Facts>
            <div>
              <dt>SKU</dt>
              <dd>
                <code>{product.id}</code>
              </dd>
            </div>
            <div>
              <dt>In your cart</dt>
              <dd>
                <Mono>{quantityInCart}</Mono>
              </dd>
            </div>
            <div>
              <dt>Pickup</dt>
              <dd>Swag desk, Hall B</dd>
            </div>
          </Facts>
        </Info>
      </Hero>

      <Pager aria-label="Browse products">
        <PagerLink to={productPath(previous.id)}>
          <ChevronLeft size={18} aria-hidden="true" />
          <span>
            <PagerLabel>Previous</PagerLabel>
            {previous.name}
          </span>
        </PagerLink>
        <PagerLink $next to={productPath(next.id)}>
          <span>
            <PagerLabel>Next</PagerLabel>
            {next.name}
          </span>
          <ChevronRight size={18} aria-hidden="true" />
        </PagerLink>
      </Pager>

      <StickyBar>
        <BarInfo>
          <strong>{product.name}</strong>
          <span>{formatCurrencyINR(product.price)}</span>
        </BarInfo>
        <Button as={Link} $variant="secondary" to="/swag" aria-label={`Cart: ${totalItems} items`}>
          <ShoppingBag size={16} aria-hidden="true" />
          <Mono>{totalItems}</Mono>
        </Button>
        <Button onClick={handleAddToCart} disabled={isMaxReached}>
          <Plus size={16} aria-hidden="true" />
          <span>{isMaxReached ? 'Max 10 reached' : 'Add to cart'}</span>
        </Button>
      </StickyBar>
    </div>
  );
}
