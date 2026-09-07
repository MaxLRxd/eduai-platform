import { api } from "./api";
import type { AdminSubject } from "../types/domain";

interface MateriaApi {
  id: string;
  nombre: string;
  descripcion: string | null;
  nivel_educativo: string;
  activa: boolean;
  inscriptos: number;
  secciones: number;
  profesores?: { id: string; nombre: string; email: string }[];
}

function toAdminSubject(m: MateriaApi): AdminSubject {
  return {
    id: m.id,
    nombre: m.nombre,
    profesor: (m.profesores ?? []).map((p) => p.nombre).join(", "),
    alumnos: m.inscriptos,
    estado: m.activa ? "Activa" : "Inactiva",
  };
}

// GET /api/admin/materias — listado paginado (traemos hasta 100).
export async function getAdminSubjects(): Promise<AdminSubject[]> {
  const data = await api<{ items: MateriaApi[] }>("/api/admin/materias?pageSize=100");
  return (data.items ?? []).map(toAdminSubject);
}

export interface SubjectSaveInput {
  id: string | null;
  nombre: string;
  nivelEducativo: string;
  descripcion: string;
  activa: boolean;
}

// POST /api/admin/materias (nueva) o PUT /api/admin/materias/:id (editar).
export async function saveAdminSubject(subject: SubjectSaveInput): Promise<AdminSubject> {
  if (subject.id) {
    const data = await api<{ materia: MateriaApi }>(`/api/admin/materias/${subject.id}`, {
      method: "PUT",
      body: JSON.stringify({
        nombre: subject.nombre,
        nivel_educativo: subject.nivelEducativo,
        descripcion: subject.descripcion || null,
        activa: subject.activa,
      }),
    });
    return toAdminSubject(data.materia);
  }

  const data = await api<{ materia: MateriaApi }>("/api/admin/materias", {
    method: "POST",
    body: JSON.stringify({
      nombre: subject.nombre,
      nivel_educativo: subject.nivelEducativo,
      descripcion: subject.descripcion || undefined,
    }),
  });
  return toAdminSubject(data.materia);
}

// POST /api/admin/materias/:id/profesores — asigna un docente a la materia.
export async function assignAdminProfessor(materiaId: string, profesorId: string): Promise<void> {
  await api(`/api/admin/materias/${materiaId}/profesores`, {
    method: "POST",
    body: JSON.stringify({ profesor_id: profesorId, activo: true }),
  });
}