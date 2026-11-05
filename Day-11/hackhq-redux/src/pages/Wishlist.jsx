import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader.jsx';
import { Badge, Button, Card, Grid, Muted, Stack } from '../components/ui.jsx';
import WishlistButton from '../components/WishlistButton.jsx';
import { formatCurrencyINR, MAX_QUANTITY_PER_ITEM } from '../lib/cart.js';
import { productPath } from '../lib/routes.js';
import { selectCartItems } from '../store/slices/cartSlice.js';
import {
  moveAllToCart,
  moveToCart,
  selectWishlistProducts,
  selectWishlistTotal,
  wishlistCleared,
  wishlistRemoved,
} from '../store/slices/wishlistSlice.js';
import { notify } from '../store/slices/toastsSlice.js';

const Summary = styled(Card)`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
  strong {
    font-family: ${({ theme }) => theme.fonts.mono};
    font-size: 1.25rem;
  }
`;
const Item = styled(Card)`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  height: 100%;
  h3 {
    margin: 0;
    font-size: 1.05rem;
    a {
      color: inherit;
      text-decoration: none;
      &:hover {
        color: ${({ theme }) => theme.colors.accent};
      }
    }
  }
  p {
    margin: 0;
  }
`;
const Top = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
`;
const Price = styled.p`
  font-family: ${({ theme }) => theme.fonts.mono};
  font-weight: 600;
`;
const Actions = styled.div`
  margin-top: auto;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;
const Empty = styled(Card)`
  text-align: center;
  padding: 3rem 1.5rem;
  svg {
    color: ${({ theme }) => theme.colors.muted};
  }
`;

export default function Wishlist() {
  // REDUX: derived data (products, total) comes from memoized selectors; the page only renders
  const products = useSelector(selectWishlistProducts);
  const total = useSelector(selectWishlistTotal);
  const cart = useSelector(selectCartItems);
  const dispatch = useDispatch();

  const atLimit = (id) =>
    (cart.find((line) => line.productId === id)?.quantity ?? 0) >= MAX_QUANTITY_PER_ITEM;

  return (
    <>
      <PageHeader breadcrumb="Wishlist" title="Your wishlist" pill={`${products.length} saved`}>
        Save swag while you browse, then move it to the cart when you are ready.
      </PageHeader>

      {products.length === 0 ? (
        <Empty>
          <Stack $align="center" $gap={3}>
            <Heart size={32} aria-hidden="true" />
            <h2>Nothing saved yet</h2>
            <Muted>Tap the heart on any product in the swag shop to save it here.</Muted>
            <Button as={Link} to="/swag">
              <ShoppingBag size={16} aria-hidden="true" />
              Browse the swag shop
            </Button>
          </Stack>
        </Empty>
      ) : (
        <>
          <Summary aria-label="Wishlist summary">
            <div>
              <Muted>
                {products.length} {products.length === 1 ? 'item' : 'items'} saved, worth
              </Muted>{' '}
              <strong>{formatCurrencyINR(total)}</strong>
            </div>
            <Stack $dir="row" $gap={2} $wrap>
              <Button onClick={() => dispatch(moveAllToCart())}>
                <ShoppingBag size={16} aria-hidden="true" />
                Move all to cart
              </Button>
              <Button
                $variant="danger"
                onClick={() => {
                  dispatch(wishlistCleared());
                  dispatch(notify('Wishlist cleared', null, 'info'));
                }}
              >
                <Trash2 size={16} aria-hidden="true" />
                Clear
              </Button>
            </Stack>
          </Summary>

          <Grid
            as="ul"
            $cols={{ base: 1, sm: 2, xl: 3 }}
            $gap={3}
            aria-label="Saved products"
            style={{ listStyle: 'none', padding: 0, margin: 0 }}
          >
            {products.map((product) => (
              <li key={product.id}>
                <Item>
                  <Top>
                    <Badge $tone="accent">{product.category}</Badge>
                    <WishlistButton productId={product.id} productName={product.name} />
                  </Top>
                  <h3>
                    <Link to={productPath(product.id)}>{product.name}</Link>
                  </h3>
                  <Muted as="p">{product.description}</Muted>
                  <Price>{formatCurrencyINR(product.price)}</Price>
                  <Actions>
                    <Button
                      $size="sm"
                      onClick={() => dispatch(moveToCart(product.id))}
                      disabled={atLimit(product.id)}
                      title={atLimit(product.id) ? 'Maximum 10 per item reached' : 'Move to cart'}
                    >
                      <ShoppingBag size={16} aria-hidden="true" />
                      {atLimit(product.id) ? 'Max 10 in cart' : 'Move to cart'}
                    </Button>
                    <Button
                      $size="sm"
                      $variant="ghost"
                      onClick={() => dispatch(wishlistRemoved(product.id))}
                      aria-label={`Remove ${product.name} from wishlist`}
                    >
                      Remove
                    </Button>
                  </Actions>
                </Item>
              </li>
            ))}
          </Grid>
        </>
      )}
    </>
  );
}
