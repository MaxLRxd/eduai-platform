import React, { useState } from "react";
import { useTeacherCourses, useTeacherGradeSources, useCreateNota } from "../../hooks/useTeacherCourses";
import { useActualizarNota, useCalificaciones, useGuardarCategorias } from "../../hooks/useCalificaciones";
import { CourseFilter } from "../../components/ui/CourseFilter";
import { TableWrap, Table, Thead, Th, Td } from "../../components/ui/Table";
import { Button } from "../../components/ui/Button";
import { InfoBox } from "../../components/ui/InfoBox";
import { Modal } from "../../components/ui/Modal";
import { apiErrorMessage } from "../../services/api";
import { EVALUATIONS_AREA_TABS, STUDENTS_AREA_TABS, TeacherAreaTabs } from "../../components/teacher/TeacherAreaTabs";
import { CategoriasNotaEditor } from "../../components/teacher/CategoriasNotaEditor";
import { ImportarNotasActividad } from "../../components/teacher/ImportarNotasActividad";
import { formatoNota, type NotaDetalle } from "../../services/calificaciones.service";

const PERIODO_INICIAL = "2026-1";

interface FormNota {
  notaId: string | null; // null = nota nueva
  alumnoId: string;
  evaluacion: string;
  categoriaId: string;
  periodo: string;
  calificacion: string;
  observaciones: string;
  ligadaAActividad: boolean;
}

