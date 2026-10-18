# EduAI Platform — Bugs encontrados (prueba E2E manual)

> **Fecha:** 2026-10-17 · **Entorno:** Docker Compose local (`docker compose up`)
> **Usuarios del seed:** `admin@ies.edu` · `profe1@ies.edu` · `alumno1@ies.edu` (password `Clave1234`)
> **Estado general:** los 10 bugs fueron **corregidos** (ver "Correcciones aplicadas" al final). Pendiente: validación E2E manual con Docker levantado.

## Resumen

Se detectaron fallas funcionales en tres áreas: **Branding**, **módulo Profesor** y **módulo Alumno**.
La mayoría de las pantallas del profesor **no hacen nada al interactuar** (botones sin efecto, listados
vacíos, inputs desplegables vacíos), lo que apunta a **componentes mockeados o sin llamadas a la API reales**.

**Observación clave:** los bugs del módulo Profesor (3–9) se reproducen **solo con el usuario profesor
creado a mano por el admin** en el primer paso, **no** con el `profe1@ies.edu` del seed. Sospecha: puede
haber **datos o identificadores hardcodeados/mockeados** en el frontend que dependen del usuario sembrado.

---

## 1. Branding — el logo no carga

- **Área:** Admin → Ajustes / Branding
- **Severidad:** Media
- **Pasos para reproducir:**
  1. Entrar como `admin@ies.edu` → Ajustes/Branding.
  2. Subir un logo.
  3. Guardar y recargar la página.
- **Esperado:** el logo subido se muestra en la pantalla de branding (y en el sidebar).
- **Observado:** el logo **no carga**.
- **Hipótesis:** subida/mostrado del logo roto (URL no servible o `logo_url` no persistido/consumido).

## 2. Branding — el preset de color seleccionado siempre es el primero

- **Área:** Admin → Ajustes / Branding
- **Severidad:** Media
- **Pasos para reproducir:**
  1. Elegir un preset de color que **no** sea el primero.
  2. Guardar (el tema **sí** se aplica correctamente).
  3. Recargar la página.
- **Esperado:** el preset guardado aparece marcado con el check (palomita).
- **Observado:** al recargar, **siempre aparece el primer preset** con el check, aunque el tema
  guardado sea otro.
- **Nota:** el **tema sí se persiste y aplica bien**; el bug es solo de la **preselección visual**.
- **Hipótesis:** el componente no inicializa el preset seleccionado a partir del valor real
  guardado (queda fijo en el índice 0).

---

## Módulo Profesor (bugs 3–9)

> **Contexto crítico:** todos estos fallos ocurren **con el profesor nuevo creado por el admin**.
> Con el profesor del seed (`profe1@ies.edu`) no se reprodujeron. Revisar si hay datos
> hardcodeados/mockeados o `queryKey`s/campos que dependan del usuario sembrado.

### 3. "Contenidos" → "Seleccionar destino" no carga opciones

- **Área:** Profesor → Contenidos → *Seleccionar destino*
- **Severidad:** Alta (bloquea la subida de contenido)
- **Pasos:** abrir el desplegable "Seleccionar destino".
- **Esperado:** listar las secciones/destinos disponibles de la materia.
- **Observado:** el input desplegable **no carga nada**.
- **Hipótesis:** el listado de secciones/destinos no llega o no se consulta (mock vacío o endpoint
  no invocado para el profesor nuevo).

### 4. "📎 Subir archivo" sin feedback y probablemente no funciona

- **Área:** Profesor → Contenidos → *📎 Subir archivo*
- **Severidad:** Alta (bloquea CU-P02)
- **Observado:**
  - **No hay ningún indicador** de que el archivo se subió correctamente.
  - **Probablemente la subida no funciona** (sin confirmación ni error visible).
- **Esperado:** feedback de éxito/error y registro real del archivo (índice RAG, `rag_indexado`, etc.).
- **Hipótesis:** handler de subida no cableado al endpoint real, o sin manejo de estado de subida.

### 5. "Guardar y publicar" no hace nada

- **Área:** Profesor → Contenidos
- **Severidad:** Alta
- **Observado:** el botón "Guardar y publicar" **no hace absolutamente nada**.
- **Esperado:** guardar/crear el contenido y publicarlo.
- **Hipótesis:** botón sin `onClick` o conmutado a un mock.

