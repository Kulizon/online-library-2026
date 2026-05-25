import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user, logout } = useAuth();

  return (
    <div style={{ maxWidth: 600, margin: '80px auto' }}>
      <h1>Księgarnia Online</h1>
      <p>Witaj, <strong>{user.firstName} {user.lastName}</strong>! (rola: {user.role})</p>
      <hr />
      <h2>Katalog książek</h2>
      <p><em>Ta sekcja zostanie zaimplementowana z BookService...</em></p>
      <ul>
        <li>📖 &quot;Pan Tadeusz&quot; – Adam Mickiewicz (dostępne: 3)</li>
        <li>📖 &quot;Lalka&quot; – Bolesław Prus (dostępne: 1)</li>
        <li>📖 &quot;Solaris&quot; – Stanisław Lem (dostępne: 5)</li>
      </ul>
      <button onClick={logout} style={{ marginTop: 20, padding: '10px 20px' }}>
        Wyloguj się
      </button>
    </div>
  );
}
