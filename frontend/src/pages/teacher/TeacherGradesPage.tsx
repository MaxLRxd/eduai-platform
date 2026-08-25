import React, { useState } from "react";
import { useTeacherCourses, useTeacherCourseGrades } from "../../hooks/useTeacherCourses";
import { CourseFilter } from "../../components/ui/CourseFilter";
import { TableWrap, Table, Thead, Th, Td } from "../../components/ui/Table";
import { Button } from "../../components/ui/Button";

export function TeacherGradesPage(): React.ReactElement {
  const { data: courses } = useTeacherCourses();
  const [courseId, setCourseId] = useState("prog2");
  const { data: grades, isLoading } = useTeacherCourseGrades(courseId);
  const course = courses?.find((c) => c.id === courseId);

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-[22px] font-extrabold text-text-1 tracking-tight mb-1">Calificaciones</h2>
        <p className="text-[13px] text-text-2">Ingreso y gestión de notas por materia</p>
      </div>

      <CourseFilter courses={courses ?? []} value={courseId} onChange={setCourseId} />

      {course && (
        <div className="text-xs text-text-2 mb-2 font-semibold">
          📚 {course.label} — {course.curso} · {grades?.length ?? 0} alumnos
        </div>
      )}

      {isLoading && <p className="text-sm text-text-2">Cargando calificaciones…</p>}

      <TableWrap>
        <Table ariaLabel="Tabla de calificaciones">
          <Thead>
            <tr>
              <Th>Estudiante</Th>
              <Th>TP1</Th>
              <Th>TP2</Th>
              <Th>TP3</Th>
              <Th>Parcial</Th>
              <Th>Promedio</Th>
              <Th>Acciones</Th>
            </tr>
          </Thead>
          <tbody>
            {(grades ?? []).map((g) => (
              <tr key={g.name} className="hover:bg-surface-2">
                <Td className="font-semibold text-text-1">{g.name}</Td>
                <Td>{g.tp1}</Td>
                <Td>{g.tp2}</Td>
                <Td>{g.tp3}</Td>
                <Td>{g.parcial}</Td>
                <Td className="font-bold text-primary">{g.average}</Td>
                <Td>
                  <Button variant="ghost" size="sm">
                    Editar
                  </Button>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </TableWrap>

      <div className="flex gap-2 flex-wrap">
        <Button size="sm">Guardar cambios</Button>
        <Button variant="secondary" size="sm">
          Exportar Excel
        </Button>
      </div>
    </div>
  );
}
