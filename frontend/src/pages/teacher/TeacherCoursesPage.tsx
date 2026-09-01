import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useDashboard } from "../../hooks/useDashboard";
import { useTeacherCourses } from "../../hooks/useTeacherCourses";
import { Card, CardHeader } from "../../components/ui/Card";
import { Tag } from "../../components/ui/Tag";
import { TableWrap, Table, Thead, Th, Td } from "../../components/ui/Table";
import { Button } from "../../components/ui/Button";

export function TeacherCoursesPage(): React.ReactElement {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: courses, isLoading } = useTeacherCourses();
  const { data: dashboard } = useDashboard(user?.role);
  const d = dashboard?.rol === "PROFESOR" ? dashboard.data : undefined;

  const resumenPorMateria = new Map(
    (d?.materias ?? []).map((m) => [m.id, { secciones: m.secciones, actividades: m.actividades, inscriptos: m.inscriptos }])
  );

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-[22px] font-extrabold text-text-1 tracking-tight mb-1">Mis materias</h2>
        <p className="text-[13px] text-text-2">Cursos y materias asignadas</p>
      </div>

      {isLoading && <p className="text-sm text-text-2">Cargando materias…</p>}

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4.5 mb-6">
        {(courses ?? []).map((c) => (
          <button
            key={c.id}
            onClick={() => navigate(`/teacher/students?course=${c.id}`)}
            className="text-left bg-surface border border-border rounded-lg p-5 shadow-sm hover:border-border-strong hover:shadow transition-all"
          >
            <div className="font-display text-sm font-bold text-text-1">{c.label}</div>
            <div className="text-xs text-text-3 mt-0.5">
              {c.curso} · {c.alumnos} estudiantes
            </div>
            <div className="flex gap-1.5 flex-wrap mt-2.5">
              <Tag color="blue">{c.curso}</Tag>
              <Tag color="green">{c.alumnos} alumnos</Tag>
            </div>
            <div className="mt-2.5 text-xs text-primary font-semibold">Gestionar secciones →</div>
          </button>
        ))}
      </div>

      <Card>
        <CardHeader title="Resumen de actividad por materia" />
        <TableWrap>
          <Table>
            <Thead>
              <tr>
                <Th>Materia</Th>
                <Th>Curso</Th>
                <Th>Alumnos</Th>
                <Th>Secciones</Th>
                <Th>Actividades</Th>
                <Th>Acciones</Th>
              </tr>
            </Thead>
            <tbody>
              {(courses ?? []).map((c) => {
                const resumen = resumenPorMateria.get(c.id);
                return (
                  <tr key={c.id} className="hover:bg-surface-2">
                    <Td className="font-semibold text-text-1">{c.label}</Td>
                    <Td>{c.curso}</Td>
                    <Td>{resumen?.inscriptos ?? c.alumnos}</Td>
                    <Td>{resumen?.secciones ?? "—"}</Td>
                    <Td>{resumen?.actividades ?? "—"}</Td>
                    <Td>
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/teacher/students?course=${c.id}`)}>
                        Gestionar secciones
                      </Button>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </TableWrap>
      </Card>
    </div>
  );
}
