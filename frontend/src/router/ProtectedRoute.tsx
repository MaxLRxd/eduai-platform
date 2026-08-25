import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth, type Role } from "../contexts/AuthContext";
import { DEFAULT_PATH_BY_ROLE } from "./navConfig";

export function ProtectedRoute({
  children,
  allow,
}: {
  children: React.ReactNode;
  allow: Role;
}): React.ReactElement {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (user.role !== allow) {
    return <Navigate to={DEFAULT_PATH_BY_ROLE[user.role]} replace />;
  }
  return <>{children}</>;
}
