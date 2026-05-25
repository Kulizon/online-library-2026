import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '' });
  const [error, setError] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await register(form);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '80px auto' }}>
      <h1>Rejestracja</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Imię</label>
          <input name="firstName" value={form.firstName} onChange={handleChange} required style={{ width: '100%', padding: 8, marginBottom: 12 }} />
        </div>
        <div>
          <label>Nazwisko</label>
          <input name="lastName" value={form.lastName} onChange={handleChange} required style={{ width: '100%', padding: 8, marginBottom: 12 }} />
        </div>
        <div>
          <label>Email</label>
          <input name="email" type="email" value={form.email} onChange={handleChange} required style={{ width: '100%', padding: 8, marginBottom: 12 }} />
        </div>
        <div>
          <label>Hasło</label>
          <input name="password" type="password" value={form.password} onChange={handleChange} required style={{ width: '100%', padding: 8, marginBottom: 12 }} />
        </div>
        <button type="submit" style={{ padding: '10px 20px' }}>Zarejestruj się</button>
      </form>
      <p>Masz już konto? <Link to="/login">Zaloguj się</Link></p>
    </div>
  );
}
