const AUTH_URL = process.env.AUTH_URL ?? 'http://localhost:3001';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'admin123';

const uid = Date.now();
const userEmail = `client_${uid}@test.local`;
const libEmail = `librarian_${uid}@test.local`;

let clientToken;
let adminToken;

async function authPost(path, body, token) {
  return fetch(`${AUTH_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
}

async function authGet(path, token) {
  return fetch(`${AUTH_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

describe('AuthService — POST /api/auth/register', () => {
  it('creates a client account and returns 201', async () => {
    const res = await authPost('/api/auth/register', {
      email: userEmail,
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.email).toBe(userEmail);
    expect(body.role).toBe('client');
    expect(body.id).toBeDefined();
  });

  it('returns 409 for duplicate email', async () => {
    const res = await authPost('/api/auth/register', {
      email: userEmail,
      password: 'other',
      firstName: 'Dup',
      lastName: 'User',
    });
    expect(res.status).toBe(409);
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await authPost('/api/auth/register', { email: 'incomplete@test.local' });
    expect(res.status).toBe(400);
  });
});

describe('AuthService — POST /api/auth/login', () => {
  it('returns a JWT token for valid credentials', async () => {
    const res = await authPost('/api/auth/login', {
      email: userEmail,
      password: 'password123',
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(typeof body.token).toBe('string');
    clientToken = body.token;
  });

  it('returns 401 for wrong password', async () => {
    const res = await authPost('/api/auth/login', {
      email: userEmail,
      password: 'wrongpassword',
    });
    expect(res.status).toBe(401);
  });

  it('returns 401 for unknown email', async () => {
    const res = await authPost('/api/auth/login', {
      email: 'nobody@test.local',
      password: 'password123',
    });
    expect(res.status).toBe(401);
  });
});

describe('AuthService — GET /api/auth/me', () => {
  it('returns the authenticated user profile', async () => {
    const res = await authGet('/api/auth/me', clientToken);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.email).toBe(userEmail);
    expect(body.role).toBe('client');
    expect(body.firstName).toBe('Test');
    expect(body.lastName).toBe('User');
  });

  it('returns 401 when no token is provided', async () => {
    const res = await authGet('/api/auth/me', null);
    expect(res.status).toBe(401);
  });

  it('returns 401 for an invalid token', async () => {
    const res = await authGet('/api/auth/me', 'invalid.token.here');
    expect(res.status).toBe(401);
  });
});

describe('AuthService — POST /api/auth/staff', () => {
  beforeAll(async () => {
    const res = await authPost('/api/auth/login', {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });
    const body = await res.json();
    adminToken = body.token;
  });

  it('allows admin to create a librarian account', async () => {
    const res = await authPost(
      '/api/auth/staff',
      {
        email: libEmail,
        password: 'libpass123',
        firstName: 'Jan',
        lastName: 'Kowalski',
        role: 'librarian',
      },
      adminToken,
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.role).toBe('librarian');
    expect(body.email).toBe(libEmail);
  });

  it('returns 409 for duplicate staff email', async () => {
    const res = await authPost(
      '/api/auth/staff',
      {
        email: libEmail,
        password: 'other',
        firstName: 'A',
        lastName: 'B',
        role: 'librarian',
      },
      adminToken,
    );
    expect(res.status).toBe(409);
  });

  it('returns 400 for invalid role value', async () => {
    const res = await authPost(
      '/api/auth/staff',
      {
        email: `other_${uid}@test.local`,
        password: 'pass',
        firstName: 'A',
        lastName: 'B',
        role: 'client',
      },
      adminToken,
    );
    expect(res.status).toBe(400);
  });

  it('returns 403 when a client attempts to create staff', async () => {
    const res = await authPost(
      '/api/auth/staff',
      {
        email: `hacker_${uid}@test.local`,
        password: 'pass',
        firstName: 'A',
        lastName: 'B',
        role: 'librarian',
      },
      clientToken,
    );
    expect(res.status).toBe(403);
  });

  it('returns 401 when no token is provided', async () => {
    const res = await authPost('/api/auth/staff', {
      email: `anon_${uid}@test.local`,
      password: 'pass',
      firstName: 'A',
      lastName: 'B',
      role: 'librarian',
    });
    expect(res.status).toBe(401);
  });
});
