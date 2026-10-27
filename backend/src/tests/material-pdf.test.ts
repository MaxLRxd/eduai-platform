import { renderMaterialPdf } from "../modules/asistente/materialPdf";

describe("renderMaterialPdf", () => {
  it("genera un buffer PDF válido a partir de markdown", async () => {
    const buffer = await renderMaterialPdf({
      titulo: "Clase 3 🤖",
      materia: "Matemática",
      material: "# Plan\n- **uno** con `codigo`\n1. dos\n\n---\nTexto con tildes áéí ñ",
    });
    expect(buffer.subarray(0, 5).toString("latin1")).toBe("%PDF-");
  });

  it("tolera un material de varias páginas", async () => {
    const material = Array.from({ length: 300 }, (_, i) => `Línea ${i} del material de clase`).join("\n");
    const buffer = await renderMaterialPdf({ titulo: "Largo", material });
    expect(buffer.subarray(0, 5).toString("latin1")).toBe("%PDF-");
  });
});
