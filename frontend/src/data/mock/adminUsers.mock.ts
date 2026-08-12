import type { AdminUser } from "../../types/domain";

export const MOCK_ADMIN_USERS: AdminUser[] = [
  { name: "Acevedo, Lautaro", email: "lacevedo@ies.edu.ar", role: "Alumno", status: "Activo" },
  { name: "Martínez, Prof.", email: "martinez@ies.edu.ar", role: "Docente", status: "Activo" },
  { name: "García, Prof.", email: "garcia@ies.edu.ar", role: "Docente", status: "Activo" },
  { name: "Rodríguez, C.", email: "crodriguez@ies.edu.ar", role: "Alumno", status: "Inactivo" },
  { name: "Nuevo ingresante", email: "pendiente@ies.edu.ar", role: "Alumno", status: "Pendiente" },
];
