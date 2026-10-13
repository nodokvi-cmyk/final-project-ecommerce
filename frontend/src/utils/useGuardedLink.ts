import { useAuth } from '../context/AuthContext';

interface GuardedLink {
  to: string;
  state?: { from: string };
}

// Links to a login-only page when signed in. When signed out it links to
// /login and remembers the target so Login can send the user there afterwards.
export function useGuardedLink() {
  const { user } = useAuth();
  return (path: string): GuardedLink =>
    user ? { to: path } : { to: '/login', state: { from: path } };
}
