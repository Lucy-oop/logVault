"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { AuthResponse, UserResponse } from "@/types/api";

const STORAGE_KEY = "blogfox.auth";
const COOKIE_NAME = "lv_auth";

type AuthState = {
  token: string | null;
  user: UserResponse | null;
};

type AuthContextValue = AuthState & {
  setAuth: (auth: AuthResponse) => void;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function readStored(): AuthState {
  if (typeof window === "undefined") return { token: null, user: null };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { token: null, user: null };
    const parsed = JSON.parse(raw) as { token: string; user: UserResponse; expiresAt: string };
    if (new Date(parsed.expiresAt).getTime() < Date.now()) {
      localStorage.removeItem(STORAGE_KEY);
      clearAuthCookie();
      return { token: null, user: null };
    }
    return { token: parsed.token, user: parsed.user };
  } catch {
    return { token: null, user: null };
  }
}

// Write a cookie the *server* can read on subsequent requests so server components
// (e.g. /posts/[slug]) can forward an auth header and admins/owners can read
// non-public posts (Hidden / Pending) via SSR. The cookie carries only the JWT;
// the user object stays in localStorage.
function writeAuthCookie(token: string, expiresAtIso: string) {
  if (typeof document === "undefined") return;
  const expires = new Date(expiresAtIso).toUTCString();
  const isSecure = window.location.protocol === "https:";
  const attrs = [
    `${COOKIE_NAME}=${encodeURIComponent(token)}`,
    `Path=/`,
    `Expires=${expires}`,
    `SameSite=Lax`,
  ];
  if (isSecure) attrs.push("Secure");
  document.cookie = attrs.join("; ");
}

function clearAuthCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE_NAME}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ token: null, user: null });

  useEffect(() => {
    const stored = readStored();
    setState(stored);
    // Re-sync the cookie on every load — if localStorage has a valid token but
    // the cookie was wiped (private window, manual clear), restore it.
    if (stored.token) {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as { expiresAt: string };
          writeAuthCookie(stored.token, parsed.expiresAt);
        }
      } catch { /* swallow */ }
    }
  }, []);

  const setAuth = useCallback((auth: AuthResponse) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
    writeAuthCookie(auth.token, auth.expiresAt);
    setState({ token: auth.token, user: auth.user });
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    clearAuthCookie();
    setState({ token: null, user: null });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ ...state, setAuth, signOut }),
    [state, setAuth, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