### 6. "Nueva rúbrica" no hace nada

- **Área:** Profesor → Correcciones → Gestionar rúbricas → *Nueva rúbrica*
- **Severidad:** Alta (bloquea CU-P04)
- **Observado:** el botón **no hace nada**.
- **Esperado:** abrir el formulario de creación de rúbrica y permitir guardarla.
- **Hipótesis:** handler sin cablear (existe `RubricFormModal` en el código, pero no se abre aquí).

### 7. Planificación — no funciona nada

- **Área:** Profesor → Planificación
- **Severidad:** Alta
- **Observado:** la sección está **completamente inoperante** (ninguna acción responde).
- **Hipótesis:** pantalla mockeada o sin integración real con la API.

### 8. "Mis estudiantes" no trae estudiantes

- **Área:** Profesor → Mis estudiantes
- **Severidad:** Alta
- **Observado:** el listado **no trae estudiantes** (vacío).
- **Esperado:** listar los alumnos de las materias del profesor.
- **Hipótesis:** consulta vacía/errónea para el profesor nuevo (filtro por alumno/materia mal armado
  o dependiente de datos del seed).

### 9. Asistencia — no funciona

- **Área:** Profesor → Asistencia
- **Severidad:** Alta
- **Observado:** la sección **no funciona** (mismo patrón que el resto).
- **Hipótesis:** pantalla sin lógica real / mock.

### Nota transversal (bugs 3–9)

Coinciden: son pantallas del profesor que **no ejecutan acciones reales**. Revisar el frontend completo
en busca de **mocks, datos hardcodeados y handlers sin cablear**, prestando atención a por qué
**solo afecta al profesor recién creado** y no al del seed.

---

## Módulo Alumno

### 10. Enrolamiento OK, pero al entrar a la materia: "No se encontró la materia"

- **Área:** Alumno → Mis materias / materia individual
- **Severidad:** Alta
- **Pasos para reproducir:**
  1. Generar una clave de matriculación con el admin.
  2. Enrolarse con el alumno usando la clave (**funciona correctamente**).
  3. Intentar ingresar a la materia.
- **Esperado:** abrir la pantalla de la materia y mostrar su contenido.
- **Observado:** mensaje **"No se encontró la materia."**
- **Hipótesis a validar:**
  - ¿La **página individual de la materia** no está desarrollada?
  - ¿O la materia **no se trae** por el endpoint (filtro por inscripción/id incorrecto)?

---

## Análisis de causa raíz (evidencia)

> **Fecha:** 2026-10-17 · **Método:** lectura de `frontend/src` + `backend/src` y verificación contra
> la base de datos en vivo (`docker compose exec db psql`) y la API real (`curl`/`Invoke-RestMethod`).

**Corrección de la hipótesis inicial:** el frontend **NO está mockeado**. Todas las pantallas del
profesor y del alumno llaman a endpoints reales. Los fallos se explican por **estado vacío de la
materia del profesor nuevo** + **falta de UIs de creación** + secretos desacoples puntuales.

### Evidencia en base de datos

La materia del profesor nuevo (`Webar1`, de `matiaspeoli@hotmail.com`) se compara con las del seed:

| Materia | secciones | inscriptos | planif | actividades | rubricas |
| --- | --- | --- | --- | --- | --- |
| **Webar1** (profesor nuevo) | **0** | 1 | **0** | **0** | **0** |
| Programación II | 2 | 10 | 6 | 2 | 1 |
| Bases de Datos | 2 | 10 | 6 | 2 | 1 |
| Redes de Computadoras | 2 | 10 | 6 | 2 | 1 |

El profesor nuevo **sí** tiene la materia asignada (`materia_profesores.activo = true`, vía
`POST /api/admin/materias/:id/profesores`), pero la materia no tiene secciones ni ningún dato
operativo. Las materias del seed sí, y por eso `profe1@ies.edu` "funciona".

### Causa por bug

