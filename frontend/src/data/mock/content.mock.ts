import type { UploadedMaterial } from "../../types/domain";

export const MOCK_UPLOADED_MATERIALS: UploadedMaterial[] = [
  { name: "Presentacion_OOP.pptx", fileType: "pptx", sizeLabel: "2.3 MB", ragStatus: "Indexado", date: "12/04" },
  { name: "Guia_herencia.pdf", fileType: "pdf", sizeLabel: "1.1 MB", ragStatus: "Indexado", date: "10/04" },
  { name: "Consigna_TP3.docx", fileType: "docx", sizeLabel: "480 KB", ragStatus: "Indexado", date: "08/04" },
  { name: "Diagrama_clases.png", fileType: "img", sizeLabel: "320 KB", ragStatus: "Sin indexar", date: "15/04" },
  { name: "Apunte_interfaces.txt", fileType: "txt", sizeLabel: "12 KB", ragStatus: "Indexando…", date: "16/04" },
];

export const CONTENT_SECTIONS = [
  "Unidad 1 — Introducción a OOP",
  "Unidad 2 — Herencia y Polimorfismo",
  "Clase 5 — Interfaces y Clases Abstractas",
  "TP3 — Proyecto integrador",
];
