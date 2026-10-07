import { errorMessage } from '../../utils/error';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { deleteProduct, getProducts } from '../../services/products';
import type { Product } from '../../types';
export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');
  const take = 30;
  const load = (p = page) =>
    getProducts({ take, page: p })
      .then(setProducts)
      .catch((e) => setError(errorMessage(e)));
  useEffect(() => {
    load(page);
  }, [page]);
  const remove = async (id: string) => {
    if (confirm('Delete this product?')) {
      try {
        await deleteProduct(id);
        await load(page);
      } catch (e) {
        setError(errorMessage(e));
      }
    }
  };
  return (
    <section className="section container">
      <div className="page-heading">
        <div>
          <span className="eyebrow">ADMIN</span>
          <h1>Products</h1>
        </div>
        <Link className="btn" to="/admin/products/new">
          Add product
        </Link>
      </div>
      {error && <div className="error">{error}</div>}
      <div className="admin-table">
        {products.map((p) => (
          <div className="admin-row" key={p._id}>
            <div className="table-product">
              {p.photos?.[0] ? <img src={p.photos[0]} alt="" /> : <span />}
              <div>
                <strong>{p.productName}</strong>
                <small>{p.category}</small>
              </div>
            </div>
            <span>${Number(p.price).toFixed(2)}</span>
            <span>{p.stock}</span>
            <div className="row-actions">
              <Link className="ghost" to={`/admin/products/${p._id}/edit`}>
                Edit
              </Link>
              <button className="danger small" onClick={() => remove(p._id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="row-actions">
        <button
          className="ghost"
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
        >
          Previous
        </button>
        <span>Page {page}</span>
        <button
          className="ghost"
          disabled={products.length < take}
          onClick={() => setPage(page + 1)}
        >
          Next
        </button>
      </div>
    </section>
  );
}
