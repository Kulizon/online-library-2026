import { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Library,
  LogOut,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  UserPlus,
  X,
} from 'lucide-react';
import { booksApi, authHeaders } from '../api';
import { useAuth } from '../context/useAuth';

const emptyBook = {
  title: '',
  author: '',
  isbn: '',
  ean: '',
  description: '',
  totalCopies: 1,
  availableCopies: 1,
};

const emptyStaff = {
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  role: 'librarian',
};

function roleLabel(role) {
  if (role === 'admin') return 'Administrator';
  if (role === 'librarian') return 'Bibliotekarz';
  return 'Klient';
}

function notice(type, text) {
  return text ? { type, text } : null;
}

function formatIsbn(value) {
  const compact = value.replace(/[-\s]/g, '').toUpperCase();
  if (/^\d{0,9}[\dX]?$/.test(compact) && compact.length <= 10) return compact;

  const digits = compact.replace(/\D/g, '').slice(0, 13);
  const groups = [
    digits.slice(0, 3),
    digits.slice(3, 5),
    digits.slice(5, 9),
    digits.slice(9, 12),
    digits.slice(12, 13),
  ].filter(Boolean);

  return groups.join('-');
}

function formatEan(value) {
  return value.replace(/\D/g, '').slice(0, 13);
}

function eanFromIsbn(value) {
  const digits = value.replace(/\D/g, '').slice(0, 13);
  return digits.length === 13 ? digits : '';
}

function isbnFromEan(value) {
  const ean = formatEan(value);
  return ean.length === 13 ? formatIsbn(ean) : '';
}

