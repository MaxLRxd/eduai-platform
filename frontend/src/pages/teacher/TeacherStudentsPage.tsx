import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTeacherCourses, useTeacherCourseStudents } from "../../hooks/useTeacherCourses";
import { CourseFilter } from "../../components/ui/CourseFilter";
import { TableWrap, Table, Thead, Th, Td } from "../../components/ui/Table";
import { Tag } from "../../components/ui/Tag";
import { Button } from "../../components/ui/Button";

export function TeacherStudentsPage(): React.ReactElement {
  const [searchParams] = useSearchParams();
  const { data: courses } = useTeacherCourses();
  const [courseId, setCourseId] = useState(searchParams.get("course") ?? "prog2");
  const { data: students, isLoading } = useTeacherCourseStudents(courseId);
  const course = courses?.find((c) => c.id === courseId);

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-[22px] font-extrabold text-text-1 tracking-tight mb-1">Mis estudiantes</h2>
        <p className="text-[13px] text-text-2">Listado de alumnos por materia y curso</p>
      </div>

      <CourseFilter courses={courses ?? []} value={courseId} onChange={setCourseId} />

      {course && (
        <div className="text-xs text-text-2 mb-2 font-semibold">
          📚 {course.label} — {course.curso} · {students?.length ?? 0} alumnos
        </div>
      )}

      {isLoading && <p className="text-sm text-text-2">Cargando estudiantes…</p>}

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
            {(students ?? []).map((s) => (
              <tr key={s.legajo} className="hover:bg-surface-2">
                <Td className="font-semibold text-text-1">{s.name}</Td>
                <Td className="font-mono text-xs">{s.legajo}</Td>
                <Td className="font-bold text-primary">{s.average}</Td>
                <Td>{s.attendance}</Td>
                <Td>
                  <Tag color={s.standing === "Regular" ? "green" : "amber"}>{s.standing}</Tag>
                </Td>
                <Td>
                  <Button variant="ghost" size="sm">
                    Ver perfil
                  </Button>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </TableWrap>
    </div>
  );
}
