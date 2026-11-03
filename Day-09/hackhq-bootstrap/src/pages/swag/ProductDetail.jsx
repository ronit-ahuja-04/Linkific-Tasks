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
import { ListGroup, Row, Col } from 'react-bootstrap';
import { Badge, buttonClass, Card } from '../../components/ui.jsx';
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

const PAGER_LINK =
  'd-flex flex-fill align-items-center gap-3 rounded-4 border bg-body p-3 small fw-semibold text-body text-decoration-none';
const PAGER_LABEL =
  'd-block mb-1 font-monospace fw-medium text-uppercase ls-wide text-body-secondary';

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
          <div className="d-flex flex-wrap align-items-center gap-3">
            <BackButton fallback="/swag" />
            <RouteBadge pattern="/swag/:productId" />
          </div>
        </PageHeader>
        <Card>
          <div
            className="d-flex flex-column align-items-center gap-3 px-3 py-5 text-center"
            role="alert"
          >
            <PackageSearch size={36} className="text-body-secondary" aria-hidden="true" />
            <div className="fs-5 fw-bold">Nothing on the shelf called “{productId}”</div>
            <div className="small text-body-secondary" style={{ maxWidth: '28rem' }}>
              The route matched, but no product has this id. That is a data miss, not a 404.
            </div>
            <Link to="/swag" className={buttonClass({ className: 'mt-2' })}>
              Browse the swag shop
            </Link>
          </div>
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
        <div className="d-flex flex-wrap align-items-center gap-3">
          <BackButton fallback="/swag" />
          <RouteBadge pattern="/swag/:productId" />
        </div>
      </PageHeader>

      {/* key: same route, new product -> remount so the entrance animation replays */}
      <Row
        as="section"
        key={product.id}
        className="animate-rise g-4"
        aria-labelledby="product-title"
      >
        <Col xs={12} md={6}>
          <div
            className="position-relative d-flex align-items-center justify-content-center overflow-hidden rounded-4 text-white shadow ratio ratio-1x1"
            style={{ background: visual.gradient }}
            aria-hidden="true"
          >
            <div className="d-flex align-items-center justify-content-center">
              <div
                className="position-absolute rounded-circle border border-white border-opacity-25"
                style={{ width: '70%', height: '70%' }}
              />
              <div
                className="position-absolute rounded-circle border border-white border-opacity-10"
                style={{ width: '95%', height: '95%' }}
              />
              <div className="position-relative animate-float">
                <Icon size={96} strokeWidth={1.4} />
              </div>
              <span className="position-absolute bottom-0 end-0 m-3 rounded-pill bg-black bg-opacity-25 px-3 py-1 font-monospace small ls-wide">
                {String(index + 1).padStart(2, '0')} / {String(count).padStart(2, '0')}
              </span>
            </div>
          </div>
        </Col>

        <Col xs={12} md={6} className="d-flex flex-column justify-content-center gap-3">
          <div>
            <Badge tone="accent">{product.category}</Badge>
          </div>
          <h2 id="product-title" className="display-6 fw-bold mb-0">
            {product.name}
          </h2>
          <p className="fs-6 text-body-secondary mb-0">{product.description}</p>
          <p className="display-5 fw-bold font-monospace mb-0">
            {formatCurrencyINR(product.price)}
          </p>

          <ListGroup as="dl" className="mt-2 mb-0 rounded-4">
            <ListGroup.Item className="d-flex align-items-center justify-content-between gap-3">
              <dt className="font-monospace small fw-normal text-uppercase ls-wide text-body-secondary">
                SKU
              </dt>
              <dd className="mb-0 small fw-medium">
                <code>{product.id}</code>
              </dd>
            </ListGroup.Item>
            <ListGroup.Item className="d-flex align-items-center justify-content-between gap-3">
              <dt className="font-monospace small fw-normal text-uppercase ls-wide text-body-secondary">
                In your cart
              </dt>
              <dd className="mb-0 small fw-medium">
                <span className="font-monospace">{quantityInCart}</span>
              </dd>
            </ListGroup.Item>
            <ListGroup.Item className="d-flex align-items-center justify-content-between gap-3">
              <dt className="font-monospace small fw-normal text-uppercase ls-wide text-body-secondary">
                Pickup
              </dt>
              <dd className="mb-0 small fw-medium">Swag desk, Hall B</dd>
            </ListGroup.Item>
          </ListGroup>
        </Col>
      </Row>

      <nav className="mt-4 d-flex flex-column flex-sm-row gap-3" aria-label="Browse products">
        <Link to={productPath(previous.id)} className={PAGER_LINK}>
          <ChevronLeft size={18} className="text-body-secondary" aria-hidden="true" />
          <span>
            <small className={PAGER_LABEL}>Previous</small>
            {previous.name}
          </span>
        </Link>
        <Link
          to={productPath(next.id)}
          className={`${PAGER_LINK} justify-content-between text-end`}
        >
          <span>
            <small className={PAGER_LABEL}>Next</small>
            {next.name}
          </span>
          <ChevronRight size={18} className="text-body-secondary" aria-hidden="true" />
        </Link>
      </nav>

      <div
        className="sticky-bottom mt-4 d-flex align-items-center gap-3 rounded-4 border bg-body p-3 shadow"
        style={{ bottom: '0.75rem' }}
      >
        <div className="me-auto d-flex flex-column small" style={{ minWidth: 0 }}>
          <strong className="text-truncate fw-semibold">{product.name}</strong>
          <span className="font-monospace text-body-secondary">
            {formatCurrencyINR(product.price)}
          </span>
        </div>
        <Link
          to="/swag"
          className={buttonClass({ variant: 'secondary' })}
          aria-label={`Cart: ${totalItems} items`}
        >
          <ShoppingBag size={16} aria-hidden="true" />
          <span className="font-monospace">{totalItems}</span>
        </Link>
        <button
          type="button"
          className={buttonClass()}
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
