import type { AdminSubject } from "../../types/domain";

export const ADMIN_PROFESSORS = ["Prof. Martínez", "Prof. García", "Prof. López", "Prof. Sánchez", "Prof. Fernández", "Prof. Ruiz"];

export const MOCK_ADMIN_SUBJECTS: AdminSubject[] = [
  { id: "101", nombre: "Programación II", profesor: "Prof. Martínez", alumnos: 48, estado: "Activa" },
  { id: "102", nombre: "Bases de Datos", profesor: "Prof. García", alumnos: 35, estado: "Activa" },
  { id: "103", nombre: "Matemática Discreta", profesor: "Prof. López", alumnos: 52, estado: "Activa" },
  { id: "104", nombre: "Redes de Computadoras", profesor: "Prof. Sánchez", alumnos: 30, estado: "Activa" },
  { id: "105", nombre: "Inglés Técnico", profesor: "", alumnos: 0, estado: "Pendiente" },
];
