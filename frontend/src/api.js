import axios from 'axios';

export const authApi = axios.create({
  baseURL: import.meta.env.VITE_AUTH_SERVICE_URL || 'http://localhost:3001',
});

export const booksApi = axios.create({
  baseURL: import.meta.env.VITE_BOOK_SERVICE_URL || 'http://localhost:3002',
});

export const rentalsApi = axios.create({
  baseURL: import.meta.env.VITE_RENTAL_SERVICE_URL || 'http://localhost:3003',
});

export function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default authApi;
