import type { PlanningClass } from "../../types/domain";

export const MOCK_PLANNING: PlanningClass[] = [
  {
    date: "2026-05-04",
    title: "Repaso de programación orientada a objetos",
    course: "Programación II",
    material: "Presentación de clases, guía de actividades y enlace al simulador.",
    studentVisible: true,
    aiEnabled: true,
    attachments: [
      { name: "Presentacion_POO.pdf", sizeLabel: "1.2 MB" },
      { name: "Guia_actividades.docx", sizeLabel: "480 KB" },
    ],
  },
  {
    date: "2026-05-05",
    title: "Trabajo práctico: clases y objetos",
    course: "Programación II",
    material: "Consignas del TP, rúbrica y ejemplos resueltos.",
    studentVisible: true,
    aiEnabled: true,
    attachments: [{ name: "TP_clases_objetos.pdf", sizeLabel: "760 KB" }],
  },
  {
    date: "2026-05-06",
    title: "",
    course: "Programación II",
    material: "",
    studentVisible: false,
    aiEnabled: true,
    attachments: [],
  },
];