export default function Home() {
  const { user, token, logout, createStaffAccount } = useAuth();
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [catalogNotice, setCatalogNotice] = useState(null);
  const [bookNotice, setBookNotice] = useState(null);
  const [staffNotice, setStaffNotice] = useState(null);
  const [editingBook, setEditingBook] = useState(null);
  const [bookForm, setBookForm] = useState(emptyBook);
  const [staffForm, setStaffForm] = useState(emptyStaff);

  const isStaff = user.role === 'librarian' || user.role === 'admin';
  const isAdmin = user.role === 'admin';
  const visibleBooks = useMemo(() => (Array.isArray(books) ? books : []), [books]);

  const stats = useMemo(() => {
    const available = visibleBooks.reduce((sum, book) => sum + Number(book.availableCopies || 0), 0);
    const copies = visibleBooks.reduce((sum, book) => sum + Number(book.totalCopies || 0), 0);
    return { available, copies };
  }, [visibleBooks]);

  const applyBooksResponse = (data) => {
    setBooks(Array.isArray(data.books) ? data.books : []);
    setTotal(Number(data.total || 0));
    setTotalPages(Math.max(Number(data.totalPages || 1), 1));
  };

  const loadBooks = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setCatalogNotice(null);
    try {
      const res = await booksApi.get('/api/books', {
        params: { search: submittedSearch, page, limit: 8 },
      });
      applyBooksResponse(res.data);
    } catch (err) {
      setCatalogNotice(notice('error', err.response?.data?.error || 'Nie udało się pobrać katalogu książek.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    booksApi.get('/api/books', {
      params: { search: submittedSearch, page, limit: 8 },
    })
      .then((res) => applyBooksResponse(res.data))
      .catch((err) => setCatalogNotice(notice('error', err.response?.data?.error || 'Nie udało się pobrać katalogu książek.')))
      .finally(() => setLoading(false));
  }, [page, submittedSearch]);

  const handleSearch = (event) => {
    event.preventDefault();
    const normalized = search.trim();
    if (page !== 1) {
      setSubmittedSearch(normalized);
      setPage(1);
    } else if (submittedSearch !== normalized) {
      setSubmittedSearch(normalized);
    } else {
      loadBooks();
    }
  };

  const resetBookForm = () => {
    setEditingBook(null);
    setBookForm(emptyBook);
  };

  const updateBookIsbn = (value) => {
    const isbn = formatIsbn(value);
    const previousDerivedEan = eanFromIsbn(bookForm.isbn);
    const nextDerivedEan = eanFromIsbn(isbn);
    const shouldAutoFillEan = !bookForm.ean || bookForm.ean === previousDerivedEan;

    setBookForm({
      ...bookForm,
      isbn,
      ean: shouldAutoFillEan ? nextDerivedEan : bookForm.ean,
    });
  };

  const updateBookEan = (value) => {
    const ean = formatEan(value);
    const previousDerivedIsbn = isbnFromEan(bookForm.ean);
    const nextDerivedIsbn = isbnFromEan(ean);
    const shouldAutoFillIsbn = !bookForm.isbn || bookForm.isbn === previousDerivedIsbn;

    setBookForm({
      ...bookForm,
      ean,
      isbn: shouldAutoFillIsbn ? nextDerivedIsbn : bookForm.isbn,
    });
  };

  const startEditing = (book) => {
    setEditingBook(book);
    setBookForm({
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      ean: book.ean || '',
      description: book.description || '',
      totalCopies: book.totalCopies,
      availableCopies: book.availableCopies,
    });
  };

  const saveBook = async (event) => {
    event.preventDefault();
    setBookNotice(null);

    const payload = {
      ...bookForm,
      isbn: formatIsbn(bookForm.isbn),
      ean: formatEan(bookForm.ean),
      totalCopies: Number(bookForm.totalCopies),
      availableCopies: Number(bookForm.availableCopies),
    };

    try {
      if (editingBook) {
        await booksApi.put(`/api/books/${editingBook.id}`, payload, {
          headers: authHeaders(token),
        });
        setBookNotice(notice('success', 'Książka została zaktualizowana.'));
      } else {
        await booksApi.post('/api/books', payload, {
          headers: authHeaders(token),
        });
        setBookNotice(notice('success', 'Książka została dodana do katalogu.'));
      }
      resetBookForm();
      await loadBooks(false);
    } catch (err) {
      setBookNotice(notice('error', err.response?.data?.error || 'Nie udało się zapisać książki.'));
    }
  };

  const deleteBook = async (book) => {
    setCatalogNotice(null);
    try {
      await booksApi.delete(`/api/books/${book.id}`, {
        headers: authHeaders(token),
      });
      setCatalogNotice(notice('success', 'Książka została usunięta.'));
      await loadBooks(false);
    } catch (err) {
      setCatalogNotice(notice('error', err.response?.data?.error || 'Nie udało się usunąć książki.'));
    }
  };

  const createStaff = async (event) => {
    event.preventDefault();
    setStaffNotice(null);
    try {
      const created = await createStaffAccount(staffForm);
      setStaffForm(emptyStaff);
      setStaffNotice(notice('success', `Utworzono konto: ${created.email} (${roleLabel(created.role)}).`));
    } catch (err) {
      setStaffNotice(notice('error', err.response?.data?.error || 'Nie udało się utworzyć konta pracowniczego.'));
    }
  };

  useEffect(() => {
    if (!bookNotice) return;

    const timer = setTimeout(() => {
      setBookNotice(null);
    }, 3000);

    return () => clearTimeout(timer);
  }, [bookNotice]);

  useEffect(() => {
    if (!staffNotice) return;
    
    const timer = setTimeout(() => {
      setStaffNotice(null);
    }, 3000);

    return () => clearTimeout(timer);
  }, [staffNotice]);

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark"><Library size={22} /></span>
          <div>
            <p>Online Library</p>
            <span>Katalog i obsługa wypożyczeń</span>
          </div>
        </div>

        <div className="profile">
          <div className="profile-copy">
            <strong>{user.firstName} {user.lastName}</strong>
            <span>{roleLabel(user.role)}</span>
          </div>
          <button className="icon-button" type="button" onClick={logout} title="Wyloguj">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <section className="workspace">
        <aside className="side-panel">
          <div className="metric">
            <span>Książki w katalogu</span>
            <strong>{total}</strong>
          </div>
          <div className="metric">
            <span>Dostępne egzemplarze</span>
            <strong>{stats.available}</strong>
          </div>
          <div className="metric">
            <span>Łączny stan</span>
            <strong>{stats.copies}</strong>
          </div>

          {isStaff && (
            <section className="panel-block">
              <div className="panel-heading">
                <BookOpen size={18} />
                <h2>{editingBook ? 'Edycja książki' : 'Nowa książka'}</h2>
              </div>
              <form className="stack-form" onSubmit={saveBook}>
                <label>
                  Tytuł
                  <input value={bookForm.title} onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })} required />
                </label>
                <label>
                  Autor
                  <input value={bookForm.author} onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })} required />
                </label>
                <label>
                  ISBN
                  <input
                    value={bookForm.isbn}
                    onChange={(e) => updateBookIsbn(e.target.value)}
                    placeholder="ISBN-10 albo ISBN-13"
                  />
                </label>
                <label>
                  EAN
                  <input
                    value={bookForm.ean}
                    onChange={(e) => updateBookEan(e.target.value)}
                    placeholder="1234567890123"
                    inputMode="numeric"
                  />
                </label>
                <label>
                  Opis
                  <textarea value={bookForm.description} onChange={(e) => setBookForm({ ...bookForm, description: e.target.value })} rows="4" />
                </label>
                <div className="form-grid">
                  <label>
                    Razem
                    <input min="0" type="number" value={bookForm.totalCopies} onChange={(e) => setBookForm({ ...bookForm, totalCopies: e.target.value })} required />
                  </label>
                  <label>
                    Dostępne
                    <input min="0" type="number" value={bookForm.availableCopies} onChange={(e) => setBookForm({ ...bookForm, availableCopies: e.target.value })} required />
                  </label>
                </div>
                <div className="button-row">
                  <button className="primary-button" type="submit">
                    {editingBook ? <Check size={17} /> : <Plus size={17} />}
                    {editingBook ? 'Zapisz' : 'Dodaj'}
                  </button>
                  {editingBook && (
                    <button className="ghost-button" type="button" onClick={resetBookForm}>
                      <X size={17} />
                      Anuluj
                    </button>
                  )}
                </div>
                {bookNotice && (
                  <div className={`notice inline ${bookNotice.type}`}>
                    {bookNotice.text}
                  </div>
                )}
              </form>
            </section>
          )}

          {isAdmin && (
            <section className="panel-block">
              <div className="panel-heading">
                <ShieldCheck size={18} />
                <h2>Konto pracownicze</h2>
              </div>
              <form className="stack-form" onSubmit={createStaff}>
                <div className="form-grid">
                  <label>
                    Imię
                    <input value={staffForm.firstName} onChange={(e) => setStaffForm({ ...staffForm, firstName: e.target.value })} required />
                  </label>
                  <label>
                    Nazwisko
                    <input value={staffForm.lastName} onChange={(e) => setStaffForm({ ...staffForm, lastName: e.target.value })} required />
                  </label>
                </div>
                <label>
                  Email
                  <input type="email" value={staffForm.email} onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })} required />
                </label>
                <label>
                  Hasło
                  <input type="password" value={staffForm.password} onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })} required />
                </label>
                <label>
                  Rola
                  <select value={staffForm.role} onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}>
                    <option value="librarian">Bibliotekarz</option>
                    <option value="admin">Administrator</option>
                  </select>
                </label>
                <button className="primary-button" type="submit">
                  <UserPlus size={17} />
                  Utwórz konto
                </button>
                {staffNotice && (
                  <div className={`notice inline ${staffNotice.type}`}>
                    {staffNotice.text}
                  </div>
                )}
              </form>
            </section>
          )}
        </aside>

        <section className="content-area">
          <div className="catalog-header">
            <div>
              <h1>Katalog książek</h1>
              <p>Sprawdzaj dostępność i zarządzaj ofertą biblioteki.</p>
            </div>
            <form className="search-box" onSubmit={handleSearch}>
              <Search size={18} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tytuł, autor, ISBN albo EAN"
              />
              <button type="submit">Szukaj</button>
            </form>
          </div>

          {catalogNotice && (
            <div className={`notice ${catalogNotice.type}`}>
              {catalogNotice.text}
            </div>
          )}

          <div className="book-grid">
            {loading && <div className="empty-state">Ładowanie katalogu...</div>}
            {!loading && visibleBooks.length === 0 && <div className="empty-state">Brak książek dla wybranych kryteriów.</div>}
            {!loading && visibleBooks.map((book) => (
              <article className="book-card" key={book.id}>
                <div className="book-card-main">
                  <div className="book-icon"><BookOpen size={22} /></div>
                  <div>
                    <h2>{book.title}</h2>
                    <p>{book.author}</p>
                  </div>
                </div>
                <p className="description">{book.description || 'Brak opisu.'}</p>
                <div className="book-meta">
                  <span>ISBN {book.isbn}{book.ean ? ` · EAN ${book.ean}` : ''}</span>
                  <strong className={book.availableCopies > 0 ? 'available' : 'unavailable'}>
                    {book.availableCopies}/{book.totalCopies} dostępne
                  </strong>
                </div>
                {isStaff && (
                  <div className="card-actions">
                    <button className="icon-button subtle" type="button" onClick={() => startEditing(book)} title="Edytuj książkę">
                      <Edit3 size={17} />
                    </button>
                    <button className="icon-button danger" type="button" onClick={() => deleteBook(book)} title="Usuń książkę">
                      <Trash2 size={17} />
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>

          <div className="pagination">
            <button className="icon-button subtle" type="button" onClick={() => setPage((value) => Math.max(value - 1, 1))} disabled={page <= 1} title="Poprzednia strona">
              <ChevronLeft size={18} />
            </button>
            <span>Strona {page} z {totalPages}</span>
            <button className="icon-button subtle" type="button" onClick={() => setPage((value) => Math.min(value + 1, totalPages))} disabled={page >= totalPages} title="Następna strona">
              <ChevronRight size={18} />
            </button>
          </div>
        </section>
      </section>
    </main>
  );
}
