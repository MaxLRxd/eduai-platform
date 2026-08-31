import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

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
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
}

const STORAGE_KEY = "eduai.session";

// Login real contra el backend (módulo auth): POST /api/auth/login (JWT).
// El backend guarda el refresh token en una cookie httpOnly y el accessToken
// se conserva en localStorage a través de services/api.ts.
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

  useEffect(() => {
    let cancelled = false;

    async function restore(): Promise<void> {
      const { meRequest } = await import("../services/auth.service");
      try {
        const usuario = await meRequest();
        if (!cancelled) setUser(toFrontendUser(usuario));
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setIsAuthenticating(false);
      }
    }

    void restore();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<User> => {
    const { loginRequest } = await import("../services/auth.service");
    const { usuario } = await loginRequest(email, password);
    const frontendUser = toFrontendUser(usuario);
    setUser(frontendUser);
    return frontendUser;
  }, []);

  const logout = useCallback((): void => {
    void (async () => {
      const { logoutRequest } = await import("../services/auth.service");
      await logoutRequest();
      setUser(null);
    })();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticating, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function toFrontendUser(usuario: {
  id: string;
  nombre: string;
  email: string;
  rol: string;
}): User {
  const role = toFrontendRole(usuario.rol);
  return {
    id: usuario.id,
    username: usuario.email,
    name: usuario.nombre,
    lastName: "",
    role,
  };
}

function toFrontendRole(rol: string): Role {
  if (rol === "PROFESOR") return "PROFESOR";
  if (rol === "ADMIN") return "ADMIN";
  return "ALUMNO";
}

function readStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
