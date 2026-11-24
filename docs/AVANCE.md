# EduAI Platform — Avance del Proyecto

> Snapshot original: **2026-09-30** (bugs y casos de uso actualizados hasta el 2026-11-20) · Reemplaza a `AVANCE.txt` (última actualización 2026-09-06).
>
> **Este documento es la bitácora de lo ya hecho** y por qué. **Los pendientes viven en un solo lugar:**
> [`PLAN_DE_ACCION.md`](../PLAN_DE_ACCION.md). Regla: una tarea abierta se anota solo en el plan; al cerrarla se
> marca ahí y se deja una entrada con fecha en este documento. No se copia el estado a otros archivos.
>
> **Mapa de arquitectura para el equipo:** `graphify-out/README.md` (arquitectura real, god nodes,
> puntos de extensión e inventario de pendientes verificado contra el código).
>
> **Reporte de bugs y faltantes:** 2026-11-17 — fusionado abajo en
> [BUGS Y FALTANTES](#bugs-y-faltantes-reporte-de-usuarios--2026-11-17).

---

# HISTORIAL DE PENDIENTES CERRADOS

Todo lo que está ticked (✅) en este documento **ya está implementado y verificado**. Lo que sigue abierto
(pendiente, pausado o pospuesto) está **solo** en [`PLAN_DE_ACCION.md`](../PLAN_DE_ACCION.md).

> **Fuera de alcance:** el despliegue en la nube. La cátedra aceptó que alcanza con **correr el proyecto en local
> con Docker Compose** (ver `DOCUMENTACION_TECNICA.md` §14). El análisis que se había hecho quedó archivado en
> `docs/archivo/DEPLOY.md` y no es un pendiente.

## 🟠 FUNCIONALIDAD (2–6 ✅ hechas; 6 cerrada 2026-10-17)

### 2. ✅ Notificaciones — frontend implementado (2026-10-16)
Backend ya estaba completo (4 endpoints) y ahora tiene consumidor real:
- `frontend/src/services/notificaciones.service.ts`, `frontend/src/hooks/useNotificaciones.ts`
  (incluye `useNoLeidasCount` para el badge). `api.ts` es un wrapper `fetch` (`api<T>(path, init?)`),
  no axios.
- Página `frontend/src/pages/common/NotificacionesPage.tsx` con listado y "marcar como leída",
  ruta `/notificaciones` en `App.tsx`, `ProtectedRoute` con `allow` opcional.
- `Header.tsx` reemplazó el punto rojo hardcodeado por el contador real.
- Util `frontend/src/utils/format.ts` (`formatFecha`) y `Tr` expuesto en `Table.tsx`.

### 3. ✅ Email — servicio implementado y cableado (2026-10-17)
- `backend/src/services/email.service.ts`: `sendEmail` (lanza ante fallo del proveedor) y
  `sendEmailSeguro` (best-effort, nunca lanza), `isEmailEnabled`/`getEmailProvider`. Proveedores:
  `none` (default, no-op), `resend` y `brevo` (HTTP `fetch`) y `smtp` (nodemailer, dep agregada).
- `backend/src/config/env.ts` con `EMAIL_PROVIDER` (enum, default `none`), `EMAIL_FROM`,
  `EMAIL_API_KEY` y `EMAIL_SMTP_*`; `.env.example` y `backend/.env.example` documentados.
- Cableado a notificaciones: `crearNoLeidas` (`notificaciones.service.ts`) dispara el email
  best-effort (`void`) tras crear la notificación; con `none` no consulta ni el email del usuario.
  Tests: `backend/src/tests/email.test.ts` y `notificaciones-email.test.ts`.

### 4. ✅ R2 / object storage — cliente S3 integrado (2026-10-16)
- `backend/src/config/storage.ts` ahora enruta `guardarArchivo`/`eliminarArchivo` (ahora `async`)
  por proveedor: `LocalStorage` (disco, default) o `S3Storage` (R2/S3 vía `@aws-sdk/client-s3` +
  `lib-storage`) según `R2_ACCESS_KEY_ID`/`R2_SECRET_ACCESS_KEY`/`R2_BUCKET_NAME`. Expone
  `getStorageProvider()`.
- Deps agregadas: `@aws-sdk/client-s3` y `@aws-sdk/lib-storage` (`backend/package.json`).
- Los llamadores (`contenidos.service.ts`, `actividades.service.ts`) hacen `await`.
- multer sigue en `memoryStorage` (correcto: el buffer se sube/guarda después). Falta un test de
  integración con un bucket real y definir `R2_ENDPOINT`/bucket público en deploy (entrada 1).

### 5. ✅ Export PDF de reportes (2026-10-16)
- Backend: `pdfkit` (+ `@types/pdfkit`) agregado. Renderer `backend/src/modules/admin/reportsPdf.ts`
  (`renderReportePdf`, A4, tabla Métrica/Valor, limpia emojis de los títulos).
- `admin.service.ts` expone `exportarReportePdf(type)` y `exportarReporte(type, formato)`; el
  controller lee `?format=pdf|csv` (default `csv`). `GET /api/admin/reports/:type/export?format=pdf`
  devuelve `{ filename, pdf: base64 }`.
- Frontend: `exportReportPdf` + `downloadPdf` (`adminReports.service.ts`), hook
  `useExportReportPdf`, y `AdminReportsPage` con dos botones (CSV y PDF).
- Tests: `backend/src/tests/reports-pdf.test.ts` (2 casos: header `%PDF-`, stats vacíos + emojis).
- ✅ Verificado end-to-end contra la base real (2026-11-20): el E2E exporta **cada reporte** como PDF (cabecera
  `%PDF-`, tamaño plausible) y CSV, y comprueba que un docente recibe 403.

### 6. ✅ Branding — presets en backend + logo a storage (2026-10-17)
La pantalla ya existía; se resolvieron los dos detalles que faltaban y se hizo el theming real:
- **Presets:** `COLOR_PRESETS` viven en el backend (`config.schemas.ts`) y se sirven vía
  `GET /api/admin/branding/presets`. Se eliminó `frontend/src/data/mock/adminSettings.mock.ts`
  y `adminSettings.service.ts` consume el endpoint.
- **Logo:** `POST /api/admin/branding/logo` (multer `memoryStorage` → `guardarArchivo`) sube a
  storage (local o R2) y guarda solo la URL; el logo anterior se borra con `eliminarArchivo`.
- **Tema en runtime:** `tailwind.config.js`/`index.css` usan CSS vars y `BrandingContext.tsx`
  (montado en `main.tsx`) las setea desde `GET /api/config/branding` (público). El `Sidebar` ya
  muestra el nombre/logo reales en vez del hardcodeo. `color_claro` ahora se persiste
  (`Institution.color_claro`, migración `20261017120000_institution_color_claro`).
- Tests: `backend/src/tests/config-branding.test.ts`.

## 🟡 DEUDA TÉCNICA Y RIESGOS CONOCIDOS

### 7. Cobertura de tests del frontend — mejoró (humo de todas las páginas agregado 2026-11-20)
`frontend` pasó de 1 archivo/3 tests a **23 archivos/195 tests** (login, branding, chat del tutor,
servicios, materiales, calificaciones, analytics, rúbricas, resumen y corrección de respuestas propias).
`paginas-humo.test.tsx` monta la app real en **cada ruta de cada rol** (30 rutas, red simulada sin datos) y
verifica que carga sin romperse, que un alumno no entra a /admin y que sin sesión se va al login. Sigue
faltando probar el comportamiento fino de varias pantallas. Backend: **38 suites/363 tests**;
ai-services: **161 tests**.

### 8. ✅ `mensajeIA` persiste el modo (2026-10-17)
El `modo` ya viajaba en cada request y `sincronizarModo()` persiste el cambio a mitad de sesión.
Ahora el modo efectivo se guarda también en cada mensaje:
- Migración `20261017130000_mensaje_ia_modo`: `MensajeIA.modo ModoSesionIA?` (nullable; las filas
  históricas quedan sin modo).
- `enviarMensaje` resuelve el modo **antes** de crear el mensaje del alumno y guarda `modo` en la
  pregunta (USER) y en la respuesta (ASSISTANT). El stream hace lo mismo: `prepararStream` devuelve
  `modoSesion` y el controller lo pasa a `registrarMensajeUsuario` / `registrarRespuestaStream`.
- Con esto los analytics por modo y el fallback (si el cliente omite `modo` se usa el de la sesión)
  quedan confiables. Tests en `backend/src/tests/tutor-tools.test.ts` (no-stream + stream).

### 9. ✅ El índice HNSW ahora se crea (2026-10-17)
`EMBEDDING_DIMENSIONS` bajó de 3072 a **1536** (≤ 2000, el tope de HNSW con `vector_cosine_ops`):
- `EmbeddingsService` ahora pasa `output_dimensionality=EMBEDDING_DIMENSIONS` a Gemini, así que el
  vector devuelto coincide con la columna `vector(n)` (antes se ignoraba y el modelo devolvía 3072).
- `RetrievalService` detecta si `ai_materials.embedding` quedó con otra dimensión: recrea la tabla
  y **reindexa el material** con el embedder inyectado desde `build_retrieval_service(embeddings)`
  (si no hay embedder, loguea `reindex_pendiente`). Con ≤2000 el `CREATE INDEX ... hnsw` ya no falla.
- `EMBEDDING_DIMENSIONS=1536` en `.env.example` (raíz y ai-services); número actualizado en
  `docs/archivo/DEPLOY.md`. Tests: `ai-services/src/tests/test_retrieval_service.py`.
- Nota: cambiar de dimensión invalida el índice de Pinecone existente (hay que recrearlo).

### 10. ✅ Cambiar de vector store: procedimiento y limpieza (2026-11-20)
pgvector (`ai_materials`) y Pinecone siguen siendo índices independientes (no se migran vectores: se
**reindexa** desde el contenido original). Ahora hay un procedimiento y herramientas:
1. Cambiar `VECTOR_STORE` y reiniciar el ai-service.
2. `npm run rag:reindex -- --limpiar` borra el material indexado de cada materia y lo reindexa a limpio
   (también borra antes las materias huérfanas).
3. `npm run rag:reindex -- --huerfanos` solo borra del almacén las materias que ya no existen en la base
   (vectores de materias borradas o de pruebas E2E) sin reindexar.
Nuevos endpoints del ai-service: `GET /rag/materias` y `DELETE /rag/materias/{subject_id}` (pgvector y
Pinecone). Cubierto con tests; **falta correrlo contra el stack real** (requiere Docker).

### 11. ✅ `pinecone_service.py` ya no bloquea el event loop (2026-11-20)
Cada operación del cliente síncrono de Pinecone corre en un hilo (`asyncio.to_thread`) y la creación
perezosa del cliente está protegida con un lock. Test: mientras una operación tarda 0,3 s, el loop sigue
atendiendo otras tareas. De paso se corrigió `count_chunks` que fallaba con un índice vacío.

### 12. Gemini intermitente
`gemini-3.6-flash` (y 3.7/3.8/3.5-flash, `flash-latest`) devuelven **503 "high demand"** en cuentas
gratuitas; `gemini-2.5-flash` da 404. Los que responden son `gemini-3.5-flash-lite` y
`gemini-3.1-flash-lite` (default: **`gemini-3.5-flash-lite`**). El 503 es ** intermitente, no
permanente**, así que lo que hace confiable la app es el **retry**, no el cambio de modelo.
Mitigado con backoff exponencial (ver más abajo); el riesgo residual sigue latente.
**Actualización 2026-11-20:** el 503 del *streaming* llegaba al leer el primer fragmento (no al abrir), por
eso el retry no lo cubría y ~1 de cada 10 respuestas del tutor fallaba. Ahora el reintento abarca la
apertura y el primer fragmento de texto (después del primero no se reintenta, para no duplicar texto).

### 13. ✅ `CHROMA_URL` eliminada (2026-10-17)
Era una variable muerta en el schema de `backend/src/config/env.ts` (no se usaba en ninguna línea).
Se decidió **borrarla**: los vector stores reales son pgvector (default) y Pinecone. También se
limpiaron las entradas `chroma/`/`chromadb/` de `.gitignore` y las menciones a ChromaDB en el
`README.md`. (`IMPLEMENTATION.md` y `graphify-out/` son documentos históricos/generados: no se tocan.)

### 14. ✅ E2E que faltaban (2026-11-20)
- El **camino feliz de la corrección con Gemini** ya se verificó (ver entrada P04/A07 abajo).
- Nuevo E2E del **OCR de PDF escaneado** (`e2e/fixtures/escaneado.pdf`, solo imagen): el ai-service real con
  tesseract devuelve el texto. Así se verifica lo que los tests con tesseract simulado no ven.
- Nuevo E2E de la exportación de reportes (PDF y CSV) contra la base real.
- Probado contra el stack real: `GET /rag/materias` y `npm run rag:reindex -- --huerfanos` (borró las 71
  fragmentos huérfanos de una materia inexistente y conservó el resto).

### 19. ✅ E2E de las funciones nuevas (2026-11-24)
La suite punta a punta pasó de 44 a **53** pruebas, todas verdes contra el stack real: recuperación de contraseña (pedido sin enumeración de cuentas, enlace emitido por el administrador, un solo uso, sesiones previas cerradas) y asistente docente persistente (conversaciones, permisos, materiales inválidos y, con `E2E_AI=1 E2E_LLM=1`, una consulta real a Gemini). Al correrla se vio además que el contenedor del frontend entraba en bucle (`npm install` fallaba con ENOTEMPTY sobre el volumen con dependencias viejas, tras subir vite 8 y vitest 5): se recreó el volumen `eduai_frontend_modules` y se reconstruyó la imagen. Detalle y estado en `PLAN_DE_ACCION.md`, tarea 5.1.

### 18. ✅ Cierre de pendientes (2026-11-20 a 2026-11-23)
Resumen de lo resuelto en esta etapa, traído del antiguo documento de pendientes (`COSAS_QUE_FALTAN.md`, ya eliminado: el plan único es `PLAN_DE_ACCION.md`). El detalle de cada ítem con sus archivos y pruebas está en las entradas 10 a 17 y en el plan.

CI y lint · reintento del 503 de Gemini en streaming · Pinecone sin bloquear el event loop · limpieza de
vectores huérfanos y reindexado (`rag:reindex --huerfanos|--limpiar`) · base de demo con material real
(`demo:reset`) · E2E del OCR de PDF escaneado y de la exportación de reportes · prueba de humo de todas las
páginas · recuperación de contraseña por correo · chat persistente del tutor docente con selector de materiales
y aviso al salir · indexación RAG desde Planificación (helper compartido + backfill `rag:reindex -- --planning`) · selector de materiales del Tutor IA rediseñado como modal amplio y clickeable (contenidos de sección/clase y adjuntos de Planificación, búsqueda, chips, estado RAG, apertura de archivo y fuentes visibles) · editor de nota en popup (Mis estudiantes → Calificaciones) · «Editar» de cada clase en Contenidos redirige a Planificación con la materia activa · botón «Eliminar» en cada fila de material (borra archivo y vector RAG) · contención horizontal/alto del shell, sidebar colapsable desde el Header y chat ampliado de Aula virtual sin scroll heredado

Además: `npm audit` en 0 vulnerabilidades (zod 4, react-router 7, vitest 5, vite 8), enlace de recuperación de contraseña emitido por el administrador, envío real de correo verificado por SMTP, revocación del acceso al dar de baja a un usuario y prueba de integración contra R2 escrita (se salta sin credenciales).

### 17. ✅ Recuperación de contraseña por correo (2026-11-20)
- Backend: tabla `tokens_recuperacion` (migración `20261120180000`), `auth/recuperacion.service.ts`, rutas
  `POST /api/auth/password/olvide` y `/restablecer`. Token de 256 bits, **solo se guarda su hash**, vence en
  60 min, un solo uso (consumo atómico: dos pedidos simultáneos con el mismo enlace, gana uno), un enlace
  vigente por cuenta. La respuesta del pedido es igual para cuentas reales, inexistentes o desactivadas.
  Al restablecer se **revocan todas las sesiones** y se manda un aviso de cambio. Límites 3/cuenta y 20/IP
  cada 15 min (pedir) y 10 fallos/IP (usar).
- Frontend: «¿Olvidaste tu contraseña?» en el login, pantallas `/recuperar` y `/restablecer?token=`.
- Verificado en el stack real (login, pedido, enlace, cambio, enlace reusado, clave vieja, sesión previa
  cerrada, límite 429). Tests: 12 backend + 7 frontend.
- **No verificado:** el envío real del correo. Sin `EMAIL_PROVIDER` configurado (estado actual) el enlace sale
  en el log del backend solo en desarrollo. Para producción hace falta configurar un proveedor
  (`resend`/`brevo`/`smtp`) con `EMAIL_FROM` y `APP_URL`, y probar un envío.

### 16. ✅ Base lista para demo (2026-11-20)
- El seed traía una frase de relleno por material y lo marcaba como indexado sin estarlo (el tutor respondía
  «no tengo información»). Ahora `backend/prisma/material-demo.ts` trae **3 textos reales por materia** (POO y
  estructuras de datos, modelo relacional y SQL, OSI/TCP-IP y subnetting) y el seed los deja con
  `rag_indexado = false`.
- Nuevo `npm run demo:reset`: seed + borrado de vectores huérfanos + reindexado limpio. Verificado en el stack
  real: 9 contenidos indexados, 0 fallos, y el tutor respondió «una red /26 tiene 62 hosts utilizables»
  citando el material.
- Los E2E dejan 1 materia dada de baja y 3 usuarios (no se pueden borrar por API); ahora al terminar borran
  los vectores de su materia y `demo:reset` devuelve la base al estado de demo.

### 15. ✅ El CI estaba en rojo y no se veía (2026-11-20)
Al reproducir los 3 jobs de `.github/workflows/ci.yml` desde un **clon limpio** (`npm ci`, entorno virtual
nuevo, sin el `.env` ni el cliente de Prisma que sí existen en la máquina de desarrollo) fallaban dos:
- **backend:** Prisma 7 no genera su cliente al instalar, así que `typecheck` y casi todos los tests daban
  `Cannot find module '.prisma/client/default'`. Se agregó el paso `npx prisma generate` (no necesita
  `DATABASE_URL`). Con él, en limpio: tipos bien y **348 de 348** tests.
- **ai-service:** `ruff check src` fallaba por 5 líneas largas del endpoint `extraer-texto`. Corregidas.
- **frontend:** pasaba (lint, tipos, **154** tests y build).
El CI no corre los E2E (necesitan el stack levantado) ni verifica que las migraciones apliquen: ver el plan
de mejoras. Los tres `package-lock.json` (raíz, backend y frontend) están versionados.

---

## CIERRE DE LA PRIMERA TANDA (histórico)

Los pasos que se habían sugerido al 2026-10-17 están **todos hechos** (branding, email, migración de `modo`,
embeddings a 1536, limpieza de `CHROMA_URL`, tests del frontend). Lo que queda por hacer está en
[`PLAN_DE_ACCION.md`](../PLAN_DE_ACCION.md).

---

# BUGS Y FALTANTES (reporte de usuarios — 2026-11-17)

> Fusionado desde `bugs_y_faltantes.txt`. Estados: ✅ resuelto · 🟡 analizado/parcial · ⬜ pendiente.

## Alumno

### ✅ Material/PDF no abre ni descarga
**Resuelto:** la URL del archivo se convierte en absoluta hacia el backend (`apiUrl()`), nginx proxea
`/uploads/`, y **el nombre del material es un enlace** que abre el archivo (alumno y docente); los
materiales de texto se despliegan al tocar el nombre. Verificado en el navegador (2026-11-18).

### ✅ "Mis estadísticas" completamente mockeada
**Resuelto:** el Inicio y "Mis estadísticas" del alumno usan datos reales (`dashboard.service`,
`progress.service`); ya no quedan archivos de mocks en `frontend/src`. Los dashboards de docente y
admin también consumen el backend.

### ✅ Organización jerárquica de "Mis cursos" → página individual de materia
**Resuelto:** la página de la materia muestra *Unidades y clases*: cada unidad contiene sus clases
(con fecha) y archivos, y cada clase tiene sus propios archivos.

### ✅ El chat con el tutor de IA no persiste
**Resuelto:** el historial se guarda por alumno y se recarga al volver (`useTutorChat`), con lista de
conversaciones. Es privado para el alumno. **Decidido (2026-11-18):** el docente sigue viendo las
últimas consultas del alumno al tutor en su perfil (`ultimas_consultas`), para detectar dudas; el resto del
historial es privado del alumno.

### ✅ El chat con el tutor debe poder ampliarse
**Resuelto:** botón para ampliar el chat a pantalla casi completa.

### ✅ Mensajería de alumno hacia el profesor
**Resuelto:** el alumno tiene "Mensajes" en su menú y puede escribirle a sus docentes.

### ✅ El alumno no ve cómo se arma su nota final
*(Agregado el 2026-11-17, a partir del modelo de calificaciones con categorías y pesos.)* El alumno veía
un promedio sin saber de dónde salía.
**Resuelto:** en **Mis estadísticas**, cada materia muestra *Cómo se arma tu nota* (categorías, lo que vale
cada una y su promedio, o "sin notas"), aclara que una categoría sin notas no resta y avisa de las notas sin
categoría. El detalle de calificaciones tiene una columna **Categoría** (y el período en su propia columna).
La API de progreso devuelve `categorias` y `sin_categoria` por materia y `categoria` por nota.

### ✅ Entregas: columna "Nota"
*(Pedido el 2026-11-17.)* En **Entregas** la nota se mostraba mezclada con el estado.
**Resuelto:** columnas Actividad · Curso · Vencimiento · Estado · Acciones · **Nota**. Solo se muestra la nota
de correcciones **publicadas** (si no, un guion). Además, el backend ya no envía al alumno la nota ni el
feedback de una entrega sin publicar.

## Profesor

### ✅ Gestionar secciones envía a "Mis alumnos"
**Resuelto:** ahora envía a **Contenidos**, donde están las secciones.

### ✅ El docente no puede ver el documento de una entrega
**Resuelto:** se corrigieron la URL y el nombre del archivo de la entrega.

### ✅ Filtros de mensajería
**Resuelto:** se puede enviar a todos, por materia o a una selección de estudiantes. Antes, un envío
no individual se mandaba a todos los usuarios del sistema.

### ✅ Simulación de TPs y exámenes para "Calificaciones"
**Resuelto (2026-11-17): modelo completo de calificaciones.**
- **Categorías con peso por materia** (TP, Parcial, Final…): nueva tabla `categorias_nota`; los pesos deben
  sumar 100. La **nota final es el promedio ponderado**: cada categoría se promedia y se pondera. Si un alumno
  todavía no tiene notas en una categoría, esa no lo penaliza (el peso se reparte entre las demás). Sin
  categorías, sigue siendo el promedio simple de siempre.
- **Varias evaluaciones por período:** una nota ahora tiene `evaluacion` (nombre), `categoria_id` y
  `actividad_id` (antes solo había una nota por alumno y período).
- **Nota ligada a Actividad:** `POST /api/actividades/:id/notas/sincronizar` importa las correcciones
  **publicadas** de una actividad como notas ligadas a ella (una por alumno; repetirlo actualiza, no duplica).
  Nunca importa borradores de la IA.
- **Un solo promedio en todo el sistema:** dashboard del alumno, "Mis estadísticas", perfil del alumno y
  tabla del docente usan el mismo cálculo (`notas.promedio.ts`). Las notas sin categoría no cuentan cuando la
  materia usa categorías y se avisa al docente.
- **Pantalla del docente:** editor de categorías y pesos, importación desde actividades, columnas por categoría
  con la nota final, y lista de notas por alumno (con edición). "Insumos: TPs y simulacros" queda como referencia.
- Migración `20261117120000_categorias_y_notas_por_actividad` (comparada con el SQL que genera Prisma; no se
  aplicó contra una base real porque Docker estaba cerrado).

### ✅ Reorganización de menús y jerarquías
Se propone (e implementó) una redistribución para no tener tantas opciones en el menú:

1. **Contenidos** es la mayor jerarquía y contiene las clases. Además incluye un botón
   **"Planificación"** que ahora sí envía al profesor a esa página.
2. **Mis estudiantes** pasa a ser el manejo general de alumnos y contiene **Calificaciones** y
   **Asistencia**.
3. Nueva opción **Evaluaciones**, que contiene los actuales **Actividades** y **Correcciones**, y
   además un botón a **Calificaciones**.
4. **Analytics** queda igual.
5. **Asistente de IA** queda igual.

Menú lateral resultante: **"Inicio", "Mis materias", "Mis estudiantes", "Evaluaciones",
"Analytics", "Asistente IA", "Mensajes"**. ✅

### ✅ Correcciones de "Contenidos"

1. ✅ **Planificación** para crear clases y asociarlas a una sección/unidad (o viceversa: al crear
   una sección, asignarle una clase, con opción de crearla después).
2. ✅ Se reemplazó el "Subir archivo" redundante por un botón opcional en el formulario de creación
   de sección para subir contenido a la unidad/sección.
3. ✅ "Agregar texto o consigna" ahora llama a las opciones de evaluaciones ya desarrolladas y las
   vincula con la clase o unidad/sección, mostrando en estas la clase a la que pertenecen.

### ✅ Material para estudiantes
"Subí un archivo (PDF, PPTX, DOCX, etc.) que los alumnos podrán ver con esta clase" ahora ofrece dos
opciones: **seleccionar un material ya subido en "Contenidos"** o **subir un archivo**.

## Administrador

### ✅ "Editar" materia no trae descripción ni nivel educativo
**Resuelto:** el servicio mapea `descripcion` y `nivel_educativo` en ambos sentidos y el formulario de
edición los precarga.

## General

### ✅ Eliminar "SIMILAR A MOODLE"

### 🟡 Licencias
Decidir el tema de licencias. **Descartado para la IA** (tarea bajo supervisión de integrantes del
equipo). **Revisado:** hoy no existe un contador de tokens que se pueda descontar; la licencia es por MAU (alumnos activos, calculado contando usuarios), así que un error de IA no puede alterarla. Se corrigió la pantalla de licencias (plan y rango estaban fijos en "Growth", y no manejaba errores de carga). Si en el futuro se factura por tokens, habrá que registrar el consumo solo tras una respuesta exitosa del modelo.
**Caché entre usuarios — resuelto:** al cambiar la persona logueada (entra otra, sale o vence la sesión) se vacía el `QueryClient`, la caché de licencias y la última conversación del tutor guardada en el navegador (`utils/limpiarSesion.ts`); y `adminLicensing.service.ts` ya no guarda el resultado entre pedidos.

### ✅ Problemas de encoding
**Resuelto:** nombres de archivo subidos corregidos (multer los entrega como latin1,
`utils/nombreArchivo.ts`) y CSV con BOM UTF-8. Hay tests de ambos.
Reporte original: en algunas secciones los acentos/tildes, caracteres especiales y/o "Ñ" se muestran con caracteres
extraños. También los CSV generados en la parte de generación de documentos salen con estos
caracteres.

### ✅ Sacar el buscador de la plataforma

### ✅ Ajustes de prompting
**Resuelto:** reglas comunes en `ai-services/src/prompts/estilo.py` (sin saludos, sin negritas ni
asteriscos), aplicadas a los prompts del tutor, resumen, simulacros y material.
Reporte original: modificar la sección de prompting para que la respuesta de la IA no gaste tokens en saludos y
palabrería innecesaria, y que no intente remarcar con negrita ni con `*palabra*`.

## Resumen de estado

**Pendiente real:** nada del reporte de usuarios. Todo está resuelto y verificado (ver abajo).

**Latencia del tutor con la IA real (2026-11-18):** `npm run benchmark:tutor` dio una mediana de **6,84 s** hasta
la primera respuesta (objetivo: 90 % en menos de 3 s) → **no cumple**. El embedding tarda 0,4–0,6 s; el modelo,
llamado directo, tarda entre 0,7 s y 22 s para el mismo pedido (probados `gemini-3.5-flash-lite` y
`gemini-3.1-flash-lite`): la demora es de Gemini con clave gratuita, no de la plataforma. Detalle, hallazgos y
opciones en `DOCUMENTACION_TECNICA.md` §12.

**Verificado en el entorno real (2026-11-18, Docker Compose):**
- La migración `20261117120000_categorias_y_notas_por_actividad` se aplicó sobre la base con datos (90 notas
  intactas) sin errores.
- En el navegador: **Entregas** muestra la columna *Nota* al final (`9,00` en la publicada, guion en las que
  están en revisión); **Mis estadísticas** muestra *Cómo se arma tu nota* y el promedio cuadra con las
  categorías (6,80·30 % + 6,50·40 % + 6,30·30 % = 6,53); **Calificaciones** del docente muestra categorías,
  columnas por categoría y nota final.
- **Importar notas de una actividad** probado de punta a punta: trae la corrección publicada, recalcula la
  nota final (TP 7,90 → final 6,86) y repetirlo informa "0 nuevas, 1 actualizada" (no duplica).
- Suite E2E (`npm run e2e`): **39 de 39** correctas (sin el tramo del tutor, que requiere `E2E_AI=1`).
- Dato de configuración (no es un bug de código): la institución tiene cargado como logo
  `https://example.com/logo.png`, por eso el login muestra la imagen rota; se cambia o se quita desde
  *Apariencia*.

Detalle del reporte de 2026-11-17:

- ✅ Profesor / "Mis materias" → gestionar secciones: envía a Contenidos.
- ✅ Docente ve el documento de una entrega (URL y nombre del archivo).
- ✅ Filtros de mensajería (todos / por materia / selección de estudiantes).
- ✅ Simulación de TPs y exámenes para Calificaciones: categorías con peso, nota final ponderada y notas
  ligadas a actividades (ver el detalle arriba).
- ✅ Menú del docente (Inicio, Mis materias, Mis estudiantes, Evaluaciones, Analytics, Asistente IA,
  Mensajes).
- ✅ Contenidos: "+ Clase" por unidad, crear clase al crear una sección, material opcional de la
  unidad, evaluaciones vinculadas a unidad/clase y, por clase, "Elegir de Contenidos" o
  "Subir archivo".

---

## STACK

- **Frontend:** React 18 + TypeScript + Vite + Tailwind + @tanstack/react-query
- **Backend:** Node + Express + TypeScript + Prisma (PostgreSQL) + JWT (access/refresh)
- **Servicios IA:** `ai-services` (Python/FastAPI) — RAG + Gemini, integrado
- **Infra:** Docker Compose (db pgvector, redis, backend, ai-service, frontend) · GitHub Actions CI

## Estado: conectado al backend real

- Autenticación + refresh token + seed de datos (admin/docente/alumno)
- Dashboard (alumno, docente, admin)
- Docente: cursos, estudiantes, calificaciones
- Docente: mensajes
- Docente: asistencias
- Docente: correcciones
- Docente: plan de materia
- Docente: contenido de las materias (subida de archivos real, ver "Subida y almacenamiento")
- Docente: **actividades** (crear/editar/archivar/borrar — CU-P03) y **rúbricas** (CU-P04)
- Alumno: entregas (CU-A03), enrolamiento a materias (claves), perfil, progreso
- Alumno: contenido de las materias + chat del Tutor IA contextual por materia
- Analytics: conexión con backend

## Admin — conectado al backend real

- **Usuarios:** listado, alta, activar/desactivar, cambio de rol — `/api/admin/users` (GET/POST/PATCH)
- **Materias:** listado, alta, edición, asignación de docente — `/api/admin/materias` (GET/POST/PUT) y `/:id/profesores`
  - Fix: `profesor_id` agregado al DTO de usuario (la asignación usa la tabla `Profesor`, no el id de usuario)
- **Claves de matriculación:** listado con inscriptos, generación y revocación — `GET/POST /api/admin/enrollment-keys` + `PATCH /:id/revocar`
- **Ajustes/Branding:** `GET/PUT /api/admin/branding` — pantalla `AdminSettingsPage` + hook reales.
  - Resuelto: presets de color servidos por el backend y logo en storage (entrada 6)
- **Reportes:** `GET /api/admin/reports` — 6 reportes con datos reales (asistencia, notas, tutor IA, retención, MAU, resumen ejecutivo)
  - Exportación real por reporte: `GET /api/admin/reports/:type/export?format=csv|pdf` (entrada 5)
- **Logo/escudo:** preview y "quitar logo" funcionan; la subida va al storage (local o R2) y se guarda solo la URL (entrada 6)

## Servicio de IA (ai-service) — integrado

Endpoint y use case por cada caso de uso (el `main.py` monta `tutor_router` + `rag_router`):

| Feature | Endpoint | Estado |
|---|---|---|
| Tutor chat (CU-A04) | `POST /tutor/chat` + `POST /tutor/chat/stream` (SSE) | OK |
| Resumen de documento (CU-A05) | `POST /tutor/resumen` | ✅ **Cableado desde 2026-09-27** — `POST /api/materias/:materiaId/tutor/resumen` (solo ALUMNO + inscripción) con panel propio en `ResumenPanel.tsx`: elige un material con texto o pega texto libre |
| Simulacro de examen (CU-A08) | `POST /tutor/examen` | ✅ **Cableado desde 2026-09-27** — `POST /api/materias/:materiaId/tutor/examen` (solo ALUMNO + inscripción, usa RAG de la materia) con panel propio en `SimulacroPanel.tsx`: cantidad + dificultad, respuestas ocultas hasta que las pide |
| Modo estudio socrático (CU-A09) / pistas (CU-A06) | modos del `ask_tutor` (`MODE_PROMPTS`) | ✅ **UI dedicada desde 2026-09-27** — selector de modo en el chat del alumno (`StudentCourseDetailPage.tsx`), el `modo` viaja en el body del POST y del stream |
| Generar material docente (CU-P10) | `POST /tutor/generar-material` | OK — frontend `TeacherAIPage` |
| Corrección de entregas con IA (CU-A07) | `POST /tutor/corregir-entrega` | ✅ **Conectado a producción (2026-09-30)** — `POST /api/entregas/:entregaId/corregir-ia` (PROFESOR) guarda `calificacion_ia`/`feedback_ia` como borrador (`revision_tipo: "IA"`, `publicado: false`). El docente revisa y publica; no se publica sola |
| Depurar prompt (CU-SYS01) | `POST /tutor/depurar` | OK |
| Indexar/borrar material RAG | `POST /rag/material` + `DELETE` + `POST /rag/material/archivo` | OK — texto y archivos (PDF/DOCX/PPTX/TXT) desde 2026-09-25 |
| OCR de imágenes (CU-P02) | `POST /rag/material/archivo` (vía `DocumentService`) | ✅ **Implementado 2026-09-30** — `OcrService` con tesseract: extrae texto de JPG/PNG/GIF/WEBP/BMP/TIFF y de **PDF escaneados** (rasteriza con poppler y transcribe página por página, marcando `[pagina N]`). El backend ya no saltea `IMAGEN` al indexar. Sin tesseract el servicio degrada a texto vacío en vez de romper el arranque |

Backend cableado en `backend/src/config/aiClient.ts` — llama 8 rutas: `chatTutor`, `streamTutor`,
`indexMaterial`, `indexArchivo`, `generarMaterialDocente`, `corregirEntregaIA`, `resumirDocumento`,
`generarExamen`. Todas con degradación elegante si `AI_SERVICE_URL` no está configurado (devuelven
`null` → 501/502 con mensaje claro).

> Los endpoints de `tutor/` del `tutor_router` de Python están proxeyaados desde Node. `resumen` y
> `examen` se agregaron el 2026-09-27 con sus tests en `backend/src/tests/tutor-tools.test.ts`
> (15 casos: pertenencia del contenido a la materia, binarios sin texto, no inscripto, rol docente,
> 502 de la IA, validación del body).

---

# Detalle de lo hecho (contexto técnico)

## Subida y almacenamiento de archivos (✅ 2026-09-25)

- **Endpoint multipart real:** `POST /api/secciones/:seccionId/contenidos/archivo` con `multer`
  (memoryStorage, `MAX_FILE_SIZE_MB`=50) y `requireRole("PROFESOR")` — `contenidos.routes.ts`.
- **Destino:** disco local en `UPLOAD_DIR` (default `data/uploads`, gitignoreado; en compose
  `/data/uploads` con volumen `uploads`) — `config/storage.ts` (sanitiza nombre, `archivo_url` =
  `/uploads/<nombre>`). `UPLOAD_DIR` se resuelve en `storage.ts:5` desde `env.UPLOAD_DIR`.
- **Descarga/visualización:** `app.use("/uploads", express.static(...))`.
- **Tipos soportados:** PDF, DOCX/PPTX, TXT/MD, imágenes (JPG/PNG/GIF/WEBP/SVG) y video
  (MP4/MOV/WEBM), inferidos por extensión. Formato no soportado → 400.
- **Errores de multer** (archivo muy grande) resueltos como 413/400 vía `errorHandler`.
- **Seed:** usa contenidos TEXTO reales indexables (ya no URLs falsas `/materiales/<n>/guia.pdf`).
- **R2/S3:** integrado desde 2026-10-16 (ver entrada 4): `config/storage.ts` conmuta a
  `S3Storage` cuando hay credenciales R2, si no sigue en disco local.

## RAG para archivos (✅ 2026-09-25)

- **Endpoint en ai-service:** `POST /rag/material/archivo` (multipart: `subject_id`, `material_id`,
  `archivo`) que extrae texto con `DocumentService` y lo indexa con `IndexMaterialUseCase` —
  `rag_router.py`.
- **Backend:** `aiClient.indexArchivo` manda el binario como FormData;
  `contenidos.service.crearArchivo` crea el contenido e intenta indexar (degradación elegante).
  Imágenes/video se guardan pero no se indexan (salvo IMAGEN con OCR, ver P02).
- **UI docente:** `TeacherContentPage` sube archivos reales (FormData), muestra estado
  "⏳ RAG/🤖 RAG/— RAG" y permite descargar.
- **Tests:** `test_router.py` cubre el endpoint de archivo (indexación + archivo vacío).

## Entregas del alumno (CU-A03, 2026-09-30)

El backend de entregas estaba completo desde antes pero **el frontend no lo invocaba**:
`useAssignments` era un `useQuery` de 6 líneas y el botón "Enviar" no tenía `onClick`. El alumno
no podía entregar nada.

Qué se agregó:
- `POST /api/actividades/:actividadId/entrega/archivo` (ALUMNO), valida inscripción y la extensión
  contra `actividad.formatos_permitidos`, y persiste con `guardarArchivo()`.
- `mi_entrega` devuelve `respuesta_texto`, `respuesta_codigo`, `archivo_url` y `archivo_nombre`.
- `AssignmentSubmitModal` con las 4 variantes: MC (radio), desarrollo (textarea), código (textarea
  mono) y archivo (input con `accept` derivado de los formatos permitidos).
- El botón quedó cableado; muestra la nota cuando el docente publica la corrección.
- `InfoBox` ganó las variantes `success` y `error` (antes solo `info|warning`).
- 7 tests en `backend/src/tests/entrega-archivo.test.ts` (último: actividad archivada → 409).

Verificado E2E: los 4 tipos entregan, el reenvío reemplaza sin duplicar, un `.png` es rechazado con
400 en una actividad que solo acepta `pdf,txt`, el archivo es servible en `/uploads`, y un alumno sin
inscripción recibe 403 al subir y al entregar.

**Nota de alcance:** la entrega no dispara la corrección IA (CU-A07 sigue siendo paso manual del
docente desde `TeacherCorrectionsPage`).

## Gestión de actividades del docente (CU-P03, 2026-09-30)

El backend tenía `crear`/`actualizar` pero **no había forma de borrar una actividad ni de sacarla
de la lista del alumno sin borrarla**, y no había ninguna pantalla de actividades.

Regla de producto: **no se borra una actividad que ya tiene entregas, se archiva.**

Qué se agregó:
- `Actividad.activo Boolean @default(true)` + migración `20260930120000_actividad_activo`. El alumno
  solo lista activas; el docente lista activas y archivadas, con `_count.entregas`.
- `DELETE /api/actividades/:actividadId`: borra solo con cero entregas; si hay entregas devuelve
  409 con el mensaje `No se puede eliminar: la actividad tiene N entrega(s). Archivala en su lugar.`
- Archivar/restaurar es `PUT` con `{ activo: false|true }`; una actividad archivada tampoco acepta
  nuevas entregas ni subidas (409).
- Frontend nuevo: `activities.service.ts`, `useActivities.ts`, `ActivityFormModal` (4 tipos, fecha
  límite, corrección manual, rúbrica opcional) y `TeacherActivitiesPage`, con ruta
  `/teacher/activities` y entrada en la nav del profesor.
- `apiErrorMessage()` en `services/api.ts`: el backend responde `{ error }` y el parseo estaba
  triplicado en tres componentes con una copia mal formada.
- 13 tests en `backend/src/tests/actividades-ciclo.test.ts` (archivar, restaurar, borrar con y sin
  entregas, orden de validación de permisos, guards de rol, desvincular rúbrica).

Verificado E2E (33 checks): el docente crea los 4 tipos, el alumno los ve, entrega, el docente
archiva y el alumno deja de verlos y recibe 409 al entregar, restaura y el alumno los vuelve a ver,
el docente de otra materia recibe 403, y borrar funciona solo cuando no hay entregas.

> El "Pendiente" que anotaba la versión anterior de este doc (selector de rúbrica vacío hasta que
> existiera la UI de CU-P04, y `esperado` fuera de `Rubrica.criterios`) **quedó resuelto** por
> CU-P04, documentado abajo.

## Rúbricas y corrección IA (CU-P04 + CU-A07, 2026-09-30)

La pantalla de correcciones tenía un card "Gestionar rúbricas" con "Editar" y "+ Nueva rúbrica"
**sin handler**. Peor: `Rubrica.criterios` solo guardaba `{nombre, peso}`, así que la rúbrica le
decía a la IA cuánto pesaba cada criterio pero **nada sobre qué tenía que encontrar**. El modelo
corrigía a ciegas.

Qué se agregó:
- **`esperado` en el criterio de rúbrica.** El docente escribe qué tiene que aparecer en la entrega
  y eso viaja al prompt (`ai-services/src/prompts/correccion.py` ganó una regla explícita).
- Validación: `esperado` es obligatorio y **los pesos deben sumar 100** (`criteriosSchema`). Con
  `.trim()`: sin él, `esperado: "   "` pasaba el `min(1)`.
- `PUT /api/rubricas/:rubricaId` y `DELETE /api/rubricas/:rubricaId`. Borrar una rúbrica en uso por
  actividades devuelve 409 y pide desvincularla primero.
- **Desvincular una rúbrica ahora es posible**: `rubrica_id` acepta `null` en la actualización de
  actividad. Antes no había forma, así que la rúbrica quedaba bloqueada para siempre.
- **CU-A07 conectado de verdad:** `POST /api/entregas/:entregaId/corregir-ia` (PROFESOR) llama al
  ai-service con la rúbrica de la actividad y guarda `calificacion_ia`/`feedback_ia` como
  **borrador** (`revision_tipo: "IA"`, `publicado: false`). Si el ai-service no contesta, degrada a
  502. Una entrega ya publicada no se puede volver a corregir (409).
- Frontend: `RubricFormModal` (criterios dinámicos, "Repartir 100", indicador de suma, aviso si
  falta un `esperado`), los botones de la tarjeta ahora funcionan, y "Volver a corregir con IA" en
  el panel de revisión.
- `useRubrics` pasó a ser la única fuente de rúbricas: la pantalla de actividades usaba una
  `queryKey` distinta, así que al borrar una rúbrica el selector ofrecía una que ya no existía.
- 18 tests en `backend/src/tests/rubricas.test.ts` + 2 de desvinculación en
  `actividades-ciclo.test.ts` + 2 en el lado IA que verifican que `esperado` llegue al prompt.

Verificado E2E: se crea, edita, vincula a una actividad, no se puede borrar en uso (409), se
desvincula con `rubrica_id: null` y ahí sí se borra; el alumno y el docente ajeno reciben 403.

**Camino feliz con Gemini (corregido en este snapshot):** la versión anterior decía que
`GEMINI_API_KEY` estaba vacía y que el éxito no se había probado. **Ya se verificó:** con la clave
cargada, `POST /api/entregas/:id/corregir-ia` devolvió 200 en ~9 s, calificación 5, `feedback_ia`
que referencia explícitamente el `esperado`, `revision_tipo=IA` y `publicado=false`.

**Niveles de desempeño (2026-11-18).** La rúbrica puede definir de 2 a 6 niveles (Excelente, Bueno…) con un % del
peso de cada criterio, y descriptores opcionales por criterio y nivel. Con niveles, la IA elige un nivel por
criterio y **la nota la calcula el código** (suma de peso × % del nivel), no el modelo; el feedback termina con un
resumen "Niveles alcanzados". Si el modelo omite un criterio o inventa un nivel se usa la nota que haya dado, y si no
dio ninguna se devuelve un error (no se inventa una calificación). Migración `20261119120000_rubrica_niveles`
(columna `rubricas.niveles`, nula = sin niveles; las rúbricas existentes no cambian). Verificado con la IA real: una
respuesta completa dio 10 y una pobre 4,0 (60 % × Regular 50 % + 40 % × Insuficiente 25 %), y el formulario se
probó en el navegador (crear, reabrir con sus niveles y borrar).

**Archivos reportados y corrección de respuestas propias (2026-11-18).**
- **CU-A02 (5A):** el servidor detecta cuándo un archivo ya no está guardado (`archivo_disponible`) y el alumno ve un aviso
  que lo invita a reportarlo; también puede reportar uno que no abre. El docente recibe una notificación y ve *Archivos
  reportados* en Contenidos; al resolver, los alumnos que reportaron reciben un aviso. Migración
  `20261120120000_reportes_contenido`. Probado en el navegador de punta a punta (archivo borrado del disco → aviso →
  reporte → tarjeta del docente → resuelto).
- **CU-A11 (A2, A4):** el alumno puede corregir preguntas propias con sus respuestas. Sin respuesta modelo, el tutor corrige
  contra el material indexado (antes el corrector no usaba el material). Antes de corregir se consulta cuántos fragmentos
  hay indexados (mínimo 3): con poco material se avisa que la corrección puede ser limitada y el alumno elige continuar o
  cancelar. Probado con la IA real: sin material la corrección sale marcada como limitada; con material cita la cátedra.

## OCR de imágenes y PDF escaneado (CU-P02, 2026-09-30)

`ai-services/src/services/ocr_service.py`:
- Dependencias de sistema en el `Dockerfile`: `tesseract-ocr`, `tesseract-ocr-spa`,
  `tesseract-ocr-eng`, `poppler-utils`. Python: `pytesseract`, `pdf2image`, `Pillow`.
- **PDF escaneado:** si `pypdf` saca menos de 24 caracteres, se considera escaneado, se rasterizan
  hasta 10 páginas y se transcriben.
- **SVG queda fuera a propósito:** es XML vectorial, PIL no lo renderiza. Antes caía al `decode`
  final y **el XML crudo terminaba indexado**; ahora devuelve vacío. Igual para video.
- **Filtro de binarios:** el fallback `decode("utf-8")` rechaza texto con >5% de caracteres de
  reemplazo o control, así que un `.bin`/`.zip` desconocido no se indexa.
- Idioma `spa+eng`. Testado en Docker con tesseract 5.5.0: imagen 206 caracteres, PDF escaneado 217.
- **E2E verificado:** un docente sube un PNG → `tipo=IMAGEN`, `rag_indexado=True` en 1,3 s. Con una
  marca única (`39CECD`) en esa imagen, el alumno la recupera por RAG con score 0.808. Cadena
  completa: imagen → OCR → chunks → embeddings → pgvector → RAG.
- 21 casos en `test_ocr_service.py` (motor ausente, formatos, limpieza, binarios). **Mockean
  tesseract**, así que pasan aunque falte el binario; la prueba real es el E2E (de imagen, hecho).

## Gemini en producción (2026-09-28) — modelo y reintentos

- Modelo default **`gemini-3.5-flash-lite`** (ver riesgo 12 en QUÉ FALTA para el detalle de 503).
- **Reintentos con backoff exponencial** en `llm_service.py`: hasta 4 reintentos (2s, 4s, 8s, 16s,
  tope 30s) con jitter, solo ante errores transitorios (503, 429, `UNAVAILABLE`,
  `RESOURCE_EXHAUSTED`, timeouts). Los permanentes (400 de prompt, 401 de key, 404 de modelo) **no**
  se reintentan. Configurable con `LLM_MAX_RETRIES`, `LLM_RETRY_BASE_DELAY_SECONDS`,
  `LLM_RETRY_MAX_DELAY_SECONDS`. El streaming reintenta **solo al abrir** el stream, nunca a mitad
  (duplicaría tokens). Cubierto por `test_llm_retry.py` (10 casos).
- **Prompts corregidos** según lo que devolvió el modelo real: el resumen arrancaba con "¡Hola! Soy
  tu tutor IA..." (ahora arranca directo en "Resumen general"), y en el examen una respuesta de
  desarrollo era filtrar una instrucción del prompt en vez de dar la respuesta (ahora se pide
  explícitamente la respuesta en sí).
- **Registro de sesiones IA** (parcial): el `modo` viaja en cada request y el backend lo prioriza
  sobre el de la sesión; `sincronizarModo()` persiste el cambio (sin escribir si no cambió), 4
  tests. (El modo de cada respuesta se guarda desde 2026-10-17: ver entrada 8.)

## Docker verificado (2026-09-28)

`docker compose build` + `up -d` levantan los 5 servicios y responden: `backend /api/healthz` →
`{"status":"ok","db":"ok"}`, `ai-service /healthz` → `{"status":"ok"}`, `frontend :5173` → 200.
Seed: 10 alumnos, 1 admin, 6 profesores, clave `Clave1234`.

Tres bugs reales, ya corregidos:
1. **`docker compose build` fallaba con `ERESOLVE`.** `backend/package.json` pedía
   `typescript: ^7.0.2`, pero `typescript-eslint@8` exige `>=4.8.4 <6.1.0`. Localmente no se notaba
   porque el root del workspace hoistea el TS 5.9.3 del frontend. **El CI no lo detectaba** porque
   usa `npm ci` (respeta el lock). Bajado a `^5.9.3`.
2. **`backend/package-lock.json`** era un lock standalone obsoleto (pinned a TS 7) y **no está
   versionado**: vestigio de antes de los workspaces. Era lo que disparaba el ERESOLVE.
3. **El ai-service moría al arrancar:** `RuntimeError: Form data requires "python-multipart"`. El
   culpable era el volumen `aipy_venv`, que monta `/app/.venv` encima del venv horneado. Se resuelve
   con `docker volume rm eduai_aipy_venv` (o `docker compose down -v`). **Ojo: cada vez que cambie
   `requirements.txt` hay que rehacer ese volumen.**

---

# CÓMO CORRER

## Docker (recomendado)

```bash
# 1. Completar .env (raíz): GEMINI_API_KEY obligatoria para el ai-service
#    (usar un modelo *-flash-lite: los flash "grandes" dan 503 en cuentas gratuitas)
# 2. Levantar todo
docker compose up --build -d
# 3. Migraciones + seed (el CMD dev no los corre solo)
docker compose exec backend npx prisma db seed
# 4. Verificar estado
docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
# 5. Para limpiar (OJO: destruye volúmenes y la base local)
docker compose down -v --rmi all --remove-orphans
docker builder prune -a -f
#6. Para recrear servicio
docker compose up -d --force-recreate backend ai-service frontend #todos juntos o uno solo o como quieras crack
```

Credenciales de prueba (`seed.ts`): `admin@ies.edu` (ADMIN) · `profe1@ies.edu` (PROFESOR) ·
`alumno1@ies.edu` (ALUMNO) — password `Clave1234`.

Servicios: frontend `http://localhost:5173` · backend `http://localhost:3000` · ai-service
`http://localhost:8000` (`/docs`) · Postgres `localhost:5433` · Redis `localhost:6379`.

## Local (sin contenedores de app)

```bash
npm install                # workspaces raíz
npm run ai:setup           # venv + pip install en ai-services
docker compose up -d db redis
npm run db:migrate && npm run db:seed   # (con backend/.env propio)
npm run dev:local          # backend + ai + frontend con concurrently
```

## Verificación

- `npm run typecheck` (backend y frontend) · `npm run lint` · `npm test` (corre las tres suites)

**Conteo actual de tests (2026-11-20):** backend **363** en **38** suites · frontend **195** en
**23** archivos · ai-services **161** (+1 omitido) · E2E **53**.
