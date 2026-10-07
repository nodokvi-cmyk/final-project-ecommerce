import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { errorMessage } from '../utils/error';

export default function WishlistButton({
  productId,
  inline = false,
}: {
  productId: string;
  inline?: boolean;
}) {
  const { user } = useAuth();
  const { has, toggle } = useWishlist();
  const navigate = useNavigate();
  const location = useLocation();
  const active = has(productId);
  const onClick = async () => {
    if (!user) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    try {
      await toggle(productId);
    } catch (e) {
      alert(errorMessage(e));
    }
  };
  return (
    <button
      type="button"
      className={`wish-btn${inline ? ' inline' : ''}${active ? ' active' : ''}`}
      aria-label={active ? 'Remove from wishlist' : 'Add to wishlist'}
      aria-pressed={active}
      onClick={onClick}
    >
      <svg
        viewBox="0 0 24 24"
        width="20"
        height="20"
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21.2l7.8-7.7 1-1.1a5.5 5.5 0 0 0 0-7.8z" />
      </svg>
    </button>
  );
}
