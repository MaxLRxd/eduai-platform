import { Route, Routes, Navigate } from "react-router-dom";
import React from "react";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ProtectedRoute } from "./router/ProtectedRoute";
import { useAuth } from "./contexts/AuthContext";

export function App(): React.ReactElement {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="*"
        element={
          <Navigate to={user ? "/" : "/login"} replace />
        }
      />
    </Routes>
  );
}