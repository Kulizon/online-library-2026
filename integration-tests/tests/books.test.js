const AUTH_URL = process.env.AUTH_URL ?? 'http://localhost:3001';
const BOOKS_URL = process.env.BOOKS_URL ?? 'http://localhost:3002';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'admin123';

const uid = Date.now();
const clientEmail = `bookstest_client_${uid}@test.local`;
const ean = `978${uid.toString().slice(-10)}`;

let adminToken;
let clientToken;
let createdBookId;

async function login(email, password) {
  const res = await fetch(`${AUTH_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const body = await res.json();
  return body.token;
}

async function booksReq(method, path, body, token) {
  return fetch(`${BOOKS_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}

beforeAll(async () => {
  adminToken = await login(ADMIN_EMAIL, ADMIN_PASSWORD);

  await fetch(`${AUTH_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: clientEmail,
      password: 'clientpass',
      firstName: 'Books',
      lastName: 'Tester',
    }),
  });
  clientToken = await login(clientEmail, 'clientpass');
});

describe('BookService — GET /api/books', () => {
  it('returns paginated book list without authentication', async () => {
    const res = await booksReq('GET', '/api/books');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.books)).toBe(true);
    expect(typeof body.total).toBe('number');
    expect(typeof body.page).toBe('number');
    expect(typeof body.totalPages).toBe('number');
  });

  it('returns filtered results for search query', async () => {
    const res = await booksReq('GET', '/api/books?search=zzznoresultszzzxxx999');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.books).toHaveLength(0);
    expect(body.total).toBe(0);
  });

  it('respects page and limit query parameters', async () => {
    const res = await booksReq('GET', '/api/books?page=1&limit=2');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.books.length).toBeLessThanOrEqual(2);
    expect(body.page).toBe(1);
  });
});

describe('BookService — POST /api/books', () => {
  it('returns 401 when no token is provided', async () => {
    const res = await booksReq('POST', '/api/books', {
      title: 'Unauthorized Book',
      author: 'Nobody',
      ean,
      totalCopies: 1,
    });
    expect(res.status).toBe(401);
  });

  it('returns 403 when a client attempts to add a book', async () => {
    const res = await booksReq(
      'POST',
      '/api/books',
      {
        title: 'Client Book',
        author: 'Client',
        ean,
        totalCopies: 1,
      },
      clientToken,
    );
    expect(res.status).toBe(403);
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await booksReq('POST', '/api/books', { title: 'No Author' }, adminToken);
    expect(res.status).toBe(400);
  });

  it('creates a book and returns 201 when admin provides valid data', async () => {
    const res = await booksReq(
      'POST',
      '/api/books',
      {
        title: `Integration Test Book ${uid}`,
        author: 'Test Author',
        ean,
        description: 'Created by integration tests',
        totalCopies: 3,
      },
      adminToken,
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.title).toBe(`Integration Test Book ${uid}`);
    expect(body.totalCopies).toBe(3);
    expect(body.availableCopies).toBe(3);
    createdBookId = body.id;
  });

  it('returns 409 for duplicate EAN', async () => {
    const res = await booksReq(
      'POST',
      '/api/books',
      {
        title: 'Duplicate EAN Book',
        author: 'Author',
        ean,
        totalCopies: 1,
      },
      adminToken,
    );
    expect(res.status).toBe(409);
  });
});

describe('BookService — GET /api/books/:id', () => {
  it('returns the book by id', async () => {
    const res = await booksReq('GET', `/api/books/${createdBookId}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe(createdBookId);
    expect(body.title).toBe(`Integration Test Book ${uid}`);
  });

  it('returns 404 for a non-existent book id', async () => {
    const res = await booksReq('GET', '/api/books/999999999');
    expect(res.status).toBe(404);
  });
});

describe('BookService — PUT /api/books/:id', () => {
  it('updates book fields and returns 200', async () => {
    const res = await booksReq(
      'PUT',
      `/api/books/${createdBookId}`,
      { title: `Updated Book ${uid}`, author: 'Updated Author' },
      adminToken,
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.title).toBe(`Updated Book ${uid}`);
    expect(body.author).toBe('Updated Author');
  });

  it('returns 403 when a client attempts to update a book', async () => {
    const res = await booksReq(
      'PUT',
      `/api/books/${createdBookId}`,
      { title: 'Client Update' },
      clientToken,
    );
    expect(res.status).toBe(403);
  });

  it('returns 404 for a non-existent book', async () => {
    const res = await booksReq(
      'PUT',
      '/api/books/999999999',
      { title: 'Ghost Book' },
      adminToken,
    );
    expect(res.status).toBe(404);
  });
});

describe('BookService — PATCH /api/books/:id/stock', () => {
  it('updates stock counts and returns 200', async () => {
    const res = await booksReq(
      'PATCH',
      `/api/books/${createdBookId}/stock`,
      { totalCopies: 5, availableCopies: 4 },
      adminToken,
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.totalCopies).toBe(5);
    expect(body.availableCopies).toBe(4);
  });

  it('returns 400 for negative copy count', async () => {
    const res = await booksReq(
      'PATCH',
      `/api/books/${createdBookId}/stock`,
      { totalCopies: -1 },
      adminToken,
    );
    expect(res.status).toBe(400);
  });

  it('returns 403 when a client attempts to update stock', async () => {
    const res = await booksReq(
      'PATCH',
      `/api/books/${createdBookId}/stock`,
      { totalCopies: 10 },
      clientToken,
    );
    expect(res.status).toBe(403);
  });
});

describe('BookService — GET /api/books (search after create)', () => {
  it('finds the created book by EAN search', async () => {
    const res = await booksReq('GET', `/api/books?search=${ean}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBeGreaterThanOrEqual(1);
  });
});

describe('BookService — DELETE /api/books/:id', () => {
  it('returns 403 when a client attempts to delete a book', async () => {
    const res = await booksReq('DELETE', `/api/books/${createdBookId}`, undefined, clientToken);
    expect(res.status).toBe(403);
  });

  it('deletes the book and returns 204', async () => {
    const res = await booksReq('DELETE', `/api/books/${createdBookId}`, undefined, adminToken);
    expect(res.status).toBe(204);
  });

  it('returns 404 for the deleted book', async () => {
    const res = await booksReq('GET', `/api/books/${createdBookId}`);
    expect(res.status).toBe(404);
  });
});
