import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Library } from 'lucide-react';
import { useAuth } from '../context/useAuth';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '' });
  const [error, setError] = useState('');

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      await register(form);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.error || 'Nie udało się zarejestrować konta.');
    }
  };

  return (
    <main className="auth-layout">
      <section className="auth-visual">
        <div className="auth-brand">
          <span className="brand-mark"><Library size={24} /></span>
          <strong>Online Library</strong>
        </div>
        <h1>Rezerwuj książki bez kolejki</h1>
        <p>Konto klienta daje dostęp do katalogu i historii wypożyczeń.</p>
      </section>

      <section className="auth-panel">
        <div className="auth-card">
          <h2>Rejestracja</h2>
          <p>Utwórz konto klienta biblioteki.</p>
          {error && <div className="notice error">{error}</div>}
          <form className="stack-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              <label>
                Imię
                <input name="firstName" value={form.firstName} onChange={handleChange} required />
              </label>
              <label>
                Nazwisko
                <input name="lastName" value={form.lastName} onChange={handleChange} required />
              </label>
            </div>
            <label>
              Email
              <input name="email" type="email" value={form.email} onChange={handleChange} required />
            </label>
            <label>
              Hasło
              <input name="password" type="password" value={form.password} onChange={handleChange} required />
            </label>
            <button className="primary-button wide" type="submit">
              Utwórz konto
              <ArrowRight size={17} />
            </button>
          </form>
          <p className="auth-switch">Masz już konto? <Link to="/login">Zaloguj się</Link></p>
        </div>
      </section>
    </main>
  );
}
