import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_AUTH_SERVICE_URL,
});

export default api;
