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
import { findProduct, getAdjacentProducts, productPath } from '../../lib/routes.js';
import {
  addToCart,
  calculateTotalItemCount,
  formatCurrencyINR,
  MAX_QUANTITY_PER_ITEM,
} from '../../lib/cart.js';

const CATEGORY_VISUALS = {
  Stickers: { icon: Sticker, tone: 'violet' },
  Apparel: { icon: Shirt, tone: 'indigo' },
  Drinkware: { icon: CupSoda, tone: 'teal' },
  Hardware: { icon: Keyboard, tone: 'amber' },
  Accessories: { icon: Mouse, tone: 'rose' },
};

/**
 * CONCEPT: Dynamic segment - "/swag/:productId" renders this page for every product.
 * useParams reads the id from the URL; the catalog lookup happens during render.
 */
export default function ProductDetail({ cart, setCart, onNotify }) {
  const { productId } = useParams();
  const product = findProduct(productId);

  if (!product) {
    return (
      <div className="station-view product-view">
        <PageHeader breadcrumb={`SWAG / ${productId}`} title="Product not found">
          <RouteBadge pattern="/swag/:productId" />
        </PageHeader>
        <div className="live-card">
          <div className="live-empty-box" role="alert">
            <PackageSearch size={36} aria-hidden="true" />
            <div className="live-empty-title">Nothing on the shelf called “{productId}”</div>
            <div className="live-empty-desc">
              The route matched, but no product has this id. That is a data miss, not a 404.
            </div>
            <Link to="/swag" className="btn btn-primary">
              Browse the swag shop
            </Link>
          </div>
        </div>
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
    <div className="station-view product-view">
      <PageHeader breadcrumb={`SWAG / ${product.id}`} title={product.category}>
        <RouteBadge pattern="/swag/:productId" />
      </PageHeader>

      {/* key: same route, new product -> remount so the entrance animation replays */}
      <section key={product.id} className="product-hero" aria-labelledby="product-title">
        <div className={`product-visual tone-${visual.tone}`} aria-hidden="true">
          <div className="product-visual-ring ring-1" />
          <div className="product-visual-ring ring-2" />
          <div className="product-visual-icon">
            <Icon size={96} strokeWidth={1.4} />
          </div>
          <span className="product-visual-index tabular-nums">
            {String(index + 1).padStart(2, '0')} / {String(count).padStart(2, '0')}
          </span>
        </div>

        <div className="product-info">
          <span className="product-category-tag">{product.category}</span>
          <h2 id="product-title" className="product-hero-title">
            {product.name}
          </h2>
          <p className="product-hero-desc">{product.description}</p>
          <p className="product-hero-price tabular-nums">{formatCurrencyINR(product.price)}</p>

          <dl className="product-specs">
            <div>
              <dt>SKU</dt>
              <dd>
                <code>{product.id}</code>
              </dd>
            </div>
            <div>
              <dt>In your cart</dt>
              <dd className="tabular-nums">{quantityInCart}</dd>
            </div>
            <div>
              <dt>Pickup</dt>
              <dd>Swag desk, Hall B</dd>
            </div>
          </dl>
        </div>
      </section>

      <nav className="product-pager" aria-label="Browse products">
        <Link to={productPath(previous.id)} className="product-pager-link prev">
          <ChevronLeft size={18} aria-hidden="true" />
          <span>
            <small>Previous</small>
            {previous.name}
          </span>
        </Link>
        <Link to={productPath(next.id)} className="product-pager-link next">
          <span>
            <small>Next</small>
            {next.name}
          </span>
          <ChevronRight size={18} aria-hidden="true" />
        </Link>
      </nav>

      <div className="product-sticky-bar">
        <div className="product-sticky-meta">
          <strong>{product.name}</strong>
          <span className="tabular-nums">{formatCurrencyINR(product.price)}</span>
        </div>
        <Link to="/swag" className="product-sticky-cart" aria-label={`Cart: ${totalItems} items`}>
          <ShoppingBag size={16} aria-hidden="true" />
          <span className="tabular-nums">{totalItems}</span>
        </Link>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleAddToCart}
          disabled={isMaxReached}
        >
          <Plus size={16} aria-hidden="true" />
          <span>{isMaxReached ? 'Max 10 reached' : 'Add to cart'}</span>
        </button>
      </div>
    </div>
  );
}
