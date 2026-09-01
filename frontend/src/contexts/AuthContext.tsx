import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { loginRequest, logoutRequest, meRequest } from "../services/auth.service";
import { setAccessToken } from "../services/authToken";

export type Role = "ALUMNO" | "PROFESOR" | "ADMIN";

export interface User {
  id: string;
  username: string;
  name: string;
  lastName: string;
  role: Role;
}

interface AuthContextValue {
  user: User | null;
  isAuthenticating: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const STORAGE_KEY = "eduai.session";

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const [user, setUser] = useState<User | null>(() => readStoredUser());
  const [isAuthenticating, setIsAuthenticating] = useState(true);

  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [user]);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      const u = await loginRequest(email, password);
      setUser(u);
      return true;
    } catch {
      // credenciales inválidas / error de red
      setUser(null);
      setAccessToken(null);
      return false;
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    await logoutRequest();
    setUser(null);
  }, []);

  // Al montar, intentamos restaurar la sesión desde el backend (refresh cookie / /me)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const u = await meRequest();
        if (mounted) setUser(u);
      } catch {
        if (mounted) setUser(null);
      } finally {
        if (mounted) setIsAuthenticating(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticating, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