- **1. Logo no carga** — `backend/src/config/storage.ts:105` guarda la URL **relativa**
  (`/uploads/<key>`); confirmado en DB: `institutions.logo_url = /uploads/HC8-...jpg`. El front la usa
  cruda en `<img src>` (`components/layout/Sidebar.tsx:34`, `pages/admin/AdminSettingsPage.tsx:70`)
  → se resuelve contra `http://localhost:5173/uploads/...` → 404. `services/content.service.ts:61`
  sí prefija `API_URL`; acá no. **Fix:** prefijar `API_URL` (o guardar URL absoluta).

- **2. Preset siempre el primero** — `pages/admin/AdminSettingsPage.tsx:13` fija
  `selectedPreset="p-blue"` y el `useEffect` (22-31) setea nombre/colores/logo pero **nunca** llama
  `setSelectedPreset`. La DB solo persiste **colores**, no el preset elegido (confirmado:
  `color_primario=#7c0d0d` con check en "azul"). **Fix:** persistir `preset_id` o inferir el preset
  comparando los colores guardados.

- **3. "Seleccionar destino" vacío** — `getCourseSections` devuelve `[]` (`Webar1` tiene 0
  secciones). El `<select>` queda vacío (`pages/teacher/TeacherContentPage.tsx:101-112`) y **no existe
  pantalla para crear secciones**: los endpoints `POST/PUT/DELETE /api/materias/:id/secciones` están
  implementados (`backend/src/modules/secciones/*`) pero el frontend nunca los invoca. **Fix:** añadir
  UI de gestión de secciones.

- **4/5. Subir archivo / "Guardar y publicar"** — mismo origen que el 3: con `activeSection = null`,
  `handleUpload` corta con "Seleccioná una materia y una sección destino"
  (`TeacherContentPage.tsx:31-34`) y el botón queda `disabled` (`!activeSection`, `:169`). No es un
  handler sin cablear.

- **6. "Nueva rúbrica" no hace nada** — el botón está `disabled={!selectedMateriaId}`
  (`pages/teacher/TeacherCorrectionsPage.tsx:307`), y `selectedMateriaId` solo proviene de una
  **entrega seleccionada** de la cola. Con `Webar1` sin entregas la cola está vacía → botón muerto.
  **Fix:** desacoplar la gestión de rúbricas de la entrega seleccionada.

- **7. Planificación no funciona** — la página solo **edita** clases ya existentes
  (`planning[classIndex]`, `pages/teacher/TeacherPlanningPage.tsx:15-16,26`). Con `planif = 0`,
  `current = undefined` → no hay botones de clase y guardar queda `disabled` (`!current`, `:140`). No
  hay forma de crear una clase. **Fix:** agregar "crear clase".

- **8. "Mis estudiantes" vacío** — la lista se deriva de **notas + asistencias**
  (`services/teacherCourses.service.ts:45-86`), no de `inscripciones`. Sin datos → vacío. **Fix:**
  basar el listado en las inscripciones a la materia.

- **9. Asistencia vacía** — la tabla se deriva de asistencias ya registradas
  (`services/attendance.service.ts:19-74`). Sin registros → tabla vacía y confirmar `disabled`
  (`all.length === 0`, `TeacherAttendancePage.tsx:187`). **Fix:** partir de los alumnos inscriptos.

- **10. "No se encontró la materia" (alumno)** — **mismatch de envelope**. Verificado en vivo:
  `GET /api/materias/:id` responde `{ "materia": {...} }` (`backend/src/modules/materias/materias.controller.ts:30`),
  pero `frontend/src/services/courses.service.ts:66-69` lo consume como si fuera la materia directa.
  Así `materia.id` es `undefined`, `colorDeMateria(materia.id)` lanza `TypeError` (`:35`) y el `catch`
  amplio (`:107`) devuelve `undefined` → mensaje de error. **Afecta a todas las materias, no solo a la
  nueva.** **Fix:** desenvolver `materia.materia` (o reusar `toCourseDto`).

### Conclusión y plan sugerido

- **Fixes de 1 línea:** bug 1 (prefijar `API_URL`), bug 2 (setear/inferir preset), bug 10 (desenvolver
  el envelope). Prioridad alta por el 10, que rompe la vista de materia para todos los alumnos.
