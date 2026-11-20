import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AuthLayout, botonClase, inputClase } from "../components/layout/AuthLayout";
import { apiErrorMessage } from "../services/api";
import { resetPasswordRequest } from "../services/auth.service";

const MIN_LENGTH = 8;

export function ResetPasswordPage(): React.ReactElement {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enlaceMuerto, setEnlaceMuerto] = useState(false);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (password.length < MIN_LENGTH) {
      setError(`La contraseña debe tener al menos ${MIN_LENGTH} caracteres.`);
      return;
    }
    if (password !== confirm) {
      setError("La confirmación no coincide con la contraseña.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await resetPasswordRequest(token, password);
      setDone(true);
    } catch (err) {
      setError(apiErrorMessage(err, "No se pudo cambiar la contraseña."));
      // 400 por enlace vencido o ya usado: lo único que sirve es pedir otro.
      setEnlaceMuerto(/enlace/i.test(apiErrorMessage(err, "")));
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <AuthLayout titulo="Enlace inválido">
        <p className="text-[13px] text-text-2 mb-5">El enlace está incompleto. Pedí uno nuevo desde la pantalla de ingreso.</p>
        <p className="text-center text-[13px]">
          <Link to="/recuperar" className="text-primary font-semibold hover:underline">
            Pedir un enlace nuevo
          </Link>
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout titulo="Elegí una contraseña nueva">
      {done ? (
        <>
          <div role="status" className="bg-green-50 border border-green-200 rounded px-4 py-3.5 text-[13px] text-green-800 mb-5">
            Listo: cambiaste tu contraseña y cerramos tus sesiones abiertas. Ya podés ingresar con la nueva.
          </div>
          <Link to="/login" className={`${botonClase} block text-center`}>
            Ir al ingreso
          </Link>
        </>
      ) : (
        <form onSubmit={(e) => void handleSubmit(e)}>
          <label htmlFor="password" className="block text-[13px] font-semibold text-text-1 mb-1.5">
            Contraseña nueva
          </label>
          <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={`${inputClase} mb-4`} />
          <label htmlFor="confirm" className="block text-[13px] font-semibold text-text-1 mb-1.5">
            Repetí la contraseña
          </label>
          <input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={`${inputClase} mb-4`} />
          {error && (
            <div role="alert" className="bg-danger-light border border-red-300 rounded px-3.5 py-2.5 text-[13px] text-red-800 font-medium mb-4">
              {error}{" "}
              {enlaceMuerto && (
                <Link to="/recuperar" className="underline font-semibold">
                  Pedir otro enlace
                </Link>
              )}
            </div>
          )}
          <button type="submit" disabled={loading} className={botonClase}>
            {loading ? "Guardando…" : "Cambiar contraseña"}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
