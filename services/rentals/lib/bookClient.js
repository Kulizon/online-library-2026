const BASE_URL = process.env.BOOK_SERVICE_URL || 'http://localhost:3002';
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || '';

async function parseErrorResponse(res) {
  try {
    const data = await res.json();
    return data.error || res.statusText;
  } catch {
    return res.statusText;
  }
}

async function getBook(bookId) {
  const res = await fetch(`${BASE_URL}/api/books/${bookId}`);
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(await parseErrorResponse(res));
  }

  return res.json();
}

async function reserveBook(bookId) {
  const res = await fetch(`${BASE_URL}/api/books/${bookId}/reserve`, {
    method: 'POST',
    headers: {
      'X-Internal-Key': INTERNAL_API_KEY,
    },
  });

  if (res.status === 404) {
    return { ok: false, status: 404, error: 'Book not found' };
  }

  if (res.status === 409) {
    return { ok: false, status: 409, error: 'No copies available' };
  }

  if (!res.ok) {
    return { ok: false, status: res.status, error: await parseErrorResponse(res) };
  }

  return { ok: true, book: await res.json() };
}

async function releaseBook(bookId) {
  const res = await fetch(`${BASE_URL}/api/books/${bookId}/release`, {
    method: 'POST',
    headers: {
      'X-Internal-Key': INTERNAL_API_KEY,
    },
  });

  if (res.status === 404) {
    return { ok: false, status: 404, error: 'Book not found' };
  }

  if (!res.ok) {
    return { ok: false, status: res.status, error: await parseErrorResponse(res) };
  }

  return { ok: true, book: await res.json() };
}

module.exports = { getBook, reserveBook, releaseBook };
