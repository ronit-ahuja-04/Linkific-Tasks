import { useDispatch, useSelector } from 'react-redux';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { logout, selectUser } from '../store/slices/authSlice.js';
import { selectCartCount } from '../store/slices/cartSlice.js';
import { selectTodoCounts } from '../store/slices/todosSlice.js';

export default function Layout() {
  // REDUX: three components-worth of state read in one place, each through its own selector
  const user = useSelector(selectUser);
  const cartCount = useSelector(selectCartCount);
  const { active } = useSelector(selectTodoCounts);
  // useDispatch returns the function that sends actions to the store
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/shop');
  };

  return (
    <div className="app">
      <header className="bar">
        <strong className="brand">Redux Market</strong>
        <nav aria-label="Main">
          <NavLink to="/shop">Shop</NavLink>
          <NavLink to="/cart">
            Cart {cartCount > 0 && <span className="pill" aria-label={`${cartCount} items`}>{cartCount}</span>}
          </NavLink>
          <NavLink to="/todos">
            Todos {active > 0 && <span className="pill" aria-label={`${active} open`}>{active}</span>}
          </NavLink>
        </nav>
        <div className="who">
          {user ? (
            <>
              <img src={user.image} alt="" width="28" height="28" />
              <span>{user.firstName}</span>
              <button className="btn ghost" onClick={handleLogout}>Log out</button>
            </>
          ) : (
            <NavLink to="/login" className="btn">Log in</NavLink>
          )}
        </div>
      </header>
      <main>
        <Outlet />
      </main>
      <footer>Day 11 · Redux Toolkit · open the Redux DevTools to watch every action</footer>
    </div>
  );
}
