import axios from "axios";

const TOKEN_KEY = "ledger_token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t: string) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

// baseURL "/api" is proxied to the backend by Vite in dev (see vite.config.ts).
export const api = axios.create({ baseURL: "/api" });

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Pull a human-readable message out of an axios error.
export function apiError(err: unknown, fallback = "Something went wrong"): string {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.error ?? err.message ?? fallback;
  }
  return fallback;
}
