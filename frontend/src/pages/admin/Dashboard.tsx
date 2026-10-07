import { Link } from 'react-router-dom';
export default function Dashboard() {
  return (
    <section className="section container">
      <div className="page-heading">
        <div>
          <span className="eyebrow">ADMIN</span>
          <h1>Dashboard</h1>
        </div>
      </div>
      <div className="admin-grid">
        <Link className="admin-card" to="/admin/products">
          <span>Products</span>
          <strong>Manage catalog →</strong>
        </Link>
        <Link className="admin-card" to="/admin/products/new">
          <span>Add product</span>
          <strong>Create new →</strong>
        </Link>
        <Link className="admin-card" to="/admin/orders">
          <span>Orders</span>
          <strong>Manage orders →</strong>
        </Link>
      </div>
    </section>
  );
}
