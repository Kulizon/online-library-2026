const AUTH_URL = process.env.AUTH_URL ?? 'http://localhost:3001';
const BOOKS_URL = process.env.BOOKS_URL ?? 'http://localhost:3002';
const RENTALS_URL = process.env.RENTALS_URL ?? 'http://localhost:3003';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'admin123';

const uid = Date.now();
const clientEmail = `rental_client_${uid}@test.local`;
const libEmail = `rental_lib_${uid}@test.local`;
const ean = `979${uid.toString().slice(-10)}`;

let adminToken;
let libToken;
let clientToken;
let bookId;
let rentalId;

async function login(email, password) {
  const res = await fetch(`${AUTH_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const body = await res.json();
  return body.token;
}

async function authReq(method, url, body, token) {
  return fetch(url, {
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
      firstName: 'Rental',
      lastName: 'Client',
    }),
  });
  clientToken = await login(clientEmail, 'clientpass');

  await fetch(`${AUTH_URL}/api/auth/staff`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      email: libEmail,
      password: 'libpass',
      firstName: 'Rental',
      lastName: 'Librarian',
      role: 'librarian',
    }),
  });
  libToken = await login(libEmail, 'libpass');

  const bookRes = await fetch(`${BOOKS_URL}/api/books`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      title: `Rental Test Book ${uid}`,
      author: 'Rental Author',
      ean,
      totalCopies: 1,
    }),
  });
  const book = await bookRes.json();
  bookId = book.id;
});

describe('RentalService — POST /api/rentals', () => {
  it('returns 401 when no token is provided', async () => {
    const res = await authReq('POST', `${RENTALS_URL}/api/rentals`, { bookId });
    expect(res.status).toBe(401);
  });

  it('returns 403 when a librarian attempts to create a rental', async () => {
    const res = await authReq('POST', `${RENTALS_URL}/api/rentals`, { bookId }, libToken);
    expect(res.status).toBe(403);
  });

  it('returns 400 when bookId is missing', async () => {
    const res = await authReq('POST', `${RENTALS_URL}/api/rentals`, {}, clientToken);
    expect(res.status).toBe(400);
  });

  it('returns 404 for a non-existent book', async () => {
    const res = await authReq('POST', `${RENTALS_URL}/api/rentals`, { bookId: 999999999 }, clientToken);
    expect(res.status).toBe(404);
  });

  it('creates a rental and returns 201 with reserved status', async () => {
    const res = await authReq('POST', `${RENTALS_URL}/api/rentals`, { bookId }, clientToken);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.bookId).toBe(bookId);
    expect(body.status).toBe('reserved');
    expect(body.pickupDate).toBeDefined();
    rentalId = body.id;
  });

  it('returns 409 when no copies are available', async () => {
    const res = await authReq('POST', `${RENTALS_URL}/api/rentals`, { bookId }, clientToken);
    expect(res.status).toBe(409);
  });
});

describe('RentalService — GET /api/rentals', () => {
  it('returns the client own rentals list', async () => {
    const res = await authReq('GET', `${RENTALS_URL}/api/rentals`, undefined, clientToken);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.rentals)).toBe(true);
    const rental = body.rentals.find((r) => r.id === rentalId);
    expect(rental).toBeDefined();
    expect(rental.status).toBe('reserved');
    expect(rental.bookTitle).toBeDefined();
  });

  it('returns 401 without a token', async () => {
    const res = await authReq('GET', `${RENTALS_URL}/api/rentals`);
    expect(res.status).toBe(401);
  });

  it('returns 403 when a librarian accesses the client endpoint', async () => {
    const res = await authReq('GET', `${RENTALS_URL}/api/rentals`, undefined, libToken);
    expect(res.status).toBe(403);
  });
});

describe('RentalService — GET /api/rentals/all', () => {
  it('returns all rentals for librarian', async () => {
    const res = await authReq('GET', `${RENTALS_URL}/api/rentals/all`, undefined, libToken);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.rentals)).toBe(true);
    const rental = body.rentals.find((r) => r.id === rentalId);
    expect(rental).toBeDefined();
  });

  it('returns 403 when a client accesses the all-rentals endpoint', async () => {
    const res = await authReq('GET', `${RENTALS_URL}/api/rentals/all`, undefined, clientToken);
    expect(res.status).toBe(403);
  });

  it('returns 401 without a token', async () => {
    const res = await authReq('GET', `${RENTALS_URL}/api/rentals/all`);
    expect(res.status).toBe(401);
  });
});

describe('RentalService — PATCH /api/rentals/:id/pickup', () => {
  it('returns 403 when a client attempts to mark pickup', async () => {
    const res = await authReq('PATCH', `${RENTALS_URL}/api/rentals/${rentalId}/pickup`, undefined, clientToken);
    expect(res.status).toBe(403);
  });

  it('returns 404 for a non-existent rental', async () => {
    const res = await authReq('PATCH', `${RENTALS_URL}/api/rentals/999999999/pickup`, undefined, libToken);
    expect(res.status).toBe(404);
  });

  it('marks the rental as picked_up and returns 200', async () => {
    const res = await authReq('PATCH', `${RENTALS_URL}/api/rentals/${rentalId}/pickup`, undefined, libToken);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe(rentalId);
    expect(body.status).toBe('picked_up');
  });

  it('returns 400 when rental is not in reserved status', async () => {
    const res = await authReq('PATCH', `${RENTALS_URL}/api/rentals/${rentalId}/pickup`, undefined, libToken);
    expect(res.status).toBe(400);
  });
});

describe('RentalService — PATCH /api/rentals/:id/return', () => {
  it('returns 403 when a client attempts to mark return', async () => {
    const res = await authReq('PATCH', `${RENTALS_URL}/api/rentals/${rentalId}/return`, undefined, clientToken);
    expect(res.status).toBe(403);
  });

  it('returns 404 for a non-existent rental', async () => {
    const res = await authReq('PATCH', `${RENTALS_URL}/api/rentals/999999999/return`, undefined, libToken);
    expect(res.status).toBe(404);
  });

  it('marks the rental as returned, returns 200, and releases the book copy', async () => {
    const res = await authReq('PATCH', `${RENTALS_URL}/api/rentals/${rentalId}/return`, undefined, libToken);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe(rentalId);
    expect(body.status).toBe('returned');
    expect(body.returnedAt).toBeDefined();

    const bookRes = await fetch(`${BOOKS_URL}/api/books/${bookId}`);
    const book = await bookRes.json();
    expect(book.availableCopies).toBe(1);
  });

  it('returns 400 when rental is not in picked_up status', async () => {
    const res = await authReq('PATCH', `${RENTALS_URL}/api/rentals/${rentalId}/return`, undefined, libToken);
    expect(res.status).toBe(400);
  });
});
