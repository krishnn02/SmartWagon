export type UserRole =
  | "Administrator"
  | "Divisional Engineer"
  | "Station Supervisor"
  | "Section Inspector"
  | "Maintenance Staff";

export interface UserConsoleProfile {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  zone: string;
  division: string;
  allowedModules: ("brake-binding" | "hot-axle")[];
  allowedDevices: {
    "brake-binding"?: string[];
    "hot-axle"?: string[];
  };
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  status?: "online" | "idle" | "offline";
}

const STORAGE_KEY = "smart_coach_console_users";
const SESSIONS_KEY = "smart_coach_active_sessions";

export const INITIAL_USERS: UserConsoleProfile[] = [
  {
    id: "usr-admin",
    name: "System Administrator",
    email: "admin@vasp.com",
    password: "Happy123",
    role: "Administrator",
    zone: "All Zones (HQ / Railway Board)",
    division: "Headquarters & All Divisions",
    allowedModules: ["brake-binding", "hot-axle"],
    allowedDevices: {
      "brake-binding": ["ALL"],
      "hot-axle": ["ALL"],
    },
    isActive: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    lastLoginAt: new Date().toISOString(),
    status: "online",
  },
  {
    id: "usr-howrah",
    name: "SSE C&W Howrah Yard",
    email: "sse.howrah@railnet.gov.in",
    password: "Rail@123",
    role: "Station Supervisor",
    zone: "Eastern Railway",
    division: "Howrah",
    allowedModules: ["brake-binding"],
    allowedDevices: {
      "brake-binding": [
        "SCBB-HWH-26-001",
        "SCBB-HWH-26-002",
        "SCBB-HWH-26-003",
      ],
    },
    isActive: true,
    createdAt: "2026-03-01T10:00:00.000Z",
    lastLoginAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    status: "online",
  },
  {
    id: "usr-jaipur",
    name: "Sr. DE C&W Jaipur",
    email: "den.jaipur@railnet.gov.in",
    password: "Rail@123",
    role: "Divisional Engineer",
    zone: "North Western Railway",
    division: "Jaipur",
    allowedModules: ["brake-binding"],
    allowedDevices: {
      "brake-binding": [
        "S5-19711/SCBB-JP-26-002",
        "S5-22799/SCBB-JP-26-001",
        "SCBB-JP-26-003",
        "SCBB-JP-26-004",
      ],
    },
    isActive: true,
    createdAt: "2026-03-10T12:00:00.000Z",
    lastLoginAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    status: "idle",
  },
  {
    id: "usr-nagpur",
    name: "Nagpur Axle Depot Inspector",
    email: "axle.nagpur@railnet.gov.in",
    password: "Rail@123",
    role: "Section Inspector",
    zone: "Central Railway",
    division: "Nagpur",
    allowedModules: ["hot-axle"],
    allowedDevices: {
      "hot-axle": ["SCBB - NP-003", "Raspberry4_7"],
    },
    isActive: true,
    createdAt: "2026-04-05T09:00:00.000Z",
    lastLoginAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    status: "offline",
  },
];

export function getUsers(): UserConsoleProfile[] {
  if (typeof window === "undefined") return INITIAL_USERS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    }
    const parsed = JSON.parse(raw) as UserConsoleProfile[];
    // Ensure admin@vasp.com is always present
    const hasAdmin = parsed.some((u) => u.email.toLowerCase() === "admin@vasp.com");
    if (!hasAdmin) {
      const merged = [INITIAL_USERS[0], ...parsed];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      return merged;
    }
    return parsed;
  } catch {
    return INITIAL_USERS;
  }
}

export function getUserByEmail(emailOrUsername: string): UserConsoleProfile | undefined {
  if (!emailOrUsername) return undefined;
  const users = getUsers();
  const normalized = emailOrUsername.trim().toLowerCase();

  // 1. Exact email match
  let found = users.find((u) => u.email.toLowerCase() === normalized);
  if (found) return found;

  // 2. User ID match (e.g. "usr-nagpur", "usr-howrah", "usr-admin")
  found = users.find((u) => u.id.toLowerCase() === normalized);
  if (found) return found;

  // 3. Username prefix match (e.g. "axle.nagpur" from "axle.nagpur@railnet.gov.in")
  found = users.find((u) => u.email.toLowerCase().split("@")[0] === normalized);
  if (found) return found;

  // 4. Division match (e.g. "nagpur", "howrah", "jaipur")
  found = users.find((u) => u.division.toLowerCase() === normalized);
  if (found) return found;

  // 5. Name match (e.g. "Nagpur Axle Depot Inspector")
  found = users.find((u) => u.name.toLowerCase() === normalized || u.name.toLowerCase().includes(normalized));
  return found;
}

export const USER_PERMISSIONS_UPDATED_EVENT = "smart_coach_user_permissions_updated";

