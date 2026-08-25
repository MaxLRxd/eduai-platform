import React, { useState } from "react";
import { useEnrollment } from "../../hooks/useEnrollment";
import { Card, CardHeader } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { InfoBox } from "../../components/ui/InfoBox";

export function StudentEnrollPage(): React.ReactElement {
  const [code, setCode] = useState("");
  const { mutate, data, isPending } = useEnrollment();

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!code.trim()) return;
    mutate(code);
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-[22px] font-extrabold text-text-1 tracking-tight mb-1">Inscribirse a materia</h2>
        <p className="text-[13px] text-text-2">
          Ingresá la clave de matriculación provista por el docente o el administrador para inscribirte a una materia.
        </p>
      </div>

      <div className="max-w-md">
        <Card>
          <CardHeader title="🔑 Clave de matriculación" />
          <p className="text-[13px] text-text-2 mb-4.5">
            El docente o el administrador te habrá entregado una clave para acceder a la materia. Ingresala a continuación.
          </p>

          {data && (
            <div
              className={`rounded px-3.5 py-2.5 text-[13px] font-medium mb-4 border ${
                data.success ? "bg-info-light border-blue-200 text-blue-900" : "bg-danger-light border-red-300 text-red-800"
              }`}
              role={data.success ? "status" : "alert"}
            >
              {data.message}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3.5">
              <label htmlFor="enroll-code" className="block text-xs font-semibold text-text-1 mb-1.5">
                Clave de matriculación
              </label>
              <input
                id="enroll-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Ej: PROG2-2024"
                className="w-full px-3 py-2 border border-border rounded font-mono text-[15px] tracking-wide uppercase focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(0,61,122,0.1)]"
              />
              <div className="text-[11px] text-text-3 mt-1.5">Los espacios y caracteres especiales se eliminan automáticamente.</div>
            </div>
            <Button type="submit" fullWidth className="justify-center" disabled={isPending}>
              {isPending ? "Verificando…" : "Inscribirse"}
            </Button>
          </form>
        </Card>

        <div className="mt-5">
          <InfoBox variant="info">ℹ️ Si no tenés la clave, contactá al docente de la materia para que te la facilite.</InfoBox>
        </div>
      </div>
    </div>
  );
}
