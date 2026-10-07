import { errorMessage } from '../utils/error';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signUp } from '../services/auth';
export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    age: '',
    password: '',
  });
  const [error, setError] = useState('');
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    try {
      await signUp({ ...form, age: Number(form.age) });
      navigate(`/verify?email=${encodeURIComponent(form.email)}`);
    } catch (e) {
      setError(errorMessage(e));
    }
  };
  return (
    <section className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <span className="eyebrow">CREATE ACCOUNT</span>
        <h1>Join Shoply</h1>
        {error && <div className="error">{error}</div>}
        <label>
          Full name
          <input
            required
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          />
        </label>
        <label>
          Email
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </label>
        <label>
          Age
          <input
            type="number"
            min="1"
            required
            value={form.age}
            onChange={(e) => setForm({ ...form, age: e.target.value })}
          />
        </label>
        <label>
          Password
          <input
            type="password"
            minLength={6}
            maxLength={20}
            required
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </label>
        <button className="btn full">Create account</button>
        <p>
          Already registered? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </section>
  );
}
