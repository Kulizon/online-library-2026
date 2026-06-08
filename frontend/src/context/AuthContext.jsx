import { useState, useEffect } from 'react';
import { authApi, authHeaders } from '../api';
import { AuthContext } from './auth-context';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(Boolean(token));

  useEffect(() => {
    if (!token) return;

    authApi
      .get('/api/auth/me', {
        headers: authHeaders(token),
      })
      .then((res) => setUser(res.data))
      .catch(() => {
        setToken(null);
        localStorage.removeItem('token');
      })
      .finally(() => setLoading(false));
  }, [token]);

  const login = async (email, password) => {
    const res = await authApi.post('/api/auth/login', { email, password });
    const { token: jwt } = res.data;
    localStorage.setItem('token', jwt);
    setToken(jwt);
    const profile = await authApi.get('/api/auth/me', {
      headers: authHeaders(jwt),
    });
    setUser(profile.data);
  };

  const register = async (data) => {
    await authApi.post('/api/auth/register', data);
  };

  const createStaffAccount = async (data) => {
    const res = await authApi.post('/api/auth/staff', data, {
      headers: authHeaders(token),
    });
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, createStaffAccount, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
