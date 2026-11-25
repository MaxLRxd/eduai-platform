import React from "react";
import { useAdminLicensing } from "../../hooks/useAdminLicensing";
import { Card, CardHeader } from "../../components/ui/Card";
import { Tag } from "../../components/ui/Tag";
import { InfoBox } from "../../components/ui/InfoBox";
import { apiErrorMessage } from "../../services/api";

export function AdminLicenciasPage(): React.ReactElement {
  const { data, error, isPending, refetch } = useAdminLicensing();
  const licencia = data?.licencia;
  const uso = data?.uso;

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-[22px] font-extrabold text-text-1 tracking-tight mb-1">Licencia</h2>
        <p className="text-[13px] text-text-2">
          Una única licencia con todo el producto, sin importar la cantidad de alumnos de la institución
        </p>
      </div>

      {error && (
        <InfoBox variant="error">
          {apiErrorMessage(error, "No se pudo cargar el estado de la licencia.")}{" "}
          <button type="button" className="underline font-semibold" onClick={() => void refetch()}>
            Reintentar
          </button>
        </InfoBox>
      )}

      <div className="grid xl:grid-cols-[2fr_1fr] gap-5">
        <Card>
          <CardHeader
            title={licencia?.nombre ?? (isPending ? "Cargando…" : "Licencia")}
            action={licencia ? <Tag color="green">Activa</Tag> : undefined}
          />
          <p className="text-[13px] text-text-2 mb-3">Qué incluye</p>
          {licencia ? (
            <ul className="flex flex-col gap-2">
              {licencia.incluye.map((item) => (
                <li key={item} className="flex gap-2 text-[13px] text-text-1">
                  <span aria-hidden className="text-success font-bold">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-text-3">{isPending ? "Cargando…" : "Sin datos"}</p>
          )}
        </Card>

        <Card>
          <CardHeader title="Uso de la institución" />
          <p className="text-xs text-text-2 mb-3">Informativo: no hay topes ni cobro por alumno.</p>
          <dl className="flex flex-col gap-2.5">
            {[
              ["Alumnos activos", uso?.alumnos],
              ["Docentes activos", uso?.docentes],
              ["Materias activas", uso?.materias],
            ].map(([etiqueta, valor]) => (
              <div key={String(etiqueta)} className="flex justify-between items-baseline">
                <dt className="text-[13px] text-text-2">{etiqueta}</dt>
                <dd className="font-display text-2xl font-extrabold text-text-1">{valor ?? "—"}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>
    </div>
  );
}
