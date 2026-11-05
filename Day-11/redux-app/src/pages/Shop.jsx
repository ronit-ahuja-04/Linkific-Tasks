import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { formatPrice } from '../lib/api.js';
import { addToCart, makeSelectQuantity, MAX_PER_ITEM } from '../store/slices/cartSlice.js';
import {
  fetchProducts,
  selectProducts,
  selectProductsError,
  selectProductsStatus,
  selectProductsTotal,
} from '../store/slices/productsSlice.js';

function ProductCard({ product }) {
  const dispatch = useDispatch();
  // A selector factory: each card subscribes only to its own quantity, so adding one product
  // does not re-render the other cards
  const quantity = useSelector(useMemo(() => makeSelectQuantity(product.id), [product.id]));
  const atMax = quantity >= MAX_PER_ITEM;

  return (
    <li className="product">
      <img src={product.thumbnail} alt="" loading="lazy" />
      <h3>{product.title}</h3>
      <p className="muted small">{product.category} · ★ {product.rating}</p>
      <div className="row between">
        <strong>{formatPrice(product.price)}</strong>
        <button className="btn primary" onClick={() => dispatch(addToCart(product))} disabled={atMax}>
          {atMax ? 'Max 10' : quantity ? `Add (${quantity} in cart)` : 'Add to cart'}
        </button>
      </div>
    </li>
  );
}

export default function Shop() {
  const dispatch = useDispatch();
  const products = useSelector(selectProducts);
  const status = useSelector(selectProductsStatus);
  const error = useSelector(selectProductsError);
  const total = useSelector(selectProductsTotal);
  const [input, setInput] = useState('');
  const [query, setQuery] = useState('');

  // Fetch on mount and whenever the submitted search changes. Dispatching the thunk returns a
  // promise with .abort(), so a slow, outdated request is cancelled in the cleanup.
  useEffect(() => {
    const request = dispatch(fetchProducts({ query, limit: 12 }));
    return () => request.abort();
  }, [dispatch, query]);

  return (
    <section>
      <h1>Shop</h1>
      <form className="row" onSubmit={(e) => { e.preventDefault(); setQuery(input); }} role="search">
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Search products (e.g. phone)" aria-label="Search products" />
        <button className="btn">Search</button>
        {query && (
          <button type="button" className="btn ghost" onClick={() => { setInput(''); setQuery(''); }}>
            Clear
          </button>
        )}
      </form>

      {status === 'loading' && <p className="empty" role="status">Loading products…</p>}
      {status === 'failed' && (
        <div className="empty" role="alert">
          <p className="error">Could not load products: {error}</p>
          <button className="btn" onClick={() => dispatch(fetchProducts({ query, limit: 12 }))}>Try again</button>
        </div>
      )}
      {status === 'succeeded' && (
        <>
          <p className="muted">Showing {products.length} of {total} products</p>
          {products.length === 0 ? (
            <p className="empty">No products match “{query}”.</p>
          ) : (
            <ul className="grid">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
