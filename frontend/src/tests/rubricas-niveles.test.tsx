import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";

import { RubricFormModal } from "../components/teacher/RubricFormModal";
import { NIVELES_TIPICOS, validarNiveles } from "../utils/nivelesRubrica";
import type { Rubric } from "../types/domain";

describe("validarNiveles (mismas reglas que el servidor)", () => {
  it("los niveles típicos son válidos", () => {
    expect(validarNiveles(NIVELES_TIPICOS)).toEqual([]);
  });

  it("pide entre 2 y 6 niveles", () => {
    expect(validarNiveles([{ nombre: "Único", puntaje: 100 }])).toContain("Definí al menos 2 niveles.");
    const siete = Array.from({ length: 7 }, (_, i) => ({ nombre: `N${i}`, puntaje: 100 - i * 10 }));
    expect(validarNiveles(siete)).toContain("Máximo 6 niveles.");
  });

  it("rechaza nombres vacíos o repetidos sin importar mayúsculas", () => {
    expect(validarNiveles([{ nombre: "A", puntaje: 100 }, { nombre: " ", puntaje: 50 }])).toContain("Cada nivel necesita un nombre.");
    expect(validarNiveles([{ nombre: "Bueno", puntaje: 100 }, { nombre: "bueno", puntaje: 50 }])).toContain("Hay niveles con el mismo nombre.");
  });

  it("el mejor nivel tiene que valer 100 y los demás bajar de a uno", () => {
    expect(validarNiveles([{ nombre: "A", puntaje: 90 }, { nombre: "B", puntaje: 50 }])).toContain("El mejor nivel (el primero) tiene que valer 100%.");
    expect(validarNiveles([{ nombre: "A", puntaje: 100 }, { nombre: "B", puntaje: 100 }])).toContain(
      "Los niveles van de mejor a peor: cada porcentaje debe ser menor al anterior.",
    );
    expect(validarNiveles([{ nombre: "A", puntaje: 100 }, { nombre: "B", puntaje: 40 }, { nombre: "C", puntaje: 60 }]).length).toBeGreaterThan(0);
  });

  it("rechaza porcentajes fuera de 0-100", () => {
    expect(validarNiveles([{ nombre: "A", puntaje: 100 }, { nombre: "B", puntaje: -5 }])).toContain("Cada porcentaje tiene que estar entre 0 y 100.");
    expect(validarNiveles([{ nombre: "A", puntaje: 120 }, { nombre: "B", puntaje: 50 }])).toContain("Cada porcentaje tiene que estar entre 0 y 100.");
  });
});

