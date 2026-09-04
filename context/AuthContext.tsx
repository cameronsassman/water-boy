// context/auth-context.tsx
"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Role = "super_admin" | "scorer" | null;
type AuthContextType = { role: Role; login: (password: string) => Role; logout: () => void };
const AuthContext = createContext<AuthContextType | null>(null);

// IMPORTANT: this is a lightweight client-side deterrent only. Both
// passwords ship inside the client JS bundle (anyone can read them via
// devtools), and this gate only hides the admin UI — it does NOT protect
// the underlying Supabase writes, which are still governed entirely by
// the anon key and your RLS policies. Real access control still needs
// Supabase Auth + RLS tied to an authenticated role. Fails closed if an
// env var isn't set — that password just won't match anything.
const SUPER_ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? "";
const SCORER_PASSWORD = process.env.NEXT_PUBLIC_SCORER_PASSWORD ?? "";
const STORAGE_KEY = "wp_admin_role";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored === "super_admin" || stored === "scorer") setRole(stored);
  }, []);

  function login(password: string): Role {
    let matched: Role = null;
    if (SUPER_ADMIN_PASSWORD && password === SUPER_ADMIN_PASSWORD) matched = "super_admin";
    else if (SCORER_PASSWORD && password === SCORER_PASSWORD) matched = "scorer";

    if (matched) {
      sessionStorage.setItem(STORAGE_KEY, matched);
      setRole(matched);
    }
    return matched;
  }

  function logout() {
    sessionStorage.removeItem(STORAGE_KEY);
    setRole(null);
  }

  return <AuthContext.Provider value={{ role, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}