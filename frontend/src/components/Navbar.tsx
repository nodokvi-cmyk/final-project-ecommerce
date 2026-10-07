import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
export default function Navbar() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();
  return (
    <header className="nav">
      <div className="nav-inner">
        <Link to="/" className="logo">
          SHOPLY
        </Link>
        <nav>
          <NavLink to="/products">Shop</NavLink>
          {user && <NavLink to="/wishlist">Wishlist</NavLink>}
          {user && <NavLink to="/orders">Orders</NavLink>}
          {user?.role === 'admin' && <NavLink to="/admin">Admin</NavLink>}
        </nav>
        <div className="nav-actions">
          <Link to="/cart" className="cart-link">
            Cart <span>{count}</span>
          </Link>
          {user ? (
            <>
              <Link to="/profile" className="user-link">
                {user.fullName}
              </Link>
              <button
                className="link-btn"
                onClick={() => {
                  logout();
                  navigate('/');
                }}
              >
                Logout
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
