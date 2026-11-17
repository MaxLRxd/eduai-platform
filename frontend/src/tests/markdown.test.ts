import { limpiarMarkdown } from "../utils/markdown";

describe("limpiarMarkdown", () => {
  it("quita negritas, cursivas y backticks", () => {
    expect(limpiarMarkdown("**Hola** *mundo* y `código`")).toBe("Hola mundo y código");
  });

  it("quita encabezados pero conserva viñetas", () => {
    expect(limpiarMarkdown("## Título\n- uno\n* dos")).toBe("Título\n- uno\n* dos");
  });

  it("respeta textos vacíos", () => {
    expect(limpiarMarkdown("")).toBe("");
  });
});
