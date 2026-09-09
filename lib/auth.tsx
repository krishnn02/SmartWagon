"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { setAuth, clearAuth, getStoredUser } from "@/lib/api";
import { getUserByEmail, recordUserLogin, type UserConsoleProfile } from "@/lib/user-store";

export interface AuthUser {
  user_id: number | string;
  first_name: string;
  last_name: string;
  name?: string;
  email: string;
  role_id: number;
  role?: string;
  division_name?: string;
  region_name?: string;
  zone_name?: string;
  allowedModules?: ("brake-binding" | "hot-axle")[];
  allowedDevices?: {
    "brake-binding"?: string[];
    "hot-axle"?: string[];
  };
  lastLoginAt?: string | null;
  isImpersonating?: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  impersonateUser: (targetUser: UserConsoleProfile) => void;
  exitImpersonation: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: true,
  login: async () => {},
  logout: () => {},
  impersonateUser: () => {},
  exitImpersonation: () => {},
});

const IMPERSONATE_BACKUP_KEY = "smart_coach_impersonate_backup";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    try {
      const stored = getStoredUser();
      const t = typeof window !== "undefined" ? localStorage.getItem("smart_coach_token") : null;
      if (stored && t) {
        setUser(stored as unknown as AuthUser);
        setToken(t);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (emailInput: string, passwordInput: string) => {
    const cleanEmail = emailInput.trim().toLowerCase();
    const cleanPassword = passwordInput.trim();

    // 1. Check local Dynamic User Console Store
    const localUser = getUserByEmail(cleanEmail);

    if (localUser) {
      if (localUser.password && localUser.password !== cleanPassword) {
        throw new Error("Invalid credentials. Please verify your password.");
      }
      if (!localUser.isActive) {
        throw new Error("This user account has been deactivated by the administrator.");
      }

      // Record active login
      recordUserLogin(localUser.email);

      const [firstName, ...rest] = localUser.name.split(" ");
      const lastName = rest.join(" ") || "";

      const simulatedUser: AuthUser = {
        user_id: localUser.id,
        first_name: firstName,
        last_name: lastName,
        name: localUser.name,
        email: localUser.email,
        role_id: localUser.role === "Administrator" ? 1 : 2,
        role: localUser.role,
        zone_name: localUser.zone,
        division_name: localUser.division,
        allowedModules: localUser.allowedModules,
        allowedDevices: localUser.allowedDevices,
        lastLoginAt: new Date().toISOString(),
      };

      const mockToken = `jwt-sc-${Date.now()}-${Math.random().toString(36).substring(2)}`;
      setAuth(mockToken, simulatedUser as unknown as Record<string, unknown>);
      setToken(mockToken);
      setUser(simulatedUser);
      return;
    }

    // 2. Fallback to remote API if not a local console user
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "https://api.vaspsystemic.com/smart_coach_api/api"}/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: cleanEmail, password: cleanPassword }),
        }
      );
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || data.message || "Invalid credentials");

      const { user: u, token: t } = data.data;
      const enrichedUser: AuthUser = {
        ...u,
        role: u.role_id === 1 ? "Administrator" : "Station Staff",
        allowedModules: ["brake-binding", "hot-axle"],
        allowedDevices: { "brake-binding": ["ALL"], "hot-axle": ["ALL"] },
      };

      setAuth(t, enrichedUser as unknown as Record<string, unknown>);
      setToken(t);
      setUser(enrichedUser);
      recordUserLogin(cleanEmail);
    } catch (apiErr) {
      throw new Error(apiErr instanceof Error ? apiErr.message : "Login failed");
    }
  }, []);

  const impersonateUser = useCallback((targetUser: UserConsoleProfile) => {
    if (!user) return;
    // Save current admin profile in backup if not already impersonating
    if (!user.isImpersonating) {
      localStorage.setItem(IMPERSONATE_BACKUP_KEY, JSON.stringify(user));
    }

    const [firstName, ...rest] = targetUser.name.split(" ");
    const lastName = rest.join(" ") || "";

    const simulatedUser: AuthUser = {
      user_id: targetUser.id,
      first_name: firstName,
      last_name: lastName,
      name: targetUser.name,
      email: targetUser.email,
      role_id: targetUser.role === "Administrator" ? 1 : 2,
      role: targetUser.role,
      zone_name: targetUser.zone,
      division_name: targetUser.division,
      allowedModules: targetUser.allowedModules,
      allowedDevices: targetUser.allowedDevices,
      isImpersonating: true,
    };

    setAuth(token || "impersonate-token", simulatedUser as unknown as Record<string, unknown>);
    setUser(simulatedUser);
  }, [user, token]);

  const exitImpersonation = useCallback(() => {
    try {
      const rawBackup = localStorage.getItem(IMPERSONATE_BACKUP_KEY);
      if (rawBackup) {
        const adminUser = JSON.parse(rawBackup) as AuthUser;
        localStorage.removeItem(IMPERSONATE_BACKUP_KEY);
        setAuth(token || "admin-token", adminUser as unknown as Record<string, unknown>);
        setUser(adminUser);
        return;
      }
    } catch {
      // Ignore parse error
    }
    // Default fallback to Admin
    login("admin@vasp.com", "Happy123");
  }, [token, login]);

  const logout = useCallback(() => {
    localStorage.removeItem(IMPERSONATE_BACKUP_KEY);
    clearAuth();
    setToken(null);
    setUser(null);
    window.location.href = "/login";
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, impersonateUser, exitImpersonation }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
