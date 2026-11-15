import React, { useState } from "react";
import { useTeacherCourses, useTeacherCourseGrades, useCreateNota } from "../../hooks/useTeacherCourses";
import { CourseFilter } from "../../components/ui/CourseFilter";
import { TableWrap, Table, Thead, Th, Td } from "../../components/ui/Table";
import { Button } from "../../components/ui/Button";
import { apiErrorMessage } from "../../services/api";

const PERIODOS_BASE = ["2026-1", "2026-2"];

export function TeacherGradesPage(): React.ReactElement {
  const { data: courses } = useTeacherCourses();
  const [selected, setSelected] = useState("");
  const courseId = selected || courses?.[0]?.id || "";
  const { data, isLoading } = useTeacherCourseGrades(courseId);
  const createNota = useCreateNota(courseId);
  const course = courses?.find((c) => c.id === courseId);

  const rows = data?.rows ?? [];
  const columnas = [...new Set([...PERIODOS_BASE, ...(data?.periods ?? [])])].sort();

  const [formOpen, setFormOpen] = useState(false);
  const [alumnoId, setAlumnoId] = useState("");
  const [periodo, setPeriodo] = useState(PERIODOS_BASE[0]);
  const [calificacion, setCalificacion] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [okMsg, setOkMsg] = useState("");

  const abrirFormulario = (studentId = "", period = PERIODOS_BASE[0], grade = ""): void => {
    setAlumnoId(studentId || rows[0]?.studentId || "");
    setPeriodo(period);
    setCalificacion(grade);
    setObservaciones("");
    setOkMsg("");
    createNota.reset();
    setFormOpen(true);
  };

  const guardar = (): void => {
    const nota = Number(calificacion.replace(",", "."));
    if (!alumnoId || !periodo.trim() || !Number.isFinite(nota)) return;
    createNota.mutate(
      {
        alumno_id: alumnoId,
        periodo: periodo.trim(),
        calificacion: nota,
        observaciones: observaciones.trim() || undefined,
      },
      {
        onSuccess: () => {
          setOkMsg("Nota guardada.");
          setFormOpen(false);
        },
      }
    );
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-[22px] font-extrabold text-text-1 tracking-tight mb-1">Calificaciones</h2>
        <p className="text-[13px] text-text-2">Ingreso y gestión de notas por materia y período</p>
      </div>

      <CourseFilter courses={courses ?? []} value={courseId} onChange={setSelected} />

      {course && (
        <div className="text-xs text-text-2 mb-2 font-semibold">
          {course.label} — {course.curso} · {rows.length} alumnos
        </div>
      )}

      <div className="flex justify-end mb-2.5">
        <Button size="sm" onClick={() => abrirFormulario()} disabled={!courseId || rows.length === 0}>
          + Cargar nota
        </Button>
      </div>

      {formOpen && (
        <div className="border border-border rounded bg-surface p-4 mb-4">
          <div className="font-display text-sm font-bold mb-3">Cargar / actualizar nota</div>
          <div className="grid md:grid-cols-4 gap-3 mb-3">
            <div>
              <label htmlFor="nota-alumno" className="block text-xs font-semibold text-text-1 mb-1.5">
                Estudiante
              </label>
              <select
                id="nota-alumno"
                value={alumnoId}
                onChange={(e) => setAlumnoId(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded text-sm bg-surface"
              >
                {rows.map((r) => (
                  <option key={r.studentId} value={r.studentId}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="nota-periodo" className="block text-xs font-semibold text-text-1 mb-1.5">
                Período
              </label>
              <input
                id="nota-periodo"
                list="periodos-disponibles"
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded text-sm"
              />
              <datalist id="periodos-disponibles">
                {columnas.map((p) => (
                  <option key={p} value={p} />
                ))}
              </datalist>
            </div>
            <div>
              <label htmlFor="nota-valor" className="block text-xs font-semibold text-text-1 mb-1.5">
                Nota (0-10)
              </label>
              <input
                id="nota-valor"
                type="number"
                min={0}
                max={10}
                step={0.01}
                value={calificacion}
                onChange={(e) => setCalificacion(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded text-sm"
              />
            </div>
            <div>
              <label htmlFor="nota-obs" className="block text-xs font-semibold text-text-1 mb-1.5">
                Observaciones
              </label>
              <input
                id="nota-obs"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Opcional"
                className="w-full px-3 py-2 border border-border rounded text-sm"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={guardar} disabled={createNota.isPending || !alumnoId || !periodo.trim() || calificacion === ""}>
              {createNota.isPending ? "Guardando…" : "Guardar nota"}
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setFormOpen(false)}>
              Cancelar
            </Button>
            {createNota.isError && (
              <span className="text-xs text-danger">{apiErrorMessage(createNota.error, "No se pudo guardar la nota")}</span>
            )}
          </div>
        </div>
      )}

      {okMsg && <p className="text-xs text-success mb-2">{okMsg}</p>}
      {isLoading && <p className="text-sm text-text-2">Cargando calificaciones…</p>}

      <TableWrap>
        <Table ariaLabel="Tabla de calificaciones">
          <Thead>
            <tr>
              <Th>Estudiante</Th>
              {columnas.map((p) => (
                <Th key={p}>{p}</Th>
              ))}
              <Th>Promedio</Th>
              <Th>Acciones</Th>
            </tr>
          </Thead>
          <tbody>
            {rows.map((g) => (
              <tr key={g.studentId} className="hover:bg-surface-2">
                <Td className="font-semibold text-text-1">{g.name}</Td>
                {columnas.map((p) => (
                  <Td key={p}>
                    <button
                      type="button"
                      className="text-left w-full hover:text-primary"
                      onClick={() => abrirFormulario(g.studentId, p, g.grades[p] === "—" ? "" : g.grades[p])}
                    >
                      {g.grades[p] ?? "—"}
                    </button>
                  </Td>
                ))}
                <Td className="font-bold text-primary">{g.average}</Td>
                <Td>
                  <Button variant="ghost" size="sm" onClick={() => abrirFormulario(g.studentId)}>
                    Editar
                  </Button>
                </Td>
              </tr>
            ))}
            {!isLoading && rows.length === 0 && (
              <tr>
                <Td colSpan={columnas.length + 3} className="text-center text-[12px] text-text-3 py-4">
                  No hay alumnos inscriptos en esta materia todavía.
                </Td>
              </tr>
            )}
          </tbody>
        </Table>
      </TableWrap>
    </div>
  );
}
