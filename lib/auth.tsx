"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { setAuth, clearAuth, getStoredUser, isLoggedIn } from "@/lib/api";

interface AuthUser {
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  role_id: number;
  division_name?: string;
  region_name?: string;
  zone_name?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: true,
  login: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = localStorage.getItem("smart_wagon_token");
    const u = getStoredUser() as AuthUser | null;
    if (t && u) {
      setToken(t);
      setUser(u);
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "https://api.vaspsystemic.com/smart_coach_api/api"}/auth/login`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      }
    );
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || data.message || "Login failed");

    const { user: u, token: t } = data.data;
    setAuth(t, u);
    setToken(t);
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    setToken(null);
    setUser(null);
    window.location.href = "/login";
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