export function notifyUserPermissionsUpdated(updatedUserId?: string): void {
  if (typeof window === "undefined") return;

  try {
    // 1. Only sync to localStorage["smart_coach_user"] IF the currently active session belongs to the user who was updated
    const currentStoredUserRaw = localStorage.getItem("smart_coach_user");
    if (currentStoredUserRaw) {
      const currentStoredUser = JSON.parse(currentStoredUserRaw);
      const allUsers = getUsers();

      const isCurrentSessionUserUpdated =
        !updatedUserId ||
        updatedUserId === currentStoredUser.user_id ||
        (currentStoredUser.email &&
          allUsers.some(
            (u) =>
              u.id === updatedUserId &&
              u.email.toLowerCase() === (currentStoredUser.email || "").toLowerCase()
          ));

      if (isCurrentSessionUserUpdated) {
        const matched = allUsers.find(
          (u) =>
            u.id === currentStoredUser.user_id ||
            u.email.toLowerCase() === (currentStoredUser.email || "").toLowerCase()
        );

        if (matched) {
          const [firstName, ...rest] = matched.name.split(" ");
          const lastName = rest.join(" ") || "";

          const updatedSession = {
            ...currentStoredUser,
            name: matched.name,
            first_name: firstName,
            last_name: lastName,
            email: matched.email,
            role: matched.role,
            role_id: matched.role === "Administrator" ? 1 : 2,
            zone_name: matched.zone,
            division_name: matched.division,
            allowedModules: matched.allowedModules,
            allowedDevices: matched.allowedDevices,
          };

          localStorage.setItem("smart_coach_user", JSON.stringify(updatedSession));
        }
      }
    }
  } catch (err) {
    console.warn("Error auto-syncing active session in localStorage:", err);
  }

  // 2. Dispatch custom event for same-tab instant reactivity
  window.dispatchEvent(
    new CustomEvent(USER_PERMISSIONS_UPDATED_EVENT, {
      detail: { userId: updatedUserId, timestamp: Date.now() },
    })
  );

  // 3. Dispatch storage event for other open tabs/windows
  try {
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: STORAGE_KEY,
        newValue: localStorage.getItem(STORAGE_KEY),
      })
    );
  } catch {
    // Ignore storage event dispatch error
  }
}

export function saveUsers(users: UserConsoleProfile[], updatedUserId?: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
    notifyUserPermissionsUpdated(updatedUserId);
  } catch (err) {
    console.error("Failed to save users to localStorage:", err);
  }
}

export function createUser(data: Omit<UserConsoleProfile, "id" | "createdAt" | "lastLoginAt">): UserConsoleProfile {
  const users = getUsers();
  const newUser: UserConsoleProfile = {
    ...data,
    id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    createdAt: new Date().toISOString(),
    lastLoginAt: null,
    status: "offline",
  };

  const updated = [newUser, ...users];
  saveUsers(updated, newUser.id);
  return newUser;
}

export function updateUser(id: string, updates: Partial<UserConsoleProfile>): UserConsoleProfile | undefined {
  const users = getUsers();
  const index = users.findIndex((u) => u.id === id);
  if (index === -1) return undefined;

  const updatedUser = { ...users[index], ...updates };
  users[index] = updatedUser;
  saveUsers(users, id);
  return updatedUser;
}

export function deleteUser(id: string): boolean {
  const users = getUsers();
  const target = users.find((u) => u.id === id);
  if (!target) return false;
  if (target.email.toLowerCase() === "admin@vasp.com") {
    throw new Error("Cannot delete master administrator account.");
  }

  const updated = users.filter((u) => u.id !== id);
  saveUsers(updated, id);
  return true;
}

export function recordUserLogin(email: string): void {
  const users = getUsers();
  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  const now = new Date().toISOString();

  if (user) {
    user.lastLoginAt = now;
    user.status = "online";
    saveUsers(users);
  }

  // Also log into active sessions list
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(SESSIONS_KEY);
      const sessions = raw ? JSON.parse(raw) : [];
      const filtered = sessions.filter((s: { email: string }) => s.email.toLowerCase() !== email.toLowerCase());
      filtered.unshift({
        email,
        name: user?.name || email,
        role: user?.role || "Staff",
        zone: user?.zone || "Central Railway",
        division: user?.division || "HQ",
        lastLoginAt: now,
        status: "online",
      });
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(filtered.slice(0, 30)));
    } catch {
      // Ignore session log error
    }
  }
}

export function recordUserLogout(email: string): void {
  const users = getUsers();
  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

  if (user) {
    user.status = "offline";
    saveUsers(users);
  }

  // Also update active sessions list
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(SESSIONS_KEY);
      if (raw) {
        const sessions = JSON.parse(raw) as ActiveSessionRecord[];
        const updated = sessions.map((s) =>
          s.email.toLowerCase() === email.toLowerCase() ? { ...s, status: "offline" } : s
        );
        localStorage.setItem(SESSIONS_KEY, JSON.stringify(updated));
      }
    } catch {
      // Ignore session log error
    }
  }
}

export interface ActiveSessionRecord {
  email: string;
  name: string;
  role: string;
  zone: string;
  division: string;
  lastLoginAt: string | null;
  status: string;
}

export function getActiveSessions(): ActiveSessionRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    if (!raw) {
      // Seed default active sessions matching initial users
      return INITIAL_USERS.map((u) => ({
        email: u.email,
        name: u.name,
        role: u.role,
        zone: u.zone,
        division: u.division,
        lastLoginAt: u.lastLoginAt || new Date().toISOString(),
        status: u.status || "online",
      }));
    }
    return JSON.parse(raw) as ActiveSessionRecord[];
  } catch {
    return [];
  }
}