/** `area` define bajo que menu se muestra la pantalla: se la abre desde Mis estudiantes o desde Evaluaciones. */
export function TeacherGradesPage({ area = "estudiantes" }: { area?: "estudiantes" | "evaluaciones" }): React.ReactElement {
  const { data: courses } = useTeacherCourses();
  const [selected, setSelected] = useState("");
  const [filtroPeriodo, setFiltroPeriodo] = useState("");
  const courseId = selected || courses?.[0]?.id || "";
  const { data, isLoading, isError, error } = useCalificaciones(courseId, filtroPeriodo || undefined);
  const { data: fuentes } = useTeacherGradeSources(courseId);
  const createNota = useCreateNota(courseId);
  const actualizarNota = useActualizarNota(courseId);
  const guardarCategorias = useGuardarCategorias(courseId);
  const course = courses?.find((c) => c.id === courseId);

  const categorias = data?.categorias ?? [];
  const alumnos = data?.alumnos ?? [];
  const periodos = data?.periodos ?? [];
  const periodoSugerido = filtroPeriodo || periodos[periodos.length - 1] || PERIODO_INICIAL;
  const usaCategorias = categorias.length > 0;
  const conNotasSinCategoria = alumnos.filter((a) => a.sin_categoria > 0).length;

  const [abierto, setAbierto] = useState<string | null>(null);
  const [form, setForm] = useState<FormNota | null>(null);
  const [okMsg, setOkMsg] = useState("");

  const guardando = createNota.isPending || actualizarNota.isPending;
  const errorForm = createNota.error ?? actualizarNota.error;

  const abrirNueva = (alumnoId = "", evaluacion = "", calificacion = ""): void => {
    createNota.reset();
    actualizarNota.reset();
    setOkMsg("");
    setForm({
      notaId: null,
      alumnoId: alumnoId || alumnos[0]?.alumno_id || "",
      evaluacion,
      categoriaId: "",
      periodo: periodoSugerido,
      calificacion,
      observaciones: "",
      ligadaAActividad: false,
    });
  };

  const abrirEdicion = (n: NotaDetalle): void => {
    createNota.reset();
    actualizarNota.reset();
    setOkMsg("");
    setForm({
      notaId: n.id,
      alumnoId: n.alumno_id,
      evaluacion: n.evaluacion,
      categoriaId: n.categoria_id ?? "",
      periodo: n.periodo,
      calificacion: String(n.calificacion),
      observaciones: n.observaciones ?? "",
      ligadaAActividad: n.actividad_id != null,
    });
  };

  const guardar = (): void => {
    if (!form) return;
    const nota = Number(form.calificacion.replace(",", "."));
    if (!form.alumnoId || !form.periodo.trim() || !Number.isFinite(nota)) return;
    const comun = {
      calificacion: nota,
      observaciones: form.observaciones.trim() || undefined,
      evaluacion: form.evaluacion.trim(),
      categoria_id: form.categoriaId || null,
    };
    const alTerminar = { onSuccess: () => { setOkMsg("Nota guardada."); setForm(null); } };
    if (form.notaId) {
      actualizarNota.mutate({ notaId: form.notaId, input: comun }, alTerminar);
    } else {
      createNota.mutate({ alumno_id: form.alumnoId, periodo: form.periodo.trim(), ...comun }, alTerminar);
    }
  };

  const nombreCategoria = (id: string | null): string =>
    id ? (categorias.find((c) => c.id === id)?.nombre ?? "—") : "Sin categoría";

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-[22px] font-extrabold text-text-1 tracking-tight mb-1">Calificaciones</h2>
        <p className="text-[13px] text-text-2">
          Notas por evaluación, agrupadas en categorías con peso. La nota final es el promedio ponderado.
        </p>
      </div>

      <TeacherAreaTabs tabs={area === "evaluaciones" ? EVALUATIONS_AREA_TABS : STUDENTS_AREA_TABS} />

      <CourseFilter courses={courses ?? []} value={courseId} onChange={(id) => { setSelected(id); setFiltroPeriodo(""); setAbierto(null); setForm(null); }} />

      {course && (
        <div className="text-xs text-text-2 mb-2 font-semibold">
          {course.label} — {course.curso} · {alumnos.length} alumnos
        </div>
      )}

      {courseId && data && (
        <>
          <CategoriasNotaEditor
            key={`${courseId}:${categorias.map((c) => `${c.id}:${c.peso}:${c.nombre}`).join("|")}`}
            categorias={categorias}
            guardando={guardarCategorias.isPending}
            error={guardarCategorias.error}
            onGuardar={(cats) => guardarCategorias.mutate(cats)}
          />
          <ImportarNotasActividad
            key={`imp:${courseId}`}
            courseId={courseId}
            categorias={categorias}
            periodoInicial={periodoSugerido}
          />
        </>
      )}

      {isError && <InfoBox variant="error">{apiErrorMessage(error, "No se pudieron cargar las calificaciones")}</InfoBox>}

      {usaCategorias && conNotasSinCategoria > 0 && (
        <InfoBox variant="warning">
          {conNotasSinCategoria} alumno(s) tienen notas sin categoría. Esas notas no cuentan en la nota final hasta que
          les asignes una categoría (botón Editar de la nota).
        </InfoBox>
      )}

      <div className="flex items-center justify-between gap-2 flex-wrap mb-2.5">
        <div className="flex items-center gap-2">
          <label htmlFor="filtro-periodo" className="text-xs font-bold text-text-2">
            Período:
          </label>
          <select
            id="filtro-periodo"
            value={filtroPeriodo}
            onChange={(e) => setFiltroPeriodo(e.target.value)}
            className="px-2.5 py-1.5 border border-border rounded text-[13px] bg-surface"
          >
            <option value="">Todos</option>
            {periodos.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <Button size="sm" onClick={() => abrirNueva()} disabled={!courseId || alumnos.length === 0}>
          + Cargar nota
        </Button>
      </div>

      <Modal
        open={form !== null}
        onClose={() => { if (!guardando) setForm(null); }}
        title={form?.notaId ? "Editar nota" : "Cargar nota"}
        wide
      >
        {form && (
          <div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
              <div>
                <label htmlFor="nota-alumno" className="block text-xs font-semibold text-text-1 mb-1.5">
                  Estudiante
                </label>
                <select
                  id="nota-alumno"
                  value={form.alumnoId}
                  disabled={form.notaId !== null}
                  onChange={(e) => setForm({ ...form, alumnoId: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded text-sm bg-surface disabled:opacity-60"
                >
                  {alumnos.map((a) => (
                    <option key={a.alumno_id} value={a.alumno_id}>
                      {a.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="nota-evaluacion" className="block text-xs font-semibold text-text-1 mb-1.5">
                  Evaluación
                </label>
                <input
                  id="nota-evaluacion"
                  value={form.evaluacion}
                  disabled={form.ligadaAActividad}
                  onChange={(e) => setForm({ ...form, evaluacion: e.target.value })}
                  placeholder="Ej: Parcial 1, TP 2"
                  maxLength={200}
                  className="w-full px-3 py-2 border border-border rounded text-sm disabled:opacity-60"
                />
                {form.ligadaAActividad && (
                  <p className="text-[11px] text-text-3 mt-1">Viene de una actividad: conserva su nombre.</p>
                )}
              </div>
              <div>
                <label htmlFor="nota-categoria" className="block text-xs font-semibold text-text-1 mb-1.5">
                  Categoría
                </label>
                <select
                  id="nota-categoria"
                  value={form.categoriaId}
                  onChange={(e) => setForm({ ...form, categoriaId: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded text-sm bg-surface"
                >
                  <option value="">Sin categoría</option>
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} ({c.peso}%)
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
                  value={form.periodo}
                  disabled={form.notaId !== null}
                  onChange={(e) => setForm({ ...form, periodo: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded text-sm disabled:opacity-60"
                />
                <datalist id="periodos-disponibles">
                  {periodos.map((p) => (
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
                  value={form.calificacion}
                  onChange={(e) => setForm({ ...form, calificacion: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded text-sm"
                />
              </div>
              <div>
                <label htmlFor="nota-obs" className="block text-xs font-semibold text-text-1 mb-1.5">
                  Observaciones
                </label>
                <input
                  id="nota-obs"
                  value={form.observaciones}
                  onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
                  placeholder="Opcional"
                  className="w-full px-3 py-2 border border-border rounded text-sm"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 border-t border-border pt-3">
              <Button size="sm" onClick={guardar} disabled={guardando || !form.alumnoId || !form.periodo.trim() || form.calificacion === ""}>
                {guardando ? "Guardando…" : "Guardar nota"}
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setForm(null)} disabled={guardando}>
                Cancelar
              </Button>
              {errorForm != null && <span className="text-xs text-danger">{apiErrorMessage(errorForm, "No se pudo guardar la nota")}</span>}
            </div>
          </div>
        )}
      </Modal>

      {okMsg && <p className="text-xs text-success mb-2">{okMsg}</p>}
      {isLoading && <p className="text-sm text-text-2">Cargando calificaciones…</p>}

      {(fuentes ?? []).length > 0 && (
        <div className="border border-border rounded bg-surface mb-4 overflow-hidden">
          <div className="px-4 py-2.5 bg-surface-2 border-b border-border">
            <div className="font-display text-sm font-bold text-text-1">Insumos: TPs y simulacros</div>
            <p className="text-[11px] text-text-2">
              Promedios de trabajos corregidos y exámenes simulados, solo como referencia. Para que un TP cuente en la
              nota final, usá <strong>Importar notas de una actividad</strong>.
            </p>
          </div>
          <TableWrap>
            <Table ariaLabel="Insumos de calificación">
              <Thead>
                <tr>
                  <Th>Estudiante</Th>
                  <Th>TPs</Th>
                  <Th>Prom. TP</Th>
                  <Th>Simulacros</Th>
                  <Th>Prom. simulacros</Th>
                  <Th>Acciones</Th>
                </tr>
              </Thead>
              <tbody>
                {(fuentes ?? []).map((f) => (
                  <tr key={f.alumno_id} className="hover:bg-surface-2">
                    <Td className="font-semibold text-text-1">{f.nombre}</Td>
                    <Td>{f.tps.cantidad}</Td>
                    <Td>{formatoNota(f.tps.promedio)}</Td>
                    <Td>{f.simulacros.cantidad}</Td>
                    <Td>{formatoNota(f.simulacros.promedio)}</Td>
                    <Td>
                      <div className="flex gap-1.5 flex-wrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={f.tps.promedio == null}
                          onClick={() => abrirNueva(f.alumno_id, "Promedio de TPs", f.tps.promedio?.toFixed(2) ?? "")}
                        >
                          Usar TP
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={f.simulacros.promedio == null}
                          onClick={() =>
                            abrirNueva(f.alumno_id, "Promedio de simulacros", f.simulacros.promedio?.toFixed(2) ?? "")
                          }
                        >
                          Usar simulacro
                        </Button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableWrap>
        </div>
      )}

      <TableWrap>
        <Table ariaLabel="Tabla de calificaciones">
          <Thead>
            <tr>
              <Th>Estudiante</Th>
              {categorias.map((c) => (
                <Th key={c.id}>
                  {c.nombre} ({c.peso}%)
                </Th>
              ))}
              <Th>{usaCategorias ? "Nota final" : "Promedio"}</Th>
              <Th>Acciones</Th>
            </tr>
          </Thead>
          <tbody>
            {alumnos.map((a) => (
              <React.Fragment key={a.alumno_id}>
                <tr className="hover:bg-surface-2">
                  <Td className="font-semibold text-text-1">
                    {a.nombre}
                    {usaCategorias && a.sin_categoria > 0 && (
                      <span className="ml-2 text-[11px] font-normal text-warning" title="Notas que no cuentan en la nota final">
                        {a.sin_categoria} sin categoría
                      </span>
                    )}
                  </Td>
                  {categorias.map((c) => (
                    <Td key={c.id}>{formatoNota(a.por_categoria[c.id])}</Td>
                  ))}
                  <Td className="font-bold text-primary">{formatoNota(a.promedio)}</Td>
                  <Td>
                    <div className="flex gap-1.5 flex-wrap">
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-expanded={abierto === a.alumno_id}
                        onClick={() => setAbierto(abierto === a.alumno_id ? null : a.alumno_id)}
                      >
                        {abierto === a.alumno_id ? "Ocultar notas" : `Ver notas (${a.notas.length})`}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => abrirNueva(a.alumno_id)}>
                        + Nota
                      </Button>
                    </div>
                  </Td>
                </tr>
                {abierto === a.alumno_id && (
                  <tr>
                    <Td colSpan={categorias.length + 3} className="bg-surface-2">
                      {a.notas.length === 0 ? (
                        <p className="text-[12px] text-text-3 py-1">Todavía no tiene notas cargadas.</p>
                      ) : (
                        <ul className="divide-y divide-border">
                          {a.notas.map((n) => (
                            <li key={n.id} className="flex items-center gap-3 py-1.5 text-[12px]">
                              <span className="flex-1 min-w-0 truncate font-semibold text-text-1">
                                {n.evaluacion || "Nota del período"}
                                {n.actividad_id && <span className="ml-2 font-normal text-text-3">(de una actividad)</span>}
                              </span>
                              <span className="text-text-2 w-32 truncate">{nombreCategoria(n.categoria_id)}</span>
                              <span className="text-text-2 w-16">{n.periodo}</span>
                              <span className="font-bold text-primary w-12 text-right">{n.calificacion.toFixed(2)}</span>
                              <Button variant="ghost" size="sm" onClick={() => abrirEdicion(n)}>
                                Editar
                              </Button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </Td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {!isLoading && alumnos.length === 0 && (
              <tr>
                <Td colSpan={categorias.length + 3} className="text-center text-[12px] text-text-3 py-4">
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
