import { errorMessage } from '../../utils/error';
import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  createProduct,
  getProduct,
  updateProduct,
  deleteProductPhoto,
} from '../../services/products';
export default function ProductForm() {
  const { id = '' } = useParams();
  const edit = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState({
    productName: '',
    description: '',
    price: '',
    stock: '',
    category: '',
  });
  const [photos, setPhotos] = useState<File[]>([]);
  const [existing, setExisting] = useState<string[]>([]);
  const [error, setError] = useState('');
  useEffect(() => {
    if (edit)
      getProduct(id)
        .then((p) => {
          setForm({
            productName: p.productName,
            description: p.description,
            price: String(p.price),
            stock: String(p.stock),
            category: p.category,
          });
          setExisting(p.photos || []);
        })
        .catch((e) => setError(errorMessage(e)));
  }, [id]);
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      photos.forEach((file) => fd.append('photos', file));
      if (edit) await updateProduct(id, fd);
      else await createProduct(fd);
      navigate('/admin/products');
    } catch (e) {
      setError(errorMessage(e));
    }
  };
  const removePhoto = async (photo: string) => {
    try {
      const updated = await deleteProductPhoto(id, photo);
      setExisting(updated.photos || []);
    } catch (e) {
      setError(errorMessage(e));
    }
  };
  return (
    <section className="section container narrow">
      <div className="page-heading">
        <div>
          <span className="eyebrow">ADMIN</span>
          <h1>{edit ? 'Edit product' : 'New product'}</h1>
        </div>
      </div>
      <form className="form-card" onSubmit={submit}>
        {error && <div className="error">{error}</div>}
        <label>
          Product name
          <input
            required
            value={form.productName}
            onChange={(e) => setForm({ ...form, productName: e.target.value })}
          />
        </label>
        <label>
          Description
          <textarea
            required
            rows={6}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </label>
        <div className="two">
          <label>
            Price
            <input
              type="number"
              min="0.01"
              step="0.01"
              required
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />
          </label>
          <label>
            Stock
            <input
              type="number"
              min="0"
              required
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
            />
          </label>
        </div>
        <label>
          Category
          <input
            required
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          />
        </label>
        <label>
          Photos
          <input
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => setPhotos(Array.from(e.target.files || []))}
          />
          <small>Maximum 6 photos total, 5 MB each.</small>
        </label>
        {existing.length > 0 && (
          <div className="photo-manager">
            {existing.map((photo) => (
              <div key={photo}>
                <img src={photo} alt="" />
                <button
                  type="button"
                  className="danger small"
                  onClick={() => removePhoto(photo)}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
        <button className="btn full">
          {edit ? 'Save changes' : 'Create product'}
        </button>
      </form>
    </section>
  );
}
