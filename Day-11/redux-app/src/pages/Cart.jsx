import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { formatPrice } from '../lib/api.js';
import {
  clearCart,
  decrement,
  increment,
  MAX_PER_ITEM,
  removeFromCart,
  selectCartCount,
  selectCartItems,
  selectCartTotal,
} from '../store/slices/cartSlice.js';
import { selectIsLoggedIn } from '../store/slices/authSlice.js';

export default function Cart() {
  // REDUX: this page reads the cart slice and the auth slice: two slices working together
  const items = useSelector(selectCartItems);
  const count = useSelector(selectCartCount);
  const total = useSelector(selectCartTotal);
  const loggedIn = useSelector(selectIsLoggedIn);
  const dispatch = useDispatch();

  if (items.length === 0) {
    return (
      <section className="card">
        <h1>Cart</h1>
        <p className="empty">Your cart is empty. <Link to="/shop">Browse the shop</Link>.</p>
      </section>
    );
  }

  return (
    <section className="card">
      <h1>Cart <span className="muted">({count} items)</span></h1>
      <ul className="list">
        {items.map((line) => (
          <li key={line.id} className="line">
            <img src={line.thumbnail} alt="" width="48" height="48" />
            <span className="text">{line.title}</span>
            <div className="qty" role="group" aria-label={`Quantity for ${line.title}`}>
              <button className="btn ghost" onClick={() => dispatch(decrement(line.id))} aria-label="Decrease quantity">−</button>
              <output aria-live="polite">{line.quantity}</output>
              <button className="btn ghost" onClick={() => dispatch(increment(line.id))} disabled={line.quantity >= MAX_PER_ITEM} aria-label="Increase quantity">+</button>
            </div>
            <strong>{formatPrice(line.price * line.quantity)}</strong>
            <button className="btn ghost danger" onClick={() => dispatch(removeFromCart(line.id))} aria-label={`Remove ${line.title}`}>Remove</button>
          </li>
        ))}
      </ul>
      <div className="row between total">
        <button className="btn ghost" onClick={() => dispatch(clearCart())}>Clear cart</button>
        <div className="row">
          <strong>Total: {formatPrice(total)}</strong>
          {loggedIn ? (
            <button className="btn primary" onClick={() => dispatch(clearCart())}>Checkout (demo)</button>
          ) : (
            <Link className="btn primary" to="/login" state={{ from: '/cart' }}>Log in to check out</Link>
          )}
        </div>
      </div>
    </section>
  );
}
