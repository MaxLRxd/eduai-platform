import React from "react";
import { useBranding } from "../../contexts/BrandingContext";

/** Marco de las pantallas públicas (recuperación de contraseña): mismo aspecto que el login. */
export function AuthLayout({ titulo, children }: { titulo: string; children: React.ReactNode }): React.ReactElement {
  const branding = useBranding();
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-[#001a3a] via-primary to-[#005fa3] overflow-y-auto">
      <div className="bg-surface rounded-xl shadow-lg w-full max-w-md p-10 pt-11 pb-9 m-4">
        <div className="text-center mb-7">
          <h1 className="font-display text-2xl font-extrabold text-primary tracking-tight">{branding?.nombre || "EduAI"}</h1>
          <p className="text-sm font-semibold text-text-1 mt-3">{titulo}</p>
        </div>
        {children}
      </div>
    </div>
  );
}

export const inputClase =
  "w-full px-3.5 py-2.5 border-[1.5px] border-border rounded text-sm focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(0,61,122,0.1)]";
export const botonClase =
  "w-full py-3 rounded bg-gradient-to-br from-primary to-secondary text-white font-bold text-sm shadow-[0_4px_12px_rgba(0,61,122,0.25)] disabled:opacity-60 disabled:cursor-not-allowed";
