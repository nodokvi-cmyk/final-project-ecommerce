import { errorMessage } from '../utils/error';
import { useState, type FormEvent } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { verifyEmail, resendCode } from '../services/auth';
import { useAuth } from '../context/AuthContext';
export default function VerifyEmail() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [email, setEmail] = useState(params.get('email') || '');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      const result = await verifyEmail({ email, OTPCode: code });
      localStorage.setItem('token', result.token);
      await refresh();
      navigate('/');
    } catch (e) {
      setError(errorMessage(e));
    }
  };
  const resend = async () => {
    setError('');
    setMessage('');
    try {
      await resendCode({ email });
      setMessage('A new code was sent.');
    } catch (e) {
      setError(errorMessage(e));
    }
  };
  return (
    <section className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <span className="eyebrow">VERIFY EMAIL</span>
        <h1>Enter your code</h1>
        {error && <div className="error">{error}</div>}
        {message && <div className="notice">{message}</div>}
        <label>
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label>
          Verification code
          <input
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
        </label>
        <button className="btn full">Verify</button>
        <button type="button" className="ghost full" onClick={resend}>
          Resend code
        </button>
      </form>
    </section>
  );
}
