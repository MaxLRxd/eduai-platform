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
  login: (role: Role, username: string, password: string) => boolean;
  logout: () => void;
}

const STORAGE_KEY = "eduai.session";

// Credenciales demo — reemplazar por el login real (JWT) cuando el backend
// tenga el módulo de autenticación (CU-AD03 / Sprint 1). Mismo esquema que
// la maqueta: un usuario/contraseña fijo por rol.
const DEMO_CREDENTIALS: Record<Role, { username: string; password: string; profile: Omit<User, "id" | "username" | "role"> }> = {
  ALUMNO: { username: "alumno", password: "alumno123", profile: { name: "Lautaro", lastName: "Acevedo" } },
  PROFESOR: { username: "docente", password: "docente123", profile: { name: "Prof.", lastName: "Martínez" } },
  ADMIN: { username: "admin", password: "admin123", profile: { name: "Admin", lastName: "IES Santa Fe" } },
};

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

  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [user]);

  const login = useCallback((role: Role, username: string, password: string): boolean => {
    const cred = DEMO_CREDENTIALS[role];
    if (username !== cred.username || password !== cred.password) {
      return false;
    }
    setUser({ id: `demo-${role.toLowerCase()}`, username, role, ...cred.profile });
    return true;
  }, []);

  const logout = useCallback(() => setUser(null), []);

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
