# Guía para resolver los bugs y faltantes

Guía basada en la lista `bugs_y_faltantes (1).txt`. Se revisó el código de cada punto y se confirmó la causa de la mayoría con pruebas. Los números de línea son aproximados.

**Índice**

- [Antes de empezar: tres puntos que no son lo que parecen](#antes-de-empezar-tres-puntos-que-no-son-lo-que-parecen)
- [Orden recomendado](#orden-recomendado)
- [Fase 1: bugs rápidos (puntos 1 a 8)](#fase-1-bugs-rápidos)
- [Fase 2: funcionalidades medianas (puntos 9 a 11)](#fase-2-funcionalidades-medianas)
- [Fase 3: rediseño de Contenidos, Evaluaciones y menú (puntos 12 a 14)](#fase-3-rediseño-de-contenidos-evaluaciones-y-menú)
- [Qué se verificó y qué no](#qué-se-verificó-y-qué-no)

---

## Antes de empezar: tres puntos que no son lo que parecen

1. **"Mis estadísticas" no está mockeado.** El frontend llama a `/api/analytics/progreso`, que consulta la base de datos. Lo que sí está mal es la caché (punto 8). Lo realmente mockeado es la tabla de **Calificaciones** del docente: `tp3` y `parcial` están escritos como `"—"` en [`teacherCourses.service.ts`](../frontend/src/services/teacherCourses.service.ts) (línea ~125).
2. **Los caracteres raros no vienen de los archivos del código.** Se escaneó todo el repo (código, docs, seed, SQL): todo es UTF-8 válido, sin mojibake. Las causas son dos y se reprodujeron (punto 6).
3. **No existe contabilidad de tokens.** El campo `tokens_respuesta` guarda los tokens *ahorrados* por la depuración del prompt, no los consumidos. Por eso "que no decremente ante error" no se puede cumplir hoy (punto 11).

## Orden recomendado

| Fase | Puntos | Esfuerzo |
| --- | --- | --- |
| **1. Bugs con causa confirmada** | 1 a 8 | Chico: cada uno es un cambio puntual |
| **2. Funcionalidades medianas** | 9, 10, 11 | Mediano: hay backend y pantalla |
| **3. Rediseño** | 12, 13, 14 | Grande: cambia el modelo de datos |

El punto 14 (menú) va **al final**, porque depende de que existan Evaluaciones y la jerarquía de Contenidos.

---

## Fase 1: bugs rápidos

### 1. Alumno: el botón del material no abre ni descarga

- **Causa:** [`courses.service.ts`](../frontend/src/services/courses.service.ts) guarda `url: c.archivo_url`, que es una ruta relativa (`/uploads/x.pdf`). El navegador la resuelve contra el frontend (puerto 5173), que devuelve la app en vez del archivo. En la vista del docente funciona porque ahí sí se antepone `API_URL`.
- **Pasos:**
  1. En `courses.service.ts`, importar `apiUrl` de `./api` y mapear `url: apiUrl(c.archivo_url ?? c.url)`.
  2. Hacer lo mismo donde se muestre un archivo ya entregado ([`AssignmentSubmitModal.tsx`](../frontend/src/components/student/AssignmentSubmitModal.tsx)): hoy muestra solo el nombre, sin enlace.
  3. Si el frontend se sirve con nginx, agregar `location /uploads/` hacia el backend en [`nginx.conf`](../frontend/nginx.conf).
- **Verificar:** el enlace debe empezar con `http://localhost:3000/uploads/…`.

### 2. Docente: no ve el documento de una entrega

- **Causa:** [`corrections.service.ts`](../frontend/src/services/corrections.service.ts) (línea ~73) arma el texto `📎 nombre` y descarta la URL.
- **Pasos:**
  1. Agregar `archivo_url` a la interfaz `EntregaPendiente` y `fileUrl` / `fileName` a `CorrectionQueueItem`. Comprobar que `/api/entregas/pendientes` ya devuelve `archivo_url`; si no, agregarlo en `toEntregaDto`.
  2. En [`TeacherCorrectionsPage.tsx`](../frontend/src/pages/teacher/TeacherCorrectionsPage.tsx), en "Entrega del alumno", renderizar un enlace `<a href={apiUrl(fileUrl)} target="_blank">`.
  3. Hacer lo mismo en cualquier otra pantalla que liste entregas.
- **Mejora opcional:** hoy la IA corrige una entrega con archivo viendo solo `[entrega adjunta: nombre]`, o sea que no corrige nada. Para que corrija de verdad, el ai-service tendría que extraer el texto del PDF o DOCX con su `DocumentService`.

### 3. "Gestionar secciones" lleva a Mis estudiantes

- **Causa:** [`TeacherCoursesPage.tsx`](../frontend/src/pages/teacher/TeacherCoursesPage.tsx) (líneas ~35 y ~81) navega a `/teacher/students?course=…`.
- **Pasos:**
  1. Cambiar ambas a `/teacher/content?course=${c.id}` y renombrar el texto a "Gestionar contenidos".
  2. [`TeacherContentPage.tsx`](../frontend/src/pages/teacher/TeacherContentPage.tsx) hoy **no lee** `?course=`: usar `useSearchParams` para inicializar `courseId`.

### 4. Admin: "Editar" materia no trae descripción ni nivel educativo

- **Causa:** el backend sí devuelve esos datos, pero `toAdminSubject` en [`adminSubjects.service.ts`](../frontend/src/services/adminSubjects.service.ts) los descarta. `loadForEdit` en `AdminMateriasPage` busca campos que no existen.
- **Riesgo real:** al guardar con esos campos vacíos, el `PUT` manda `descripcion: null` y **borra la descripción guardada**.
- **Pasos:**
  1. Agregar `descripcion`, `nivelEducativo` y `profesorId` al tipo `AdminSubject` ([`domain.ts`](../frontend/src/types/domain.ts)) y al mapper. Verificar qué id devuelve `profesores[0].id`, porque `asignarProfesor` espera el id de perfil docente.
  2. Quitar el cast `as Record<string, string | undefined>` de `loadForEdit`.
- **Verificar en la base:**

  ```bash
  docker exec eduai-db psql -U eduai -d eduai -c "SELECT nombre, descripcion, nivel_educativo FROM materias;"
  ```

### 5. Quitar "Similar a Moodle" y el buscador

- **Moodle:** [`StudentCourseDetailPage.tsx`](../frontend/src/pages/student/StudentCourseDetailPage.tsx) (línea ~99, la etiqueta) y [`StudentCoursesPage.tsx`](../frontend/src/pages/student/StudentCoursesPage.tsx) (línea ~17, "Aulas virtuales estilo Moodle").
- **Buscador:** borrar el `<input type="search">` de [`Header.tsx`](../frontend/src/components/layout/Header.tsx) (líneas ~22 a 27).

### 6. Caracteres extraños: dos causas confirmadas

**a) Nombres de archivo con tilde o Ñ.** `multer` decodifica los nombres como latin1. Reproducido: `Presentación Año Ñandú.pdf` llega como `PresentaciÃ³n AÃ±o ÃandÃº.pdf`.

1. Crear un helper `nombreUtf8 = (s) => Buffer.from(s, "latin1").toString("utf8")` y aplicarlo a `originalname` en contenidos, entregas, planificación y logo. Aplicarlo solo si el resultado no contiene `�`, por si algún cliente ya manda UTF-8.
2. Corregir lo ya guardado (probarlo antes en una copia de la base):

   ```sql
   UPDATE contenidos SET archivo_nombre = convert_from(convert_to(archivo_nombre,'LATIN1'),'UTF8')
   WHERE archivo_nombre ~ '[ÃÂ]';
   ```

   Repetir para `entregas.archivo_nombre` y `planning_clases.material_nombre`.

**b) CSV.** El archivo se genera sin BOM, así que Excel lo abre como ANSI.

1. En `downloadCsv` de [`adminReports.service.ts`](../frontend/src/services/adminReports.service.ts), usar `new Blob(["﻿", result.csv], …)`.
2. En Excel con configuración regional es-AR el separador esperado es `;`. Si se ve todo en una sola columna, cambiar `,` por `;`.

**Si persiste en otra sección:** capturar dónde ocurre. Revisar también `SHOW server_encoding;` en Postgres y que los datos no se hayan insertado desde una terminal de Windows sin `chcp 65001`.

### 7. Prompts: sin saludos ni formato

- **Dónde:** [`ai-services/src/prompts/`](../ai-services/src/prompts/) (`tutor.py`, `socratic.py`, `hints.py`, `summary.py`, `material.py`, etc.). Hoy ninguno prohíbe saludos ni markdown.
- **Pasos:**
  1. Crear una constante `ESTILO` y agregarla al final de cada prompt: *"Respondé directo, sin saludos, despedidas ni frases de relleno. Texto plano: sin negritas, sin asteriscos, sin encabezados, sin emojis. Para listas usá guion o numeración."*
  2. Agregar una red de seguridad: una función `limpiarMarkdown` que quite `**`, `*texto*`, `__`, backticks y `#` iniciales. En el tutor con streaming, aplicarla al **texto acumulado al renderizar**, no token por token.
  3. Decidir qué pasa con el asistente docente: el generador de PDF ([`materialPdf.ts`](../backend/src/modules/asistente/materialPdf.ts)) usa `#` para los títulos. Si se prohíbe el markdown ahí, el PDF pierde jerarquía.
  4. Reducir `max_tokens` por caso de uso y actualizar los tests que comparan texto.

### 8. Estadísticas que parecen falsas

- **Causa real, una fuga entre usuarios:**
  - [`progress.service.ts`](../frontend/src/services/progress.service.ts) (línea ~59) y [`adminLicensing.service.ts`](../frontend/src/services/adminLicensing.service.ts) (línea ~9) guardan una promesa en `let cache` que **nunca se limpia**.
  - Además `main.tsx` crea el `QueryClient` y nunca se limpia al cerrar sesión.
  - Resultado: si entra otro usuario en la misma pestaña, ve los datos del anterior. Es un problema de privacidad.
- **Pasos:**
  1. Borrar los `let cache` y dejar que React Query cachee.
  2. En el logout y el login de [`AuthContext.tsx`](../frontend/src/contexts/AuthContext.tsx), llamar a `queryClient.clear()` (con `useQueryClient`).
  3. Incluir el id del usuario en las claves de consulta que dependen del usuario.
- **Si los números siguen en 0**, el alumno no tiene datos cargados:

  ```bash
  docker exec eduai-db psql -U eduai -d eduai -c "SELECT (SELECT count(*) FROM notas WHERE alumno_id=(SELECT id FROM usuarios WHERE email='alumno1@ies.edu')) AS notas, (SELECT count(*) FROM asistencias WHERE alumno_id=(SELECT id FROM usuarios WHERE email='alumno1@ies.edu')) AS asistencias;"
  ```

- **"Detalle de calificaciones":** el nombre de la evaluación sale del campo `observaciones` o del período, por eso parece de relleno. Se resuelve de raíz con el punto 13.

---

## Fase 2: funcionalidades medianas

### 9. Chat del tutor: persistencia y ampliación

- **Causa:** el backend ya guarda todo (`sesiones_ia`, `mensajes_ia`) y expone `GET /api/tutor/sesiones` y `GET /api/tutor/sesiones/:id/mensajes`, filtrados por alumno. Pero [`useTutorChat.ts`](../frontend/src/hooks/useTutorChat.ts) ignora esos endpoints: al cambiar de materia hace `sesionIdRef = null; setMessages([])`.
- **Pasos:**
  1. Al montar el chat, pedir las sesiones del alumno, tomar la más reciente de **esa** materia y cargar sus mensajes. Guardar el id en `sesionIdRef`. Puede hacer falta un filtro `?materiaId=` en el backend.
  2. Agregar el botón "Nueva conversación" y una lista de "Conversaciones anteriores" (fecha y primera pregunta).
  3. Agregar `DELETE /api/tutor/sesiones/:id` para que el alumno pueda borrar su historial.
  4. **Ampliar:** extraer el chat a un componente `TutorChat` y abrirlo en el `Modal` existente (o a pantalla completa) con un botón "Ampliar". Hoy el contenedor tiene `max-h-72`.
- ⚠️ **Conflicto de privacidad:** se pidió el historial "privado". El perfil del alumno que ve el docente muestra sus **últimas 10 consultas** ([`perfil-alumno.service.ts`](../backend/src/modules/materias/perfil-alumno.service.ts)). Hay que decidir si el docente puede ver el contenido o solo conteos y temas. Si es privado, eliminar `ultimas_consultas`.

### 10. Mensajería: alumno→docente, filtros, emisor y respuestas

- **Situación actual:**
  - `POST /api/messages` deja escribir a cualquier usuario por id, sin validar relación alguna.
  - `POST /api/messages/broadcast` es solo para docentes, pero `enviarBroadcast` busca `usuario.findMany({ rol })` y llega a **todos los usuarios activos del sistema**.
  - Los destinatarios reciben solo una notificación, sin emisor visible, y no pueden responder.
  - El alumno no tiene pantalla de mensajes.
- **Pasos:**
  1. **Permisos** en `messages.service.ts`: alumno solo a docentes de sus materias; docente solo a alumnos de las suyas; admin sin restricción.
  2. **Filtros del envío masivo:** agregar al esquema `materia_ids[]` y, opcionalmente, `alumno_ids[]` para elegir destinatarios concretos. Calcularlos desde `inscripciones` y validar que el docente esté asignado a esas materias. Para "cantidad X", conviene ofrecer selección con casillas: es más claro que un número.
  3. **Dos vías:** en vez de una notificación suelta, crear un mensaje directo en la conversación entre emisor y cada destinatario. Así pueden responder en el mismo hilo.
  4. **Emisor:** mostrar "De: nombre · materia" en las notificaciones y en la bandeja (agregar `emisor_id` a `notificaciones`).
  5. **Pantalla del alumno:** nueva ruta `/student/messages` y opción "Mensajes" en el menú, reutilizando los componentes de [`TeacherMessagesPage.tsx`](../frontend/src/pages/teacher/TeacherMessagesPage.tsx). Necesita un endpoint de contactos permitidos según el rol.
  6. Tests de permisos (alumno→alumno debe dar 403).

### 11. Licencias y tokens

- **Hoy:** [`obtenerEstadoLicencia`](../backend/src/modules/admin/admin.service.ts) solo cuenta alumnos activos (no es "usuarios activos del mes") y no hay cuota de tokens.
- **Pasos:**
  1. **Medir lo real:** en el ai-service, tomar `usage_metadata` de Gemini (tokens de entrada y salida) tanto en `generate` como en el streaming, y devolverlo en la respuesta.
  2. **Guardarlo** en `mensajes_ia` (columnas nuevas) o en una tabla `consumo_ia` (usuario, materia, tipo, tokens, fecha).
  3. **Regla de oro:** registrar el consumo **solo después de una respuesta exitosa**. Si el proveedor falla (502), hay timeout o el cliente aborta, no se escribe nada. Para el streaming, solo si llegó texto. Usar una clave única por pedido para que un reintento no se cobre dos veces.
  4. **Cuota atómica:** antes de llamar a la IA, verificar el saldo del mes. Para el descuento usar un `UPDATE … WHERE usados + n <= límite`, igual que el cupo de las claves de matriculación.
  5. **Errores claros:** definir respuestas del tipo "licencia vencida" o "cuota agotada" (HTTP 402 o 429) y mostrar un mensaje comprensible en el frontend.
  6. Mostrar en Licencias los tokens usados y restantes, y calcular el uso mensual real desde `sesiones` de los últimos 30 días.

---

## Fase 3: rediseño de Contenidos, Evaluaciones y menú

### 12. Jerarquía Unidad → Clase → archivos

- **Hoy:** `Seccion` (unidad) contiene `Contenido`. Las clases viven en `PlanningClase`, que solo cuelga de la materia y **no está ligada a ninguna unidad**, con un único archivo en columnas sueltas (`material_*`).
- **Modelo propuesto:**
  - `PlanningClase.seccion_id` (opcional, FK a la unidad).
  - Tabla de unión `clase_contenido (clase_id, contenido_id)`: así una clase puede **reutilizar un material ya subido** a Contenidos o subir uno nuevo.
  - `Actividad.clase_id` (opcional), para que una evaluación muestre a qué clase pertenece.
  - Migración de datos: cada `material_url` actual pasa a ser un `Contenido` ligado a su clase.
- **API:** `GET /materias/:id/estructura` que devuelva el árbol (unidad → archivos y clases → archivos y actividades). Más `POST /secciones/:id/clases`, `PUT` y `DELETE /clases/:id`.
- **Pantallas:**
  - **Alumno** ([`StudentCourseDetailPage.tsx`](../frontend/src/pages/student/StudentCourseDetailPage.tsx)): acordeón Unidad → Clases → archivos y evaluaciones.
  - **Docente** (Contenidos): árbol con "+ Clase", "+ Archivo" y "+ Evaluación" en cada nivel, y un botón "Planificación" dentro de Contenidos.
  - **Formulario de crear sección:** reemplazar la caja "Subir archivo" por un botón opcional "Subir contenido a la unidad" y la opción "Crear una clase ahora".
  - **"Agregar texto o consigna"** pasa a abrir `ActivityFormModal` ya vinculado a la unidad o clase.
  - **Material de la clase:** dos pestañas, "Elegir de Contenidos" y "Subir archivo".

### 13. Evaluaciones y Calificaciones

- **El problema:** `Nota` es solo `(alumno, materia, periodo, calificacion)`, sin relación con las actividades. Por eso Calificaciones usa columnas fijas.
- **Modelo propuesto:**
  - `Actividad.categoria` (TP, PARCIAL, FINAL, OTRO) y `peso` opcional.
  - `Nota.actividad_id` opcional. Al **publicar una corrección** (`corregir`), crear o actualizar la nota de esa actividad.
  - Para parciales presenciales (sin entrega): un cuadro de carga manual de notas por alumno, que escribe en `Nota`.
- **API:** `GET /materias/:id/calificaciones` devuelve las evaluaciones de la materia (nombre, tipo, peso) y, por alumno, su nota en cada una, más el promedio ponderado.
- **Frontend:** reemplazar `tp1/tp2/tp3/parcial` por columnas dinámicas generadas desde esa respuesta. En el detalle del alumno, usar el nombre real de la actividad como "evaluación".

### 14. Menú del docente

- **Objetivo:** Inicio · Mis materias · Mis estudiantes · Evaluaciones · Analytics · Asistente IA · Mensajes.
- **Dónde:** [`navConfig.ts`](../frontend/src/router/navConfig.ts) y las rutas de [`App.tsx`](../frontend/src/App.tsx).
- **Pasos:**
  1. **Mis estudiantes** pasa a ser un hub con pestañas: Listado · Calificaciones · Asistencia. Reutilizar las páginas existentes y dejar las rutas viejas como redirecciones.
  2. **Evaluaciones** (nueva): pestañas Actividades · Correcciones, más un botón "Ir a Calificaciones".
  3. **Contenidos** sale del menú: se entra desde **Mis materias** (el botón del punto 3), y **Planificación** desde dentro de Contenidos.
  4. Actualizar el manual de usuario y la matriz de casos de uso.

---

## Qué se verificó y qué no

- **Confirmado con pruebas:** la decodificación latin1 de multer, y que ningún archivo del repo tiene la codificación rota.
- **Confirmado leyendo el código:** los puntos 1 a 5, 8, 10 y 11.
- **No comprobado en el navegador:** cómo se ve cada pantalla, ni los pocos puntos que dependen de los datos de cada instalación (por ejemplo, dónde exactamente aparecen caracteres raros además de los dos casos reproducidos).
