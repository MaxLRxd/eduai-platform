import React, { useState } from "react";
import { useAdminSubjects, useSaveAdminSubject } from "../../hooks/useAdminSubjects";
import { ADMIN_PROFESSORS } from "../../data/mock/adminSubjects.mock";
import { Card, CardHeader } from "../../components/ui/Card";
import { TableWrap, Table, Thead, Th, Td } from "../../components/ui/Table";
import { Tag, type TagColor } from "../../components/ui/Tag";
import { Button } from "../../components/ui/Button";
import type { SubjectStatus } from "../../types/domain";

const STATUS_COLOR: Record<SubjectStatus, TagColor> = { Activa: "green", Pendiente: "amber", Inactiva: "gray" };

const EMPTY_FORM = { id: "", nombre: "", profesor: "", alumnos: "", estado: "Activa" as SubjectStatus };

export function AdminMateriasPage(): React.ReactElement {
  const { data: subjects, isLoading } = useAdminSubjects();
  const save = useSaveAdminSubject();
  const [form, setForm] = useState(EMPTY_FORM);
  const [message, setMessage] = useState("");

  const handleSave = (): void => {
    if (!form.id || !form.nombre) {
      setMessage("Completá al menos el ID y el nombre de la materia.");
      return;
    }
    save.mutate(
      { id: form.id, nombre: form.nombre, profesor: form.profesor, alumnos: Number(form.alumnos) || 0, estado: form.estado },
      {
        onSuccess: () => {
          setMessage(`✅ "${form.nombre}" guardada correctamente.`);
          setForm(EMPTY_FORM);
        },
      }
    );
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-[22px] font-extrabold text-text-1 tracking-tight mb-1">Gestión de materias</h2>
        <p className="text-[13px] text-text-2">Crear, editar, asignar docentes y administrar el estado de las materias</p>
      </div>

      <div className="grid xl:grid-cols-[2fr_1fr] gap-5">
        <div>
          {isLoading && <p className="text-sm text-text-2">Cargando materias…</p>}
          <TableWrap>
            <Table ariaLabel="Materias institucionales">
              <Thead>
                <tr>
                  <Th>ID</Th>
                  <Th>Materia</Th>
                  <Th>Docente</Th>
                  <Th>Alumnos</Th>
                  <Th>Estado</Th>
                  <Th>Acciones</Th>
                </tr>
              </Thead>
              <tbody>
                {(subjects ?? []).map((s) => (
                  <tr key={s.id} className="hover:bg-surface-2">
                    <Td className="font-mono text-xs">{s.id}</Td>
                    <Td className="font-semibold text-text-1">{s.nombre}</Td>
                    <Td>{s.profesor || "— Sin asignar —"}</Td>
                    <Td>{s.alumnos}</Td>
                    <Td>
                      <Tag color={STATUS_COLOR[s.estado]}>{s.estado}</Tag>
                    </Td>
                    <Td>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setForm({ id: s.id, nombre: s.nombre, profesor: s.profesor, alumnos: String(s.alumnos), estado: s.estado })
                        }
                      >
                        Editar
                      </Button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableWrap>
        </div>

        <Card>
          <CardHeader title={form.id && subjects?.some((s) => s.id === form.id) ? "Editar materia" : "Nueva materia"} />
          <div className="mb-3.5">
            <label htmlFor="materia-id" className="block text-xs font-semibold text-text-1 mb-1.5">
              ID de referencia
            </label>
            <input
              id="materia-id"
              value={form.id}
              onChange={(e) => setForm({ ...form, id: e.target.value })}
              placeholder="Ej: 106"
              className="w-full px-3 py-2 border border-border rounded text-sm"
            />
          </div>
          <div className="mb-3.5">
            <label htmlFor="materia-nombre" className="block text-xs font-semibold text-text-1 mb-1.5">
              Nombre de la materia
            </label>
            <input
              id="materia-nombre"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              placeholder="Ej: Física I"
              className="w-full px-3 py-2 border border-border rounded text-sm"
            />
          </div>
          <div className="mb-3.5">
            <label htmlFor="materia-profesor" className="block text-xs font-semibold text-text-1 mb-1.5">
              Docente asignado
            </label>
            <select
              id="materia-profesor"
              value={form.profesor}
              onChange={(e) => setForm({ ...form, profesor: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded text-sm bg-surface"
            >
              <option value="">— Sin asignar —</option>
              {ADMIN_PROFESSORS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-3.5">
            <label htmlFor="materia-alumnos" className="block text-xs font-semibold text-text-1 mb-1.5">
              Cantidad de alumnos
            </label>
            <input
              id="materia-alumnos"
              value={form.alumnos}
              onChange={(e) => setForm({ ...form, alumnos: e.target.value })}
              placeholder="Ej: 32"
              className="w-full px-3 py-2 border border-border rounded text-sm"
            />
          </div>
          <div className="mb-3.5">
            <label htmlFor="materia-estado" className="block text-xs font-semibold text-text-1 mb-1.5">
              Estado
            </label>
            <select
              id="materia-estado"
              value={form.estado}
              onChange={(e) => setForm({ ...form, estado: e.target.value as SubjectStatus })}
              className="w-full px-3 py-2 border border-border rounded text-sm bg-surface"
            >
              <option value="Activa">Activa</option>
              <option value="Pendiente">Pendiente</option>
              <option value="Inactiva">Inactiva</option>
            </select>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={save.isPending}>
              {save.isPending ? "Guardando…" : "Guardar"}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setForm(EMPTY_FORM);
                setMessage("");
              }}
            >
              Limpiar
            </Button>
          </div>
          {message && <p className="text-xs text-text-2 mt-2">{message}</p>}
        </Card>
      </div>
    </div>
  );
}
