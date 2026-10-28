import ProductCard from './ProductCard';
import EmptyState from './EmptyState';
import Button from './Button';
import './ProductList.css';

/**
 * ProductList component demonstrating:
 * - Conditional rendering: branches between populated grid and `EmptyState`
 * - List rendering with `.map()` using stable unique keys (`key={product.id}`)
 * - Function prop passing down to child `ProductCard` components
 * - Action slot passed to `EmptyState` for interactive recovery
 */
function ProductList({
  products = [],
  onAddToCart,
  onResetFilter,
}) {
  const isEmpty = !Array.isArray(products) || products.length === 0;

  if (isEmpty) {
    return (
      <EmptyState
        icon="🛍️"
        title="No Products Available"
        message="We could not find any products in this catalog. Try refreshing or clearing your filters."
        action={
          onResetFilter ? (
            <Button variant="primary" size="sm" onClick={onResetFilter}>
              Reset Catalog Filter
            </Button>
          ) : undefined
        }
      />
    );
  }

  return (
    <div className="product-list-container">
      <div className="product-list-grid">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={onAddToCart}
          />
        ))}
      </div>
    </div>
  );
}

export default ProductList;
