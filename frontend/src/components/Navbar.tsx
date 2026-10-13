import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useGuardedLink } from '../utils/useGuardedLink';
import Icon from './Icon';
export default function Navbar() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();
  const guarded = useGuardedLink();
  return (
    <header className="nav">
      <div className="nav-inner">
        <Link to="/" className="logo">
          SHOPLY
        </Link>
        <nav>
          <NavLink to="/products">
            <Icon name="shop" />
            <span>Shop</span>
          </NavLink>
          {user && (
            <NavLink to="/wishlist">
              <Icon name="heart" />
              <span>Wishlist</span>
            </NavLink>
          )}
          {user && (
            <NavLink to="/orders">
              <Icon name="orders" />
              <span>Orders</span>
            </NavLink>
          )}
          {user?.role === 'admin' && (
            <NavLink to="/admin">
              <Icon name="admin" />
              <span>Admin</span>
            </NavLink>
          )}
        </nav>
        <div className="nav-actions">
          <Link
            {...guarded('/cart')}
            className="cart-link"
            aria-label={`Cart, ${count} ${count === 1 ? 'item' : 'items'}`}
            title="Cart"
          >
            <Icon name="cart" size={22} />
            <span className="cart-count">{count}</span>
          </Link>
          {user ? (
            <>
              <Link to="/profile" className="user-link" title="Profile">
                <Icon name="user" />
                <span>{user.fullName}</span>
              </Link>
              <button
                className="link-btn logout-btn"
                title="Logout"
                onClick={() => {
                  logout();
                  navigate('/');
                }}
              >
                <Icon name="logout" />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <Link to="/login" className="btn small">
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
