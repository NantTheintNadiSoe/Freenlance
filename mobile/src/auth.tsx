import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api } from "./api";
import { getSession, setSession } from "./storage";
import type { Session, User } from "./types";

type AuthValue = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  login(email: string, password: string): Promise<void>;
  register(input: Parameters<typeof api.register>[0]): Promise<void>;
  logout(): Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function restoreSession() {
      try {
        const stored = await getSession();
        if (!stored) return;
        const { data } = await api.me();
        const next = { ...stored, user: data };
        await setSession(next);
        if (mounted) setSessionState(next);
      } catch {
        await setSession(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void restoreSession();
    return () => { mounted = false; };
  }, []);

  const value = useMemo<AuthValue>(() => ({
    session,
    user: session?.user ?? null,
    loading,
    async login(email, password) {
      const { data } = await api.login({ email: email.trim(), password });
      await setSession(data);
      setSessionState(data);
    },
    async register(input) {
      const { data } = await api.register(input);
      await setSession(data);
      setSessionState(data);
    },
    async logout() {
      if (session) await api.logout(session.refreshToken).catch(() => undefined);
      await setSession(null);
      setSessionState(null);
    }
  }), [loading, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used within AuthProvider");
  return value;
}