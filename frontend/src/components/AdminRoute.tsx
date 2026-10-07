import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
export default function AdminRoute() {
  const { user, loading } = useAuth();
  if (loading) return <div className="center">Loading...</div>;
  return user?.role === 'admin' ? <Outlet /> : <Navigate to="/" replace />;
}
