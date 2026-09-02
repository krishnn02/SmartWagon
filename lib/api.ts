const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.vaspsystemic.com/smart_coach_api/api";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("smart_coach_token");
}

export function setAuth(token: string, user: Record<string, unknown>) {
  localStorage.setItem("smart_coach_token", token);
  localStorage.setItem("smart_coach_user", JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem("smart_coach_token");
  localStorage.removeItem("smart_coach_user");
}

export function getStoredUser(): Record<string, unknown> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("smart_coach_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

export async function apiGet<T = unknown>(path: string, params?: Record<string, string>): Promise<T> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const url = new URL(`${API_BASE}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, v);
    });
  }

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 401) {
    clearAuth();
    throw new Error("Session expired. Please login again.");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || body.message || `API error ${res.status}`);
  }

  return res.json();
}

export async function apiPost<T = unknown>(path: string, body: unknown): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (res.status === 401) {
    clearAuth();
    throw new Error("Session expired. Please login again.");
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.message || `API error ${res.status}`);
  return data;
}
