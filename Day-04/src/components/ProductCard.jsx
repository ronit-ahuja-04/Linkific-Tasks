import Card from './Card';
import Button from './Button';
import Badge from './Badge';
import './ProductCard.css';

/**
 * ProductCard component demonstrating:
 * - Complex props: `product` object containing strings, numbers, booleans, and an array (`tags`)
 * - Array props: rendering `product.tags` via `.map()` with unique string keys
 * - Component composition: using `Badge`, `Button`, and `Card`
 * - Function props: `onAddToCart` callback passing product object
 */
function ProductCard({
  product,
  onAddToCart,
}) {
  if (!product) return null;

  const {
    id,
    name = 'Developer Tool',
    category = 'General',
    price = 0,
    rating = 5.0,
    inStock = true,
    tags = [],
    description = '',
    image,
  } = product;

  const handleAddToCart = () => {
    if (!inStock) return;
    if (typeof onAddToCart === 'function') {
      onAddToCart(product);
    } else {
      alert(`Added "${name}" to your cart!`);
    }
  };

  return (
    <Card className={`product-card ${!inStock ? 'is-out-of-stock' : ''}`} elevation="md">
      {image && (
        <div className="product-media">
          <img src={image} alt={name} className="product-image" loading="lazy" />
          <div className="product-stock-badge-slot">
            <Badge
              tone={inStock ? 'success' : 'danger'}
              variant="solid"
            >
              {inStock ? 'In Stock' : 'Out of Stock'}
            </Badge>
          </div>
        </div>
      )}

      <div className="product-content">
        <div className="product-meta-row">
          <span className="product-category">{category}</span>
          <span className="product-rating">
            ⭐ {rating.toFixed(1)}
          </span>
        </div>

        <h4 className="product-title">{name}</h4>
        <p className="product-description">{description}</p>

        {Array.isArray(tags) && tags.length > 0 && (
          <div className="product-tags">
            {tags.map((tag) => (
              <span key={`${id}-${tag}`} className="product-tag-chip">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="product-footer">
        <div className="product-price-box">
          <span className="product-price-label">Price</span>
          <span className="product-price">${price}</span>
        </div>

        <Button
          variant={inStock ? 'primary' : 'outline'}
          size="sm"
          disabled={!inStock}
          onClick={handleAddToCart}
        >
          {inStock ? 'Add to Cart' : 'Sold Out'}
        </Button>
      </div>
    </Card>
  );
}

export default ProductCard;
