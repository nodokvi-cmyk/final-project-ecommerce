import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGuardedLink } from '../utils/useGuardedLink';

export default function Footer() {
  const { user, logout } = useAuth();
  const guarded = useGuardedLink();
  const navigate = useNavigate();
  return (
    <footer>
      <div className="container footer">
        <div>
          <Link to="/" className="logo">
            SHOPLY
          </Link>
          <p>Simple shopping, secure checkout, and fast order management.</p>
        </div>
        <div>
          <strong>Shop</strong>
          <p>
            <Link to="/products">Products</Link>
          </p>
          <p>
            <Link {...guarded('/cart')}>Cart</Link>
          </p>
          <p>
            <Link {...guarded('/orders')}>Orders</Link>
          </p>
          <p>
            <Link {...guarded('/wishlist')}>Wishlist</Link>
          </p>
        </div>
        <div>
          <strong>Account</strong>
          {user ? (
            <>
              <p>
                <Link to="/profile">Profile</Link>
              </p>
              <p>
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => {
                    logout();
                    navigate('/');
                  }}
                >
                  Logout
                </button>
              </p>
            </>
          ) : (
            <>
              <p>
                <Link to="/login">Sign in</Link>
              </p>
              <p>
                <Link to="/register">Create account</Link>
              </p>
            </>
          )}
        </div>
      </div>
      <div className="footer-bottom">© {new Date().getFullYear()} Shoply</div>
    </footer>
  );
}
