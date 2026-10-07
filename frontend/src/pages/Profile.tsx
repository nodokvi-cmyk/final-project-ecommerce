import { errorMessage } from '../utils/error';
import { useState, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
export default function Profile() {
  const { user, refresh, logout } = useAuth();
  const [form, setForm] = useState({
    fullName: user?.fullName ?? '',
    age: String(user?.age ?? ''),
    email: user?.email ?? '',
    password: '',
  });
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  if (!user) return null;
  const save = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      const body: {
        fullName: string;
        age: number;
        email: string;
        password?: string;
      } = {
        fullName: form.fullName,
        age: Number(form.age),
        email: form.email,
      };
      if (form.password) body.password = form.password;
      await api.patch(`/users/${user._id}`, body);
      await refresh();
      setMessage('Profile updated.');
    } catch (e) {
      setError(errorMessage(e));
    }
  };
  const avatar = async () => {
    if (!file) return;
    setError('');
    setMessage('');
    try {
      const fd = new FormData();
      fd.append('avatar', file);
      await api.patch(`/users/${user._id}/avatar`, fd);
      await refresh();
      setMessage('Avatar updated.');
    } catch (e) {
      setError(errorMessage(e));
    }
  };
  const deleteAvatar = async () => {
    setError('');
    setMessage('');
    try {
      await api.delete(`/users/${user._id}/avatar`);
      await refresh();
    } catch (e) {
      setError(errorMessage(e));
    }
  };
  return (
    <section className="section container narrow">
      <div className="page-heading">
        <div>
          <span className="eyebrow">ACCOUNT</span>
          <h1>Profile</h1>
        </div>
      </div>
      {error && <div className="error">{error}</div>}
      {message && <div className="notice">{message}</div>}
      <div className="profile-card">
        <div className="avatar">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt="" />
          ) : (
            user.fullName?.[0]
          )}
        </div>
        <div className="avatar-actions">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <button type="button" className="btn small" onClick={avatar}>
            Upload
          </button>
          {user.avatarUrl && (
            <button type="button" className="ghost" onClick={deleteAvatar}>
              Delete
            </button>
          )}
        </div>
      </div>
      <form className="form-card" onSubmit={save}>
        <label>
          Full name
          <input
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          />
        </label>
        <label>
          Email
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </label>
        <label>
          Age
          <input
            type="number"
            value={form.age}
            onChange={(e) => setForm({ ...form, age: e.target.value })}
          />
        </label>
        <label>
          New password
          <input
            type="password"
            minLength={6}
            maxLength={20}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </label>
        <button className="btn">Save changes</button>
      </form>
      <button
        className="danger"
        onClick={async () => {
          if (confirm('Delete your account?')) {
            try {
              await api.delete(`/users/${user._id}`);
              logout();
            } catch (e) {
              setError(errorMessage(e));
            }
          }
        }}
      >
        Delete account
      </button>
    </section>
  );
}
