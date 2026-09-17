# EduAI · Prompts de desarrollo — Sesión de trabajo

Este archivo registra **los prompts (consignas) que se usaron durante el desarrollo**, en orden cronológico, con la **interpretación ejecutada**, los **resultados** y las **decisiones** que produjo cada uno.

> Nota de alcance: por ahora documenta **esta sesión** (fecha: 2026-09-17). Las fases previas están en reconstrucción; este archivo está pensado para que se le puedan **agregar al inicio** los prompts de esas etapas y así reconstruir el hilo completo. Para los *system prompts* de las funcionalidades IA ver `IA_MODELOS_Y_PROMPTS.md`.

---

## Contexto al inicio de la sesión

- El proyecto EduAI tiene tres piezas: `ai-services/` (Python/FastAPI, IA + RAG con Gemini y pgvector), `backend/` (Node/Express/Prisma) y `frontend/` (React/Vite).
- Pendientes detectados al abrir la sesión:
  1. **Asistente docente IA** — único módulo 100 % *mock* (`teacherAI.service.ts` devolvía un string fijo).
  2. **Corrección IA (Auto-correction Engine)** — endpoint de backend listo pero `corregirEntregaIA` era un *stub* (`aiClient.ts` devolvía `null` → 501).
  3. Endpoints del ai-service sin proxear en Node (`/tutor/resumen`, `/tutor/examen`).
  4. Rúbricas del frontend devolviendo `[]` y botones inertes.

---

## Prompt 1 · «¿Qué hicimos hasta ahora? ¿Qué más quedaría? Solo coméntamelo.»

- **Tipo:** auditoría / inventario de estado.
- **Lo que se pidió:** no ejecutar cambios; solo un comentario de las deudas y pendientes del proyecto.
- **Resultado:** inventario priorizado (funcionalidades IA, flujo de corrección, endpoints sin conectar, mejoras, deuda técnica y config pendiente).
- **Decisión clave tomada:** se definió un **orden de prioridad**: (1) asistente docente IA, (2) corrección IA, (3) el resto como pulido. Esta decisión ordena todo el trabajo de la sesión.

---

## Prompt 2 · «Dale, hagamos ese» → Asistente docente IA

- **Tipo:** implementación de funcionalidad.
- **Interpretación ejecutada** (se eligió el ítem priorizado y se expandió la consigna): conectar el asistente docente del profesor de punta a punta, **sin mocks**, replicando el patrón del tutor (RAG + LLM).
- **Trabajo realizado:**

  | Capa | Archivo | Cambio |
  |---|---|---|
  | ai-services | `src/use_cases/generar_material.py` | Nuevo CU `GenerarMaterialUseCase`: embedding del pedido → recuperación RAG → contexto → LLM → `{material, sources}` |
  | ai-services | `src/prompts/material.py` | Propósito del system prompt: generar material didáctico solo con el contexto (planificación + material de la cátedra) |
  | ai-services | `src/schemas/tutor.py` | `MaterialRequest` / `MaterialResponse` |
  | ai-services | `src/routers/tutor_router.py` | `POST /tutor/generar-material` (errores → 400/502) |
  | ai-services | `src/main.py` | Wiring del use case en `app.state` |
  | ai-services | `src/tests/test_generar_material.py` | Test del CU con fakes |
  | backend | `src/config/aiClient.ts` | `generarMaterialDocente()` → llama a `/tutor/generar-material` |
  | backend | `src/modules/asistente/` | Módulo nuevo: schemas + service + controller + routes (`POST /api/asistente/generar`) |
  | backend | `src/app.ts` | Ruta montada |
  | frontend | `src/services/teacherAI.service.ts` | Adiós al mock: llama a `/api/asistente/generar` |
  | frontend | `src/hooks/useTeacherAssistant.ts` | `ask(prompt, materiaId, classDate)` |
  | frontend | `src/pages/teacher/TeacherAIPage.tsx` | Conecta materia/clase; el botón «Usar materiales del día» deja de estar inerte |

- **Decisiones de esta fase:**
  - **No RAG plano por *prompt*:** se usa el mismo pipeline RAG del tutor (recuperación por semejanza sobre el material indexado de la materia), no "todo el material" como contexto.
  - **La planificación de la clase es contexto extra:** el backend inyecta el contenido del `planningClase` de la fecha elegida (`class_date`) al prompt, así la IA responde sobre el plan diario real, no solo sobre material.
  - **Guard de autorización:** el módulo backend valida que el usuario sea un **profesor asignado** a la materia (`obtenerProfesorAsignado`) → `403`.
  - **Contrato estable:** se definió `{material, sources}` para que el frontend pueda citar fuentes después, aunque hoy solo muestra el texto.
- **Verificación:** `pytest` (29 passed), `ruff` limpio, typecheck backend y frontend OK, build frontend OK.

---

## Prompt 3 · «Dale» → Corrección IA (Auto-correction Engine)