- **Falta de funcionalidad (causa de 3-9):** construir la **UI de gestión de secciones** (bug 3, y
  desbloquea 4 y 5) y **UI de creación de clases** (bug 7); **desacoplar rúbricas** de la entrega
  seleccionada (bug 6); y **rebasar estudiantes/asistencia en `inscripciones`** (bugs 8 y 9).

## Preguntas abiertas para el equipo

> Resueltas por el análisis de causa raíz de arriba:

1. ~~¿Los bugs 3–9 son el mismo problema raíz (frontend mockeado) o pantallas distintas sin cablear?~~
   → **No hay mocks.** Causa común: materia del profesor nuevo **sin secciones/planificación/actividades**
   + **falta de UIs de creación** (secciones, clases).
2. ~~¿Por qué solo con el profesor nuevo y no con el del seed?~~ → La materia del seed tiene secciones,
   planificación y actividades; `Webar1` (profesor nuevo) no (evidencia en DB arriba).
3. ~~Bug 2: confirmar que es solo inicialización visual.~~ → Confirmado: el color se **persiste y aplica**;
   el preset elegido **no se persiste** y `selectedPreset` queda fijo en `p-blue`.
4. ~~Bug 10: ¿falta la página de materia o es bug de consulta?~~ → Bug de consulta: **envelope**
   `{ materia }` no desenvuelto en `courses.service.ts`.

## Próximo paso sugerido

Auditoría del frontend **completada** (ver "Análisis de causa raíz"). Prioridad de arreglos:

1. **Bug 10** — desenvolver el envelope en `courses.service.ts:66-69` (rompe la vista de materia para todos los alumnos).
2. **Bug 1** — prefijar `API_URL` a `logo_url`.
3. **Bug 2** — persistir/inferir el preset seleccionado.
4. **Bugs 3, 4, 5** — UI de gestión de secciones.
5. **Bug 7** — UI para crear clases de planificación.
6. **Bug 6** — desacoplar gestión de rúbricas de la entrega seleccionada.
7. **Bugs 8, 9** — basar estudiantes/asistencia en las `inscripciones` de la materia.

---

## Correcciones aplicadas

> **Fecha:** 2026-10-17 · Todos los fixes abajo están **sin commitear**. Verificado con
> `npm run typecheck` + `npm test` (frontend **18/18**, backend **86/86**) y `npm run lint` (0 errores).

| Bug | Estado | Cambio |
| --- | --- | --- |
| 1 | ✅ | `services/api.ts`: helper `apiUrl()`. `BrandingContext.tsx` y `AdminSettingsPage.tsx` prefijan la URL del logo. |
| 2 | ✅ | `AdminSettingsPage.tsx`: el `useEffect` infiere el preset comparando los colores guardados y llama `setSelectedPreset`. |
| 3 | ✅ | `content.service.ts` (`createSection`/`deleteSection`), `useContent.ts` (`useCreateSection`/`useDeleteSection`) y card "🧩 Secciones de la materia" en `TeacherContentPage.tsx`. |
| 4/5 | ✅ | Desbloqueados por el fix de 3 (con secciones, `activeSection` deja de ser `null`). |
| 6 | ✅ | `TeacherCorrectionsPage.tsx`: selector de materia propio + `useTeacherCourses`; rúbricas ya no dependen de la entrega seleccionada. |
| 7 | ✅ | `TeacherPlanningPage.tsx`: estado `editingDate`/`draftDate`/`startNewClass` + control "Agregar clase por fecha". |
| 8 | ✅ | Backend `GET /api/materias/:id/inscriptos`; `teacherCourses.service.ts` parte de los inscriptos y muestra "—" cuando no hay notas/asistencias. |
| 9 | ✅ | `attendance.service.ts` parte de los inscriptos y mergea las asistencias existentes. |
| 10 | ✅ | `courses.service.ts`: desenvuelve `respuesta.materia`. |

**Backend nuevo:**

- `materias.service.ts::listarInscriptos(materiaId, usuarioId, rol)` — valida acceso (profesor asignado / inscripción / admin) y devuelve `{ id, nombre, email }[]`.
- `materias.controller.ts::inscriptos` y ruta `GET /:id/inscriptos` (`materias.routes.ts`).

### Pendiente

- Volver a levantar Docker (`docker compose up -d`) y hacer la validación E2E manual de los 10 ítems.