describe("formulario de rúbrica con niveles de desempeño (CU-P04)", () => {
  const rubricaSinNiveles: Rubric = {
    id: "r1",
    name: "Ensayo",
    description: null,
    criteriaCount: 1,
    activitiesCount: 0,
    criterios: [{ name: "Conceptos", weight: "100%", expected: "Define el modelo.", descriptors: {} }],
    levels: [],
  };

  const rubricaConNiveles: Rubric = {
    ...rubricaSinNiveles,
    criterios: [
      { name: "Conceptos", weight: "100%", expected: "Define el modelo.", descriptors: { Excelente: "Define y relaciona claves.", Regular: "Solo nombra tablas." } },
    ],
    levels: [
      { name: "Excelente", score: 100 },
      { name: "Bueno", score: 75 },
      { name: "Regular", score: 50 },
    ],
  };

  const montar = (rubric: Rubric | null) => {
    const onSave = vi.fn();
    render(<RubricFormModal open rubric={rubric} onClose={() => undefined} onSave={onSave} saving={false} error={null} />);
    return onSave;
  };

  const llenarNuevaRubrica = () => {
    fireEvent.change(screen.getByLabelText("Nombre de la rúbrica"), { target: { value: "Ensayo" } });
    fireEvent.change(screen.getByLabelText("Nombre del criterio 1"), { target: { value: "Conceptos" } });
    fireEvent.change(screen.getByLabelText("Peso del criterio 1"), { target: { value: "100" } });
    fireEvent.change(screen.getByLabelText("Lo esperado del criterio 1"), { target: { value: "Define el modelo." } });
  };

  const guardar = (nombre: string) => fireEvent.click(screen.getByRole("button", { name: nombre }));

  it("por defecto no usa niveles y guarda exactamente lo de siempre", () => {
    const onSave = montar(null);
    llenarNuevaRubrica();

    guardar("Crear rúbrica");

    expect(onSave).toHaveBeenCalledWith({
      nombre: "Ensayo",
      descripcion: undefined,
      criterios: [{ nombre: "Conceptos", peso: 100, esperado: "Define el modelo." }],
      niveles: undefined,
    });
    expect(screen.queryByLabelText("Nombre del nivel 1")).not.toBeInTheDocument();
  });

  it("al activar los niveles aparecen los típicos y se guardan con la rúbrica", () => {
    const onSave = montar(null);
    llenarNuevaRubrica();

    fireEvent.click(screen.getByRole("checkbox", { name: /Usar niveles de desempeño/ }));
    expect(screen.getByLabelText("Nombre del nivel 1")).toHaveValue("Excelente");
    expect(screen.getByLabelText("Porcentaje del nivel 4")).toHaveValue(25);
    guardar("Crear rúbrica");

    expect(onSave.mock.calls[0][0].niveles).toEqual([
      { nombre: "Excelente", puntaje: 100 },
      { nombre: "Bueno", puntaje: 75 },
      { nombre: "Regular", puntaje: 50 },
      { nombre: "Insuficiente", puntaje: 25 },
    ]);
  });

  it("no deja guardar con niveles inválidos y explica el problema", () => {
    montar(null);
    llenarNuevaRubrica();
    fireEvent.click(screen.getByRole("checkbox", { name: /Usar niveles de desempeño/ }));

    fireEvent.change(screen.getByLabelText("Porcentaje del nivel 1"), { target: { value: "90" } });

    expect(screen.getByRole("alert")).toHaveTextContent("tiene que valer 100%");
    expect(screen.getByRole("button", { name: "Crear rúbrica" })).toBeDisabled();
  });

  it("se pueden agregar y quitar niveles dentro de los límites", () => {
    montar(null);
    llenarNuevaRubrica();
    fireEvent.click(screen.getByRole("checkbox", { name: /Usar niveles de desempeño/ }));

    fireEvent.click(screen.getByRole("button", { name: "+ Nivel" }));
    fireEvent.click(screen.getByRole("button", { name: "+ Nivel" }));
    expect(screen.queryByLabelText("Nombre del nivel 7")).not.toBeInTheDocument(); // máximo 6
    expect(screen.getByRole("button", { name: "+ Nivel" })).toBeDisabled();

    for (let i = 0; i < 4; i++) fireEvent.click(screen.getAllByRole("button", { name: /Quitar el nivel/ })[0]);
    for (const quitar of screen.getAllByRole("button", { name: /Quitar el nivel/ })) expect(quitar).toBeDisabled(); // mínimo 2
  });

  it("los descriptores por nivel se guardan con el nombre del nivel y se omiten los vacíos", () => {
    const onSave = montar(null);
    llenarNuevaRubrica();
    fireEvent.click(screen.getByRole("checkbox", { name: /Usar niveles de desempeño/ }));

    fireEvent.change(screen.getByLabelText("Descriptor de Conceptos para Excelente"), { target: { value: "Define y relaciona claves." } });
    fireEvent.change(screen.getByLabelText("Descriptor de Conceptos para Regular"), { target: { value: "Solo nombra tablas." } });
    guardar("Crear rúbrica");

    expect(onSave.mock.calls[0][0].criterios[0].descriptores).toEqual({
      Excelente: "Define y relaciona claves.",
      Regular: "Solo nombra tablas.",
    });
  });

  it("renombrar un nivel no pierde el descriptor que ya se había escrito", () => {
    const onSave = montar(rubricaConNiveles);

    fireEvent.change(screen.getByLabelText("Nombre del nivel 1"), { target: { value: "Sobresaliente" } });
    guardar("Guardar cambios");

    expect(onSave.mock.calls[0][0].criterios[0].descriptores).toEqual({
      Sobresaliente: "Define y relaciona claves.",
      Regular: "Solo nombra tablas.",
    });
    expect(onSave.mock.calls[0][0].niveles[0]).toEqual({ nombre: "Sobresaliente", puntaje: 100 });
  });

  it("al quitar un nivel se va también su descriptor y quedan los de los demás", () => {
    const onSave = montar(rubricaConNiveles);

    fireEvent.click(screen.getByRole("button", { name: "Quitar el nivel Regular" }));
    guardar("Guardar cambios");

    expect(onSave.mock.calls[0][0].niveles).toEqual([
      { nombre: "Excelente", puntaje: 100 },
      { nombre: "Bueno", puntaje: 75 },
    ]);
    expect(onSave.mock.calls[0][0].criterios[0].descriptores).toEqual({ Excelente: "Define y relaciona claves." });
  });

  it("al editar una rúbrica con niveles, muestra los suyos (no los típicos) y sus descriptores", () => {
    montar(rubricaConNiveles);

    expect(screen.getByRole("checkbox", { name: /Usar niveles de desempeño/ })).toBeChecked();
    expect(screen.getByLabelText("Nombre del nivel 3")).toHaveValue("Regular");
    expect(screen.queryByLabelText("Nombre del nivel 4")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Descriptor de Conceptos para Excelente")).toHaveValue("Define y relaciona claves.");
  });

  it("desactivar los niveles de una rúbrica que los tenía manda niveles: null y sin descriptores", () => {
    const onSave = montar(rubricaConNiveles);

    fireEvent.click(screen.getByRole("checkbox", { name: /Usar niveles de desempeño/ }));
    guardar("Guardar cambios");

    expect(onSave.mock.calls[0][0].niveles).toBeNull();
    expect(onSave.mock.calls[0][0].criterios[0]).not.toHaveProperty("descriptores");
  });

  it("una rúbrica vieja sin niveles se edita sin mandar nada de niveles", () => {
    const onSave = montar(rubricaSinNiveles);

    guardar("Guardar cambios");

    expect(onSave.mock.calls[0][0].niveles).toBeUndefined();
  });

  it("'Niveles típicos' vuelve a la lista habitual", () => {
    montar(rubricaConNiveles);

    fireEvent.click(screen.getByRole("button", { name: "Niveles típicos" }));

    const filas = screen.getAllByLabelText(/Nombre del nivel/);
    expect(filas.map((f) => (f as HTMLInputElement).value)).toEqual(["Excelente", "Bueno", "Regular", "Insuficiente"]);
    expect(within(document.body).getByLabelText("Descriptor de Conceptos para Excelente")).toHaveValue("");
  });
});