- **Tipo:** implementación de funcionalidad (segundo ítem priorizado).
- **Interpretación ejecutada:** implementar `correct_submission` en el ai-service y conectar el *stub* del backend.
- **Trabajo realizado:**

  | Capa | Archivo | Cambio |
  |---|---|---|
  | ai-services | `src/use_cases/correct_submission.py` | Nuevo CU `CorreccionEntregaUseCase`: RAG + prompt con consigna/entrega/rúbrica → JSON `{feedback, calificacion}` |
  | ai-services | `src/prompts/correccion.py` | System prompt del Auto-correction Engine |
  | ai-services | `src/schemas/tutor.py` | `CriterioRubrica` / `CorrectSubmissionRequest` / `CorrectSubmissionResponse` |
  | ai-services | `src/routers/tutor_router.py` | `POST /tutor/corregir-entrega` |
  | ai-services | `src/main.py` | Wiring de `correccion_use_case` |
  | ai-services | `src/tests/` | `test_correct_submission.py` + endpoint test en `test_router.py` + `FakeCorreccionLLM` en `fakes.py` |
  | backend | `src/config/aiClient.ts` | `corregirEntregaIA` → llamada real (`/tutor/corregir-entrega`) |
  | backend | `src/modules/correccion/correccion.service.ts` | Pasa también la **consigna** de la actividad al servicio de IA |

- **Decisiones de esta fase:**
  - **Salida estructurada con contrato JSON estricto:** el modelo debe devolver solo JSON (`feedback`, `calificacion`, `detalle_por_criterio`); el servidor limpia *fences*, parsea con Pydantic y **valida**.
  - **Escala argentina 0–10 con clamp:** la nota se recorta a `[0, 10]` y se redondea a 2 decimales (defensa ante valores descabellados del LLM).
  - **Rúbrica por defecto si no la hay:** contenido 40 % / claridad 30 % / consigna 30 %, coherente con el modelo `Rubrica.criterios [{nombre, peso}]`.
  - **Temperatura baja (`0.2`)** para la corrección: se prioriza consistencia sobre creatividad.
  - **Correctitud de la consigna dentro del contexto:** el backend le pasa `actividad.consigna` al ai-service para que evalúe contra lo pedido.
- **Incidente técnico y corrección:** un primer test usaba un objeto LLM construido con `type()`, que al exponer `generate()` como *bound method* duplicó el argumento `temperature`. Se reemplazó por una clase concreta (`FakeLLMFueraDeRango`) → lección registrada: **no construir fakes con `type()` dinámico**.
- **Verificación:** `pytest` (33 passed), `ruff` limpio, typecheck backend OK.

---

## Prompt 4 · «Generame un archivo .md explicando qué IA se usó, qué modelo, los distintos prompts y las decisiones a lo largo del desarrollo»

- **Tipo:** documentación.
- **Interpretación ejecutada:** crear `IA_MODELOS_Y_PROMPTS.md` con los *system prompts* de las funcionalidades, modelos y decisiones (D1–D12).

---

## Prompt 5 · Aclaración — «Me refería a los prompts que usamos a lo largo de todo el desarrollo»

- **Tipo:** refinamiento de alcance.
- **Lo que se pidió:** que el documento no fuera sobre los *system prompts* internos de las funcionalidades, sino sobre **los prompts/consignas del proceso de desarrollo en sí**.
- **Resultado:** este archivo (`PROMPTS_DESARROLLO.md`). Se acordó documentar por ahora **esta sesión** y luego reconstruir el hilo completo incorporando las fases previas (a partir de `AVANCE.md`, `IMPLEMENTATION.md` y los prompts que aporte el equipo).

---

## Lecciones de proceso de esta sesión

1. **Contrato primero, implementación después:** se definió el shape de entrada/salida antes de tocar código (comporta bien entre dos equipos: python ai-service ↔ node backend ↔ react).
2. **Patrones establecidos que se reutilizaron:** el asistente docente copió el patrón de `ask_tutor` (RAG + contexto + fuentes) y la corrección copió el patrón JSON-strict de `examen`. Replicar patrones existentes acelera y mantiene coherencia.
3. **Fakes para probar IA sin LLM:** toda la lógica se testea con `FakeLLM`/`FakeEmbeddings`/`FakeRetrieval`; el LLM real queda fuera de los tests.
4. **Verificación triple por capa:** `ruff` + `pytest` (Python), `tsc --noEmit` (Node), `tsc -b && vite build` + `eslint` (frontend).
5. **Mock-first es válido como estrategia de avance**, pero cada integración debe cerrarse con endpoint + contrato + tests (fue exactamente lo que se hizo en esta sesión con los dos pendientes grandes).

---

## Próximo paso sugerido para este archivo

Incorporar, al inicio, los prompts de las **fases previas** (levantamiento inicial y diseño, tutor IA, resumen/examen, indexación, UI) para convertir este log en el historial completo del proyecto.