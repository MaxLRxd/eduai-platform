import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { SeccionEditForm } from "../components/teacher/SeccionEditForm";
import { moverUnidad } from "../services/content.service";

describe("moverUnidad", () => {
  const ids = ["a", "b", "c"];

  it("sube y baja una posición sin tocar el arreglo original", () => {
    expect(moverUnidad(ids, 1, -1)).toEqual(["b", "a", "c"]);
    expect(moverUnidad(ids, 1, 1)).toEqual(["a", "c", "b"]);
    expect(ids).toEqual(["a", "b", "c"]);
  });

  it("no se puede subir la primera ni bajar la última", () => {
    expect(moverUnidad(ids, 0, -1)).toBeNull();
    expect(moverUnidad(ids, 2, 1)).toBeNull();
  });

  it("un índice fuera de rango no hace nada", () => {
    expect(moverUnidad(ids, -1, 1)).toBeNull();
    expect(moverUnidad(ids, 9, -1)).toBeNull();
  });
});

describe("formulario para editar una unidad", () => {
  const montar = (extra: Partial<React.ComponentProps<typeof SeccionEditForm>> = {}) => {
    const onGuardar = vi.fn();
    const onCancelar = vi.fn();
    render(
      <SeccionEditForm
        nombre="Unidad 1"
        tipo="TEORIA"
        guardando={false}
        error={null}
        onGuardar={onGuardar}
        onCancelar={onCancelar}
        {...extra}
      />,
    );
    return { onGuardar, onCancelar };
  };

  it("arranca con los datos actuales y no deja guardar si no cambió nada", () => {
    montar();

    expect(screen.getByLabelText("Nombre de la unidad")).toHaveValue("Unidad 1");
    expect(screen.getByLabelText("Tipo")).toHaveValue("TEORIA");
    expect(screen.getByRole("button", { name: "Guardar" })).toBeDisabled();
  });

  it("guarda el nombre sin espacios sobrantes y el tipo elegido", () => {
    const { onGuardar } = montar();

    fireEvent.change(screen.getByLabelText("Nombre de la unidad"), { target: { value: "  Unidad 1: Redes  " } });
    fireEvent.change(screen.getByLabelText("Tipo"), { target: { value: "PRACTICA" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

    expect(onGuardar).toHaveBeenCalledWith({ nombre: "Unidad 1: Redes", tipo: "PRACTICA" });
  });

  it("no permite un nombre vacío", () => {
    montar();

    fireEvent.change(screen.getByLabelText("Nombre de la unidad"), { target: { value: "   " } });

    expect(screen.getByRole("button", { name: "Guardar" })).toBeDisabled();
  });

  it("Cancelar cierra sin guardar y se muestra el error del servidor", () => {
    const { onGuardar, onCancelar } = montar({ error: "Ya existe una seccion con ese nombre" });

    expect(screen.getByText("Ya existe una seccion con ese nombre")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(onCancelar).toHaveBeenCalled();
    expect(onGuardar).not.toHaveBeenCalled();
  });
});
