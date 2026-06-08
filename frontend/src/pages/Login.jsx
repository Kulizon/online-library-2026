import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Library } from 'lucide-react';
import { useAuth } from '../context/useAuth';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Nie udało się zalogować.');
    }
  };

  return (
    <main className="auth-layout">
      <section className="auth-visual">
        <div className="auth-brand">
          <span className="brand-mark"><Library size={24} /></span>
          <strong>Online Library</strong>
        </div>
        <h1>Panel katalogu i rezerwacji książek</h1>
        <p>Jedno miejsce dla klientów, bibliotekarzy i administratorów.</p>
      </section>

      <section className="auth-panel">
        <div className="auth-card">
          <h2>Logowanie</h2>
          <p>Wejdź do swojego konta bibliotecznego.</p>
          {error && <div className="notice error">{error}</div>}
          <form className="stack-form" onSubmit={handleSubmit}>
            <label>
              Email
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>
            <label>
              Hasło
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </label>
            <button className="primary-button wide" type="submit">
              Zaloguj się
              <ArrowRight size={17} />
            </button>
          </form>
          <p className="auth-switch">Nie masz konta? <Link to="/register">Zarejestruj się</Link></p>
        </div>
      </section>
    </main>
  );
}
