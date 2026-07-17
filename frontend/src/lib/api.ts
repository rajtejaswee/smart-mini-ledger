import axios from "axios";

const TOKEN_KEY = "ledger_token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t: string) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

// Dev: "/api" is proxied to the backend by Vite (see vite.config.ts).
// Split deploys (frontend on Vercel, backend on Railway): set VITE_API_URL to the
// backend's full URL, e.g. https://your-backend.up.railway.app/api
export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL ?? "/api" });

// Shared by Login/Signup so client-side checks match the backend's normalization.
export function isValidEmail(raw: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw.trim());
}

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Session expiry: a 401 mid-session (JWT lives 7d) means the token is dead — clear it
// and send the user to /login instead of leaving every page silently broken.
// Login/register 401s are real "wrong credentials" responses, not expiry; and the
// change-password form handles its own 401 (wrong current password) inline.
const AUTH_401_URLS = ["/auth/login", "/auth/register", "/auth/change-password"];
api.interceptors.response.use(undefined, (err) => {
  if (
    axios.isAxiosError(err) &&
    err.response?.status === 401 &&
    !AUTH_401_URLS.some((u) => err.config?.url?.includes(u)) &&
    getToken()
  ) {
    clearToken();
    if (!["/login", "/signup"].includes(window.location.pathname)) {
      window.location.assign("/login");
    }
  }
  return Promise.reject(err);
});

// Pull a human-readable message out of an axios error.
export function apiError(err: unknown, fallback = "Something went wrong"): string {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.error ?? err.message ?? fallback;
  }
  return fallback;
}

// Machine-readable code (e.g. "POSSIBLE_DUPLICATE") the backend attaches to some errors.
export function apiCode(err: unknown): string | undefined {
  if (axios.isAxiosError(err)) return err.response?.data?.code;
  return undefined;
}

// Details payload (e.g. the existing transaction on a duplicate).
export function apiDetails<T = unknown>(err: unknown): T | undefined {
  if (axios.isAxiosError(err)) return err.response?.data?.details;
  return undefined;
}
