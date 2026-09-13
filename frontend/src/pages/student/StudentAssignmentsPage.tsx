import React from "react";
import { useAssignments } from "../../hooks/useAssignments";
import { InfoBox } from "../../components/ui/InfoBox";
import { TableWrap, Table, Thead, Th, Td } from "../../components/ui/Table";
import { Tag, type TagColor } from "../../components/ui/Tag";
import { Button } from "../../components/ui/Button";
import type { AssignmentStatus } from "../../types/domain";

const STATUS_COLOR: Record<AssignmentStatus, TagColor> = {
  Pendiente: "amber",
  Entregado: "green",
  "En revisión": "blue",
};

export function StudentAssignmentsPage(): React.ReactElement {
  const { data: assignments, isLoading } = useAssignments();

  const pendientes = (assignments ?? []).filter((a) => a.status === "Pendiente");
  const entregadas = (assignments ?? []).filter((a) => a.status === "Entregado");

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-[22px] font-extrabold text-text-1 tracking-tight mb-1">Entregas pendientes</h2>
        <p className="text-[13px] text-text-2">Trabajos prácticos y evaluaciones · Semestre 2024</p>
      </div>

      {pendientes.length > 0 && (
        <InfoBox variant="warning">⚠️ Tenés {pendientes.length} entrega{pendientes.length === 1 ? "" : "s"} pendiente{pendientes.length === 1 ? "" : "s"}. Revisá los vencimientos antes de que sea tarde.</InfoBox>
      )}
      {assignments !== undefined && assignments.length > 0 && pendientes.length === 0 && (
        <InfoBox variant="info">✅ No tenés entregas pendientes. {entregadas.length} ya entregada{entregadas.length === 1 ? "" : "s"}.</InfoBox>
      )}

      {isLoading && <p className="text-sm text-text-2">Cargando entregas…</p>}

      <TableWrap>
        <Table ariaLabel="Tabla de entregas">
          <Thead>
            <tr>
              <Th>Actividad</Th>
              <Th>Curso</Th>
              <Th>Vencimiento</Th>
              <Th>Estado</Th>
              <Th>Acciones</Th>
            </tr>
          </Thead>
          <tbody>
            {(assignments ?? []).map((a) => (
              <tr key={a.title} className="hover:bg-surface-2">
                <Td className="font-semibold text-text-1">{a.title}</Td>
                <Td>{a.course}</Td>
                <Td className="font-mono text-xs">{a.dueDate}</Td>
                <Td>
                  <Tag color={STATUS_COLOR[a.status]}>{a.status}</Tag>
                </Td>
                <Td>
                  <Button size="sm" variant={a.status === "Entregado" ? "secondary" : "primary"}>
                    {a.status === "Entregado" ? "Ver nota" : "Enviar"}
                  </Button>
                </Td>
              </tr>
            ))}
            {!isLoading && (assignments ?? []).length === 0 && (
              <tr>
                <Td colSpan={5} className="text-center text-[12px] text-text-3 py-4">
                  No hay actividades cargadas todavía.
                </Td>
              </tr>
            )}
          </tbody>
        </Table>
      </TableWrap>
    </div>
  );
}
