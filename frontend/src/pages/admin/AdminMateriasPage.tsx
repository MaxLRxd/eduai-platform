import React, { useState } from "react";
import { useAdminProfessors } from "../../hooks/useAdminUsers";
import { useAdminSubjects, useAssignAdminProfessor, useSaveAdminSubject } from "../../hooks/useAdminSubjects";
import { Card, CardHeader } from "../../components/ui/Card";
import { TableWrap, Table, Thead, Th, Td } from "../../components/ui/Table";
import { Tag, type TagColor } from "../../components/ui/Tag";
import { Button } from "../../components/ui/Button";
import type { SubjectStatus } from "../../types/domain";

const STATUS_COLOR: Record<SubjectStatus, TagColor> = { Activa: "green", Pendiente: "amber", Inactiva: "gray" };

const EMPTY_FORM = {
  id: null as string | null,
  nombre: "",
  nivelEducativo: "",
  descripcion: "",
  activa: true,
  profesorId: "",
};

export function AdminMateriasPage(): React.ReactElement {
  const { data: subjects, isLoading } = useAdminSubjects();
  const { data: professors } = useAdminProfessors();
  const save = useSaveAdminSubject();
  const assign = useAssignAdminProfessor();

  const [form, setForm] = useState(EMPTY_FORM);
  const [message, setMessage] = useState("");

  const handleSave = (): void => {
    if (!form.nombre.trim() || !form.nivelEducativo.trim()) {
      setMessage("Completá el nombre y el nivel educativo de la materia.");
      return;
    }
    save.mutate(
      {
        id: form.id,
        nombre: form.nombre.trim(),
        nivelEducativo: form.nivelEducativo.trim(),
        descripcion: form.descripcion,
        activa: form.activa,
      },
      {
        onSuccess: (materia) => {
          if (form.profesorId) {
            assign.mutate({ materiaId: materia.id, profesorId: form.profesorId });
          }
          setMessage(form.id ? `✅ "${form.nombre}" actualizada correctamente.` : `✅ Materia "${form.nombre}" creada.`);
          setForm(EMPTY_FORM);
        },
      }
    );
  };

  const loadForEdit = (id: string, nombre: string, estado: SubjectStatus): void => {
    const existing = subjects?.find((s) => s.id === id);
    setForm({
      id,
      nombre,
      nivelEducativo: existing?.estado === "Pendiente" ? "" : form.nivelEducativo,
      descripcion: "",
      activa: estado === "Activa",
      profesorId: "",
    });
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-[22px] font-extrabold text-text-1 tracking-tight mb-1">Gestión de materias</h2>
        <p className="text-[13px] text-text-2">Crear, editar y asignar docentes a las materias</p>
      </div>

      <div className="grid xl:grid-cols-[2fr_1fr] gap-5">
        <div>
          {isLoading && <p className="text-sm text-text-2">Cargando materias…</p>}
          <TableWrap>
            <Table ariaLabel="Materias institucionales">
              <Thead>
                <tr>
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
                    <Td className="font-semibold text-text-1">{s.nombre}</Td>
                    <Td className="text-xs">{s.profesor || "— Sin asignar —"}</Td>
                    <Td className="text-xs">{s.alumnos}</Td>
                    <Td>
                      <Tag color={STATUS_COLOR[s.estado]}>{s.estado}</Tag>
                    </Td>
                    <Td>
                      <Button variant="ghost" size="sm" onClick={() => loadForEdit(s.id, s.nombre, s.estado)}>
                        Editar
                      </Button>
                    </Td>
                  </tr>
                ))}
                {!isLoading && (subjects ?? []).length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-2.5 text-xs text-text-2">
                      No hay materias cargadas.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </TableWrap>
        </div>

        <Card>
          <CardHeader title={form.id ? "Editar materia" : "Nueva materia"} />
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
            <label htmlFor="materia-nivel" className="block text-xs font-semibold text-text-1 mb-1.5">
              Nivel educativo
            </label>
            <input
              id="materia-nivel"
              value={form.nivelEducativo}
              onChange={(e) => setForm({ ...form, nivelEducativo: e.target.value })}
              placeholder="Ej: Técnico / Universitario"
              className="w-full px-3 py-2 border border-border rounded text-sm"
            />
          </div>
          <div className="mb-3.5">
            <label htmlFor="materia-descripcion" className="block text-xs font-semibold text-text-1 mb-1.5">
              Descripción <span className="text-text-3 font-normal">(opcional)</span>
            </label>
            <textarea
              id="materia-descripcion"
              rows={3}
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              placeholder="Breve descripción de la materia"
              className="w-full px-3 py-2 border border-border rounded text-sm"
            />
          </div>
          <div className="mb-3.5">
            <label htmlFor="materia-profesor" className="block text-xs font-semibold text-text-1 mb-1.5">
              Docente asignado
            </label>
            <select
              id="materia-profesor"
              value={form.profesorId}
              onChange={(e) => setForm({ ...form, profesorId: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded text-sm bg-surface"
            >
              <option value="">— Sin asignar —</option>
              {(professors ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-3.5">
            <label htmlFor="materia-estado" className="block text-xs font-semibold text-text-1 mb-1.5">
              Estado
            </label>
            <select
              id="materia-estado"
              value={form.activa ? "Activa" : "Inactiva"}
              onChange={(e) => setForm({ ...form, activa: e.target.value === "Activa" })}
              className="w-full px-3 py-2 border border-border rounded text-sm bg-surface"
            >
              <option value="Activa">Activa</option>
              <option value="Inactiva">Inactiva</option>
            </select>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={save.isPending || assign.isPending}>
              {save.isPending || assign.isPending ? "Guardando…" : "Guardar"}
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