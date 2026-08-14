import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { auth, getToken, type EvUser } from "./api";

type AuthState = {
  user: EvUser | null;
  ready: boolean;
  setUser: (u: EvUser | null) => void;
  refresh: () => Promise<void>;
  signOut: () => void;
};

const Ctx = createContext<AuthState>({
  user: null, ready: false, setUser: () => {}, refresh: async () => {}, signOut: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<EvUser | null>(null);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    if (!getToken()) { setUser(null); setReady(true); return; }
    try {
      const d = await auth.me();
      if (d.authenticated && d.user) setUser(d.user);
      else { auth.logout(); setUser(null); }
    } catch {
      setUser(null);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const signOut = useCallback(() => { auth.logout(); setUser(null); }, []);

  return <Ctx.Provider value={{ user, ready, setUser, refresh, signOut }}>{children}</Ctx.Provider>;
}

export function useAuth() { return useContext(Ctx); }
