import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import axios from "axios";
import { api, getToken, setToken, clearToken } from "@/lib/api";
import type { User } from "@/lib/types";

interface AuthState {
  user: User | null;
  loading: boolean;
  bootFailed: boolean;
  retryBoot: () => void;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  updateUser: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [bootFailed, setBootFailed] = useState(false);

  // On first load, if we have a token, restore the session.
  const restore = useCallback(() => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setBootFailed(false);
    api
      .get<{ user: User }>("/auth/me")
      .then((res) => setUser(res.data.user))
      .catch((err) => {
        const status = axios.isAxiosError(err) ? err.response?.status : undefined;
        if (status === 401 || status === 403) {
          // The server rejected the token — the session really is over.
          clearToken();
        } else {
          // Network blip / backend restarting: keep the token, surface a retryable
          // "can't reach server" state instead of bouncing the user to /login.
          setBootFailed(true);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    restore();
  }, [restore]);

  async function login(email: string, password: string) {
    const res = await api.post<{ user: User; token: string }>("/auth/login", { email, password });
    setToken(res.data.token);
    setUser(res.data.user);
  }

  async function signup(name: string, email: string, password: string) {
    const res = await api.post<{ user: User; token: string }>("/auth/register", {
      name,
      email,
      password,
    });
    setToken(res.data.token);
    setUser(res.data.user);
  }

  // Settings saves return the fresh user; push it straight into the shell (sidebar, greeting).
  function updateUser(next: User) {
    setUser(next);
  }

  function logout() {
    clearToken();
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, bootFailed, retryBoot: restore, login, signup, updateUser, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
