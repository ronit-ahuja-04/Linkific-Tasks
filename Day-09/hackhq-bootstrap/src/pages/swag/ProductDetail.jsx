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
import { Badge, cx, buttonClass, Card } from '../../components/ui.jsx';
import { findProduct, getAdjacentProducts, productPath } from '../../lib/routes.js';
import {
  addToCart,
  calculateTotalItemCount,
  formatCurrencyINR,
  MAX_QUANTITY_PER_ITEM,
} from '../../lib/cart.js';

const CATEGORY_VISUALS = {
  Stickers: { icon: Sticker, tone: 'from-violet-600 to-indigo-500 shadow-violet-600/40' },
  Apparel: { icon: Shirt, tone: 'from-indigo-600 to-sky-500 shadow-indigo-600/40' },
  Drinkware: { icon: CupSoda, tone: 'from-teal-600 to-emerald-500 shadow-teal-600/40' },
  Hardware: { icon: Keyboard, tone: 'from-amber-600 to-rose-500 shadow-amber-600/40' },
  Accessories: { icon: Mouse, tone: 'from-pink-600 to-violet-600 shadow-pink-600/40' },
};

const PAGER_LINK =
  'group flex flex-1 items-center gap-3 rounded-2xl border border-line bg-surface p-4 text-sm font-semibold text-ink transition hover:border-accent hover:bg-surface-2';
const PAGER_LABEL =
  'mb-0.5 block font-mono text-[0.68rem] font-medium uppercase tracking-wider text-muted';

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
          <div className="flex flex-wrap items-center gap-3">
            <BackButton fallback="/swag" />
            <RouteBadge pattern="/swag/:productId" />
          </div>
        </PageHeader>
        <Card>
          <div className="flex flex-col items-center gap-3 px-6 py-14 text-center" role="alert">
            <PackageSearch size={36} className="text-muted" aria-hidden="true" />
            <div className="font-display text-lg font-bold tracking-tight">
              Nothing on the shelf called “{productId}”
            </div>
            <div className="max-w-md text-sm text-muted">
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
        <div className="flex flex-wrap items-center gap-3">
          <BackButton fallback="/swag" />
          <RouteBadge pattern="/swag/:productId" />
        </div>
      </PageHeader>

      {/* key: same route, new product -> remount so the entrance animation replays */}
      <section
        key={product.id}
        className="grid animate-rise gap-6 md:grid-cols-2 md:gap-10"
        aria-labelledby="product-title"
      >
        <div
          className={cx(
            'relative flex aspect-square items-center justify-center overflow-hidden rounded-card bg-gradient-to-br text-white shadow-2xl md:aspect-[4/5]',
            visual.tone
          )}
          aria-hidden="true"
        >
          <div className="absolute size-[70%] rounded-full border border-white/25" />
          <div className="absolute size-[95%] rounded-full border border-white/15" />
          <div className="relative animate-float drop-shadow-lg">
            <Icon size={96} strokeWidth={1.4} />
          </div>
          <span className="absolute bottom-4 right-4 rounded-full bg-black/25 px-3 py-1 font-mono text-xs tabular-nums tracking-wider">
            {String(index + 1).padStart(2, '0')} / {String(count).padStart(2, '0')}
          </span>
        </div>

        <div className="flex flex-col justify-center gap-4">
          <Badge tone="accent" className="self-start">
            {product.category}
          </Badge>
          <h2 id="product-title" className="text-3xl font-bold tracking-tight sm:text-4xl">
            {product.name}
          </h2>
          <p className="max-w-prose text-base leading-relaxed text-muted">{product.description}</p>
          <p className="font-display text-4xl font-bold tracking-tight tabular-nums">
            {formatCurrencyINR(product.price)}
          </p>

          <dl className="mt-2 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
            <div className="flex items-center justify-between gap-4 px-4 py-3">
              <dt className="font-mono text-xs uppercase tracking-wider text-muted">SKU</dt>
              <dd className="text-sm font-medium text-ink">
                <code className="font-mono text-xs">{product.id}</code>
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4 px-4 py-3">
              <dt className="font-mono text-xs uppercase tracking-wider text-muted">
                In your cart
              </dt>
              <dd className="text-sm font-medium text-ink">
                <span className="tabular-nums">{quantityInCart}</span>
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4 px-4 py-3">
              <dt className="font-mono text-xs uppercase tracking-wider text-muted">Pickup</dt>
              <dd className="text-sm font-medium text-ink">Swag desk, Hall B</dd>
            </div>
          </dl>
        </div>
      </section>

      <nav className="mt-8 flex flex-col gap-3 sm:flex-row" aria-label="Browse products">
        <Link to={productPath(previous.id)} className={PAGER_LINK}>
          <ChevronLeft
            size={18}
            className="text-muted transition group-hover:-translate-x-0.5 group-hover:text-accent"
            aria-hidden="true"
          />
          <span>
            <small className={PAGER_LABEL}>Previous</small>
            {previous.name}
          </span>
        </Link>
        <Link to={productPath(next.id)} className={cx(PAGER_LINK, 'justify-between text-right')}>
          <span>
            <small className={PAGER_LABEL}>Next</small>
            {next.name}
          </span>
          <ChevronRight
            size={18}
            className="text-muted transition group-hover:translate-x-0.5 group-hover:text-accent"
            aria-hidden="true"
          />
        </Link>
      </nav>

      <div className="sticky bottom-3 z-20 mt-8 flex items-center gap-3 rounded-2xl border border-line bg-surface/90 p-3 shadow-pop backdrop-blur">
        <div className="mr-auto flex min-w-0 flex-col text-sm">
          <strong className="truncate font-semibold">{product.name}</strong>
          <span className="tabular-nums text-muted">{formatCurrencyINR(product.price)}</span>
        </div>
        <Link
          to="/swag"
          className={buttonClass({ variant: 'secondary' })}
          aria-label={`Cart: ${totalItems} items`}
        >
          <ShoppingBag size={16} aria-hidden="true" />
          <span className="tabular-nums">{totalItems}</span>
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
