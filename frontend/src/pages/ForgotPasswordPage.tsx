import React, { useState } from "react";
import { Link } from "react-router-dom";
import { AuthLayout, botonClase, inputClase } from "../components/layout/AuthLayout";
import { apiErrorMessage } from "../services/api";
import { forgotPasswordRequest } from "../services/auth.service";

export function ForgotPasswordPage(): React.ReactElement {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Ingresá tu email.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await forgotPasswordRequest(email.trim());
      setSent(true);
    } catch (err) {
      setError(apiErrorMessage(err, "No se pudo procesar el pedido. Intentá de nuevo en unos minutos."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout titulo="Recuperar contraseña">
      {sent ? (
        <div role="status" className="bg-sky-50 border border-sky-200 rounded px-4 py-3.5 text-[13px] text-sky-800 mb-5">
          Si el email corresponde a una cuenta, te enviamos un enlace para restablecer la contraseña. Revisá tu bandeja de
          entrada (y el correo no deseado). El enlace vale 60 minutos.
        </div>
      ) : (
        <form onSubmit={(e) => void handleSubmit(e)}>
          <p className="text-[13px] text-text-2 mb-4">
            Ingresá el email de tu cuenta y te enviamos un enlace para elegir una contraseña nueva.
          </p>
          <label htmlFor="email" className="block text-[13px] font-semibold text-text-1 mb-1.5">
            Email
          </label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={`${inputClase} mb-4`} />
          {error && (
            <div role="alert" className="bg-danger-light border border-red-300 rounded px-3.5 py-2.5 text-[13px] text-red-800 font-medium mb-4">
              {error}
            </div>
          )}
          <button type="submit" disabled={loading} className={botonClase}>
            {loading ? "Enviando…" : "Enviarme el enlace"}
          </button>
        </form>
      )}
      <p className="text-center text-[13px] mt-5">
        <Link to="/login" className="text-primary font-semibold hover:underline">
          Volver al ingreso
        </Link>
      </p>
    </AuthLayout>
  );
}
