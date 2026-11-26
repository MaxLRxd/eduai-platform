import React, { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTeacherCourses, useTeacherCourseStudents } from "../../hooks/useTeacherCourses";
import { CourseFilter } from "../../components/ui/CourseFilter";
import { TableWrap, Table, Thead, Th, Td } from "../../components/ui/Table";
import { Tag } from "../../components/ui/Tag";
import { Button } from "../../components/ui/Button";
import { STUDENTS_AREA_TABS, TeacherAreaTabs } from "../../components/teacher/TeacherAreaTabs";
import {
  FILTRO_INICIAL,
  filtrarYOrdenarAlumnos,
  type FiltroAlumnos,
  type OrdenAlumnos,
} from "../../utils/alumnos";
import type { StudentStanding } from "../../types/domain";

export function TeacherStudentsPage(): React.ReactElement {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data: courses } = useTeacherCourses();
  const [selected, setSelected] = useState(searchParams.get("course") ?? "");
  const courseId = selected || courses?.[0]?.id || "";
  const { data: students, isLoading } = useTeacherCourseStudents(courseId);
  const course = courses?.find((c) => c.id === courseId);
  const [filtro, setFiltro] = useState<FiltroAlumnos>(FILTRO_INICIAL);
  const visibles = useMemo(() => filtrarYOrdenarAlumnos(students ?? [], filtro), [students, filtro]);
  const hayFiltro = filtro.estado !== "" || filtro.busqueda.trim() !== "" || filtro.orden !== FILTRO_INICIAL.orden;

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-[22px] font-extrabold text-text-1 tracking-tight mb-1">Mis estudiantes</h2>
        <p className="text-[13px] text-text-2">Listado de alumnos por materia y curso</p>
      </div>

      <TeacherAreaTabs tabs={STUDENTS_AREA_TABS} />

      <CourseFilter
        courses={courses ?? []}
        value={courseId}
        onChange={(id) => {
          setSelected(id);
          setFiltro(FILTRO_INICIAL);
        }}
      />

      <div className="flex flex-wrap items-end gap-3 mb-3">
        <div>
          <label htmlFor="alumnos-buscar" className="block text-[11px] font-semibold text-text-2 mb-1">
            Buscar
          </label>
          <input
            id="alumnos-buscar"
            type="search"
            value={filtro.busqueda}
            onChange={(e) => setFiltro({ ...filtro, busqueda: e.target.value })}
            placeholder="Nombre o legajo"
            className="px-3 py-2 border border-border rounded text-sm bg-surface"
          />
        </div>
        <div>
          <label htmlFor="alumnos-estado" className="block text-[11px] font-semibold text-text-2 mb-1">
            Estado
          </label>
          <select
            id="alumnos-estado"
            value={filtro.estado}
            onChange={(e) => setFiltro({ ...filtro, estado: e.target.value as "" | StudentStanding })}
            className="px-3 py-2 border border-border rounded text-sm bg-surface"
          >
            <option value="">Todos</option>
            <option value="Regular">Regular</option>
            <option value="En riesgo">En riesgo</option>
          </select>
        </div>
        <div>
          <label htmlFor="alumnos-orden" className="block text-[11px] font-semibold text-text-2 mb-1">
            Ordenar por
          </label>
          <select
            id="alumnos-orden"
            value={filtro.orden}
            onChange={(e) => setFiltro({ ...filtro, orden: e.target.value as OrdenAlumnos })}
            className="px-3 py-2 border border-border rounded text-sm bg-surface"
          >
            <option value="nombre">Nombre (A-Z)</option>
            <option value="promedio-desc">Promedio: mayor a menor</option>
            <option value="promedio-asc">Promedio: menor a mayor</option>
            <option value="asistencia-desc">Asistencia: mayor a menor</option>
            <option value="asistencia-asc">Asistencia: menor a mayor</option>
          </select>
        </div>
        {hayFiltro && (
          <Button variant="ghost" size="sm" onClick={() => setFiltro(FILTRO_INICIAL)}>
            Quitar filtros
          </Button>
        )}
      </div>

      {course && (
        <div className="text-xs text-text-2 mb-2 font-semibold">
          {course.label} · {course.curso} ·{" "}
          {visibles.length === (students?.length ?? 0)
            ? `${students?.length ?? 0} alumnos`
            : `${visibles.length} de ${students?.length ?? 0} alumnos`}
        </div>
      )}

      {isLoading && <p className="text-sm text-text-2">Cargando estudiantes...</p>}

      <TableWrap>
        <Table ariaLabel="Listado de estudiantes">
          <Thead>
            <tr>
              <Th>Estudiante</Th>
              <Th>Legajo</Th>
              <Th>Promedio</Th>
              <Th>Asistencia</Th>
              <Th>Estado</Th>
              <Th>Acciones</Th>
            </tr>
          </Thead>
          <tbody>
            {visibles.map((s) => (
              <tr key={s.id} className="hover:bg-surface-2">
                <Td className="font-semibold text-text-1">{s.name}</Td>
                <Td className="font-mono text-xs">{s.legajo}</Td>
                <Td className="font-bold text-primary">{s.average}</Td>
                <Td>{s.attendance}</Td>
                <Td>
                  <Tag color={s.standing === "Regular" ? "green" : "amber"}>{s.standing}</Tag>
                </Td>
                <Td>
                  <Button variant="ghost" size="sm" onClick={() => navigate(`/teacher/students/${s.id}?course=${courseId}`)}>
                    Ver perfil
                  </Button>
                </Td>
              </tr>
            ))}
            {!isLoading && (students ?? []).length > 0 && visibles.length === 0 && (
              <tr>
                <Td colSpan={6} className="text-center text-[12px] text-text-3 py-4">
                  Ningún alumno coincide con los filtros.
                </Td>
              </tr>
            )}
            {!isLoading && (students ?? []).length === 0 && (
              <tr>
                <Td colSpan={6} className="text-center text-[12px] text-text-3 py-4">
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
