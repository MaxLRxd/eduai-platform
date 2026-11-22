import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { UploadedMaterial } from "../types/domain";

const apiMock = vi.hoisted(() => vi.fn());

vi.mock("../services/api", () => ({
  api: apiMock,
  apiUrl: (ruta: string | null) => ruta,
}));

import { MaterialRow } from "../components/teacher/MaterialRow";
import { deleteMaterial } from "../services/content.service";

const material: UploadedMaterial = {
  id: "c1",
  name: "Apunte.pdf",
  fileType: "pdf",
  sizeLabel: "120 KB",
  ragStatus: "Indexado",
  date: "01/11",
  url: "http://localhost:3000/uploads/apunte.pdf",
};

const rag = { color: "green" as const, label: "RAG" };

describe("cliente de eliminación de materiales", () => {
  beforeEach(() => {
    apiMock.mockReset().mockResolvedValue(undefined);
  });

  it("usa el endpoint DELETE de contenidos", async () => {
    await deleteMaterial("c1");

    expect(apiMock).toHaveBeenCalledWith("/api/contenidos/c1", { method: "DELETE" });
  });
});

describe("botón de eliminar en una fila de material", () => {
  it("no aparece si la fila no recibe onDelete", () => {
    render(<MaterialRow material={material} icon="📄" rag={rag} />);

    expect(screen.queryByRole("button", { name: "Eliminar Apunte.pdf" })).not.toBeInTheDocument();
  });

  it("aparece y llama a onDelete cuando la fila es eliminable", () => {
    const onDelete = vi.fn();
    render(<MaterialRow material={material} icon="📄" rag={rag} onDelete={onDelete} />);

    fireEvent.click(screen.getByRole("button", { name: "Eliminar Apunte.pdf" }));

    expect(onDelete).toHaveBeenCalledOnce();
  });

  it("se deshabilita mientras se está eliminando", () => {
    render(<MaterialRow material={material} icon="📄" rag={rag} onDelete={vi.fn()} deleting />);

    expect(screen.getByRole("button", { name: "Eliminar Apunte.pdf" })).toBeDisabled();
  });
});
