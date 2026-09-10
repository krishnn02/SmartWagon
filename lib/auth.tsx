"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { setAuth, clearAuth, getStoredUser } from "@/lib/api";
import { getUserByEmail, recordUserLogin, recordUserLogout, type UserConsoleProfile } from "@/lib/user-store";
import { resetAppQueries } from "@/components/providers";

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
  refreshCurrentUser: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: true,
  login: async () => {},
  logout: () => {},
  impersonateUser: () => {},
  exitImpersonation: () => {},
  refreshCurrentUser: () => {},
});

const IMPERSONATE_BACKUP_KEY = "smart_coach_impersonate_backup";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Synchronize and reconcile active user session against freshest user-store permissions
  const syncUserFromStore = useCallback(() => {
    try {
      const stored = getStoredUser() as unknown as AuthUser | null;
      const t = typeof window !== "undefined" ? localStorage.getItem("smart_coach_token") : null;
      if (stored && t) {
        // Reconcile with latest profile in smart_coach_console_users
        const localUser = getUserByEmail(stored.email);
        if (localUser) {
          const [firstName, ...rest] = localUser.name.split(" ");
          const lastName = rest.join(" ") || "";

          // Device type must NOT be enabled if 0 devices are selected
          const allowedModules: ("brake-binding" | "hot-axle")[] = [];
          const hasBrakeDevices =
            localUser.role === "Administrator" ||
            localUser.allowedDevices?.["brake-binding"]?.includes("ALL") ||
            (localUser.allowedDevices?.["brake-binding"]?.length ?? 0) > 0;
          const hasAxleDevices =
            localUser.role === "Administrator" ||
            localUser.allowedDevices?.["hot-axle"]?.includes("ALL") ||
            (localUser.allowedDevices?.["hot-axle"]?.length ?? 0) > 0;

          if (localUser.role === "Administrator" || (localUser.allowedModules?.includes("brake-binding") && hasBrakeDevices)) {
            allowedModules.push("brake-binding");
          }
          if (localUser.role === "Administrator" || (localUser.allowedModules?.includes("hot-axle") && hasAxleDevices)) {
            allowedModules.push("hot-axle");
          }

          const reconciledUser: AuthUser = {
            ...stored,
            name: localUser.name,
            first_name: firstName,
            last_name: lastName,
            email: localUser.email,
            role: localUser.role,
            role_id: localUser.role === "Administrator" ? 1 : 2,
            zone_name: localUser.zone,
            division_name: localUser.division,
            allowedModules,
            allowedDevices: localUser.allowedDevices,
          };
          setAuth(t, reconciledUser as unknown as Record<string, unknown>);
          setUser(reconciledUser);
          setToken(t);
          return reconciledUser;
        } else {
          setUser(stored);
          setToken(t);
          return stored;
        }
      } else {
        setUser(null);
        setToken(null);
        return null;
      }
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    syncUserFromStore();
    setLoading(false);

    // 1. Same-window instant reactive synchronization
    const handlePermissionsUpdated = () => {
      syncUserFromStore();
      try {
        const { queryClientInstance } = require("@/components/providers");
        queryClientInstance.invalidateQueries();
      } catch {
        // ignore
      }
    };

    // 2. Cross-tab/cross-window reactive synchronization
    const handleStorageChange = (e: StorageEvent) => {
      if (
        !e.key ||
        e.key === "smart_coach_console_users" ||
        e.key === "smart_coach_user" ||
        e.key === "smart_coach_token"
      ) {
        syncUserFromStore();
        try {
          const { queryClientInstance } = require("@/components/providers");
          queryClientInstance.invalidateQueries();
        } catch {
          // ignore
        }
      }
    };

    if (typeof window !== "undefined") {
      const { USER_PERMISSIONS_UPDATED_EVENT } = require("@/lib/user-store");
      window.addEventListener(USER_PERMISSIONS_UPDATED_EVENT, handlePermissionsUpdated);
      window.addEventListener("storage", handleStorageChange);

      return () => {
        window.removeEventListener(USER_PERMISSIONS_UPDATED_EVENT, handlePermissionsUpdated);
        window.removeEventListener("storage", handleStorageChange);
      };
    }
  }, [syncUserFromStore]);

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

      // Filter allowed modules strictly based on whether user has selected devices
      const allowedModules: ("brake-binding" | "hot-axle")[] = [];
      const hasBrakeDevices =
        localUser.role === "Administrator" ||
        localUser.allowedDevices?.["brake-binding"]?.includes("ALL") ||
        (localUser.allowedDevices?.["brake-binding"]?.length ?? 0) > 0;
      const hasAxleDevices =
        localUser.role === "Administrator" ||
        localUser.allowedDevices?.["hot-axle"]?.includes("ALL") ||
        (localUser.allowedDevices?.["hot-axle"]?.length ?? 0) > 0;

      if (localUser.role === "Administrator" || (localUser.allowedModules?.includes("brake-binding") && hasBrakeDevices)) {
        allowedModules.push("brake-binding");
      }
      if (localUser.role === "Administrator" || (localUser.allowedModules?.includes("hot-axle") && hasAxleDevices)) {
        allowedModules.push("hot-axle");
      }

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
        allowedModules,
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

    const latest = getUserByEmail(targetUser.email) || targetUser;
    const [firstName, ...rest] = latest.name.split(" ");
    const lastName = rest.join(" ") || "";

    const allowedModules: ("brake-binding" | "hot-axle")[] = [];
    const hasBrakeDevices =
      latest.role === "Administrator" ||
      latest.allowedDevices?.["brake-binding"]?.includes("ALL") ||
      (latest.allowedDevices?.["brake-binding"]?.length ?? 0) > 0;
    const hasAxleDevices =
      latest.role === "Administrator" ||
      latest.allowedDevices?.["hot-axle"]?.includes("ALL") ||
      (latest.allowedDevices?.["hot-axle"]?.length ?? 0) > 0;

    if (latest.role === "Administrator" || (latest.allowedModules?.includes("brake-binding") && hasBrakeDevices)) {
      allowedModules.push("brake-binding");
    }
    if (latest.role === "Administrator" || (latest.allowedModules?.includes("hot-axle") && hasAxleDevices)) {
      allowedModules.push("hot-axle");
    }

    const simulatedUser: AuthUser = {
      user_id: latest.id,
      first_name: firstName,
      last_name: lastName,
      name: latest.name,
      email: latest.email,
      role_id: latest.role === "Administrator" ? 1 : 2,
      role: latest.role,
      zone_name: latest.zone,
      division_name: latest.division,
      allowedModules,
      allowedDevices: latest.allowedDevices,
      isImpersonating: true,
    };

    setAuth(token || "impersonate-token", simulatedUser as unknown as Record<string, unknown>);
    setUser(simulatedUser);

    try {
      const { queryClientInstance } = require("@/components/providers");
      queryClientInstance.invalidateQueries();
    } catch {
      // ignore
    }
  }, [user, token]);

  const exitImpersonation = useCallback(() => {
    try {
      const rawBackup = localStorage.getItem(IMPERSONATE_BACKUP_KEY);
      if (rawBackup) {
        const adminUser = JSON.parse(rawBackup) as AuthUser;
        localStorage.removeItem(IMPERSONATE_BACKUP_KEY);
        setAuth(token || "admin-token", adminUser as unknown as Record<string, unknown>);
        setUser(adminUser);
        try {
          const { queryClientInstance } = require("@/components/providers");
          queryClientInstance.invalidateQueries();
        } catch {
          // ignore
        }
        return;
      }
    } catch {
      // Ignore parse error
    }
    // Default fallback to Admin
    login("admin@vasp.com", "Happy123");
  }, [token, login]);

  const logout = useCallback(() => {
    if (user?.email) {
      recordUserLogout(user.email);
    }
    resetAppQueries();
    localStorage.removeItem(IMPERSONATE_BACKUP_KEY);
    clearAuth();
    setToken(null);
    setUser(null);
    window.location.href = "/login";
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        impersonateUser,
        exitImpersonation,
        refreshCurrentUser: syncUserFromStore,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
