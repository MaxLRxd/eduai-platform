# EduAI Platform — Avance del Proyecto

> Snapshot: **2026-09-30** · Reemplaza a `AVANCE.txt` (última actualización 2026-09-06).
>
> **Este documento es un traspaso.** Lo que importa para seguir trabajando está en
> [QUÉ FALTA](#qué-falta). Abajo queda el detalle técnico de lo ya hecho y por qué.
>
> **Mapa de arquitectura para el equipo:** `graphify-out/README.md` (arquitectura real, god nodes,
> puntos de extensión e inventario de pendientes verificado contra el código).

---

# QUÉ FALTA

Todo lo que está ticked (✅) en este documento **ya está implementado y verificado**. Esta sección
es la lista real de trabajo abierto, ordenada por prioridad. Nada de acá está empezado salvo lo
indicado.

## 🔴 BLOQUEA LA ENTREGA

### 1. Deploy a cloud — decisión pendiente de reunión
Es **lo único que bloquea la entrega**. No es un bug, es una decisión de equipo.
Todo está analizado y escrito en **`DEPLOY.md`**:
- Comparativa de proveedores (Fly.io / Railway / Render+Vercel / VM propia).
- La trampa de los **3 cold starts** (3 servicios arrancando en cadena; el molesto es el del
  `ai-service`, que ya tarda 26 s con el modelo caliente).
- Requisito de que **la DB y el `ai-service` estén en la misma región**.
- 7 preguntas abiertas + checklist de lo que falta antes de deployar.
- **Postgres + `pgvector` sigue sin definir.** Sin esto no hay dónde correr la app en prod.

## 🟠 FUNCIONALIDAD QUE FALTA

### 2. Notificaciones — el frontend no existe (el backend sí)
El backend está **completo**: 4 endpoints montados en `backend/src/app.ts:27`, todos con
`requireAuth`, con validación de ownership y de formato UUID.

| Método | Ruta | Qué hace |
|---|---|---|
| GET | `/api/notificaciones` (soporta `?noLeidas=true`) | lista las del usuario |
| GET | `/api/notificaciones/no-leidas` | contador para el badge |
| PATCH | `/api/notificaciones/leer-todas` | marcar todas leídas |
| PATCH | `/api/notificaciones/:notificacionId/leida` | marcar una |

Se generan notificaciones reales desde `actividades.service.ts:332,449` y
`messages.service.ts:119` (vía `crearNoLeidas`).

**Lo que falta es el consumidor, y es el único trabajo de esta entrada:**
- `frontend/src/components/layout/Header.tsx:26-32` tiene un `<button aria-label="Notificaciones">`
  con `Icon name="bell"` y **un punto rojo hardcodeado en la línea 31**. Sin `onClick`, sin estado,
  sin fetch. Hay que reemplazar ese punto por el contador real.
- No existe `frontend/src/services/notificaciones.service.ts` ni `hooks/useNotificaciones.ts`.
- No hay ruta de notificaciones en `frontend/src/App.tsx`. Falta el panel o página de lista con
  "marcar como leída".
- `frontend/src/router/navConfig.ts:18` tiene un comentario que lo admite: *"quedan para uso
  dinámico cuando haya una fuente de notificaciones"*.
- Ojo: las tarjetas de preferencias de notificación en `StudentProfilePage.tsx:83` y
  `TeacherProfilePage.tsx:86` son **estáticas, sin conexión al backend**. No cuentan como esto.

### 3. Email — no existe nada
`EMAIL_API_KEY` y `EMAIL_FROM` están declarados en `.env` y `.env.example` y **no tienen ningún
consumidor**: cero resultados de `EMAIL` en `backend/src` y en `ai-services/src`. No hay
`nodemailer`, `sendgrid`, `resend` ni `smtplib` en ningún `package.json` / `requirements.txt`.
El módulo de notificaciones es **solo in-app**. Falta elegir proveedor y agregar el canal.

### 4. R2 / object storage — no existe cliente S3
Cero clientes S3-compatible: no hay `aws-sdk`, `@aws-sdk/client-s3`, `minio` ni `boto3` en ningún
`package.json` / `requirements.txt`. Estado actual:
- `backend/src/config/env.ts:9` declara `R2_ACCESS_KEY_ID` (zod, opcional) y **nadie lo lee**.
  `R2_SECRET_ACCESS_KEY`, `R2_ENDPOINT` y `R2_BUCKET_NAME` no están ni en el schema.
- Declaraciones huérfanas en `.env.example:26-30`, `.env:23-26` y `backend/.env.example:7`.
- Los uploads usan `multer.memoryStorage()` (`contenidos.routes.ts:11-12` y
  `actividades.routes.ts:18-19`) y después se escriben a disco con `guardarArchivo()` de
  `config/storage.ts`.

**Falta:** cliente S3 + enrutar el multer a ese storage. La interfaz `storage.ts` ya está
separada para que el cambio sea un swap. Es parte del paso de deploy cloud (ver entrada 1).

### 5. Export PDF de reportes
**No existe generación de PDF en el proyecto.** No hay `pdfkit`, `jspdf`, `puppeteer`,
`playwright` ni `weasyprint` instalado. Lo único con "pdf" es **lectura** (OCR en
`ai-services/src/services/ocr_service.py`) y el enum de tipos de contenido.
El export real es **solo CSV**: `GET /api/admin/reports/:type/export` →
`admin.service.ts:537-547` (`exportarReporteCsv`), consumido por
`frontend/src/services/adminReports.service.ts:31-41`.

### 6. Branding — 2 detalles chicos (la pantalla YA existe)
Ojo, esto **ya está implementado**: pantalla `frontend/src/pages/admin/AdminSettingsPage.tsx`
(nombre de institución, colores, logo, botón "Aplicar apariencia"), ruta `/admin/settings` en
`App.tsx:315`, service `adminSettings.service.ts` con `getBranding()`/`saveBranding()`, hook
`useAdminSettings` con invalidación de query, y endpoint `GET/PUT /api/admin/branding`
(`config.routes.ts:9,10`, montado en `app.ts:36`).

Lo que falta son solo these dos detalles:
- **Presets de color hardcodeados en el front:** `adminSettings.service.ts:3,29-31` importa
  `MOCK_COLOR_PRESETS` de `frontend/src/data/mock/adminSettings.mock.ts:3` y lo devuelve con
  `Promise.resolve(...)`. No hay endpoint de presets en backend (cero resultados de `presets`).
- **El logo se manda como data URL base64** (`AdminSettingsPage.tsx:28-35` usa
  `FileReader.readAsDataURL` y lo manda directo en el PUT), no se sube a storage. Ver entrada 4.

## 🟡 DEUDA TÉCNICA Y RIESGOS CONOCIDOS

### 7. Cobertura de tests del frontend — casi nula
`frontend` tiene **1 solo archivo de tests**: `src/tests/login.test.tsx` con **3 tests**. No hay
ningún test de páginas, hooks ni servicios. Es la deuda de cobertura más grande del proyecto,
por encima de la del backend (que pasó de 2 archivos/18 tests a 5 archivos/56 tests).

### 8. `mensajeIA` no persiste el modo con el que respondió
El `modo` ya viaja en cada request y el backend lo prioriza sobre el de la sesión, y
`sincronizarModo()` persiste el cambio de modo a mitad de sesión (hecho 2026-09-28, con 4 tests).
Lo que queda desalineado es el registro: **`sesionIA.modo` y `mensajeIA` siguen sin guardar el
modo con el que se respondió cada mensaje**, así que los analytics por modo y el fallback cuando
un cliente omite `modo` no son del todo confiables. **Requiere una migración de Prisma.**

### 9. El índice HNSW nunca se crea
`EMBEDDING_DIMENSIONS=3072` pero pgvector no indexa más de 2000 dimensiones con HNSW. La
**búsqueda funciona igual** (escaneo secuencial) y el examen recupera material correctamente,
pero **degrada con volumen**. El warning ahora dice la causa y el arreglo. Arreglo de fondo: bajar
`EMBEDDING_DIMENSIONS` a ≤2000 y **reindexar el material**, o migrar a un índice IVF. No se hizo.

### 10. Cambiar de vector store no migra datos
pgvector (`ai_materials`) y Pinecone son índices independientes: al switchear hay que **reindexar
todo el material** a mano.

### 11. `pinecone_service.py` bloquea el event loop
Usa el cliente **síncrono** de Pinecone dentro de métodos `async`. Aceptable para probar; revisar
si se apuesta a Pinecone en prod.

### 12. Gemini intermitente
`gemini-3.6-flash` (y 3.7/3.8/3.5-flash, `flash-latest`) devuelven **503 "high demand"** en cuentas
gratuitas; `gemini-2.5-flash` da 404. Los que responden son `gemini-3.5-flash-lite` y
`gemini-3.1-flash-lite` (default: **`gemini-3.5-flash-lite`**). El 503 es ** intermitente, no
permanente**, así que lo que hace confiable la app es el **retry**, no el cambio de modelo.
Mitigado con backoff exponencial (ver más abajo); el riesgo residual sigue latente.

### 13. `CHROMA_URL` es una variable muerta
Está en el schema de `backend/src/config/env.ts:6` y en dos documentos, y **no se usa en ninguna
línea de código**. No está en `.env` ni en `.env.example` (el doc anterior decía que sí, mal).
Solo hay pgvector (default) y Pinecone. **Decidir y borrar la variable.**

### 14. Faltan algunos E2E
- El **camino feliz de la corrección con Gemini** ya se verificó (ver entrada P04/A07 abajo).
- Lo que **no** se ejecutó nunca es el **E2E del OCR de PDF escaneado** (sí está verificado el de
  imagen, y los tests del servicio mockean tesseract, así que pasan aunque falte el binario).

---

## PRÓXIMOS PASOS SUGERIDOS (resumen accionable)

1. 🔴 Reunión de **deploy cloud** → llenar `DEPLOY.md` y definir Postgres+pgvector.
2. 🟠 **Badge + panel de notificaciones** en el front (entrada 2) — es el trabajo más concreto y
   con el backend ya listo.
3. 🟠 Elegir proveedor de **email** y agregar el canal (entrada 3).
4. 🟠 **Cliente S3 + multer a storage** cuando se defina el deploy (entrada 4).
5. 🟡 Tests del **frontend** (entrada 7) y migración de `modo` en `mensajeIA` (entrada 8).
6. 🟡 Rebajar `EMBEDDING_DIMENSIONS` a ≤2000 y reindexar (entrada 9), o migrar a IVF.
7. 🟡 Limpiar `CHROMA_URL` (entrada 13) y decidir los presets de branding (entrada 6).

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
  - Pendiente: presets de color estáticos de la UI (`MOCK_COLOR_PRESETS`) y logo como data URL (ver entrada 6)
- **Reportes:** `GET /api/admin/reports` — 6 reportes con datos reales (asistencia, notas, tutor IA, retención, MAU, resumen ejecutivo)
  - Exportación CSV real por reporte: `GET /api/admin/reports/:type/export` (PDF falta, entrada 5)
- **Logo/escudo:** preview y "quitar logo" funcionan; la subida va como data URL (migración `logo_url` → TEXT)

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
- **R2:** sigue sin consumidor (ver entrada 4 de QUÉ FALTA).

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
  tests. Pendiente menor: `mensajeIA` sigue sin guardar el modo de cada respuesta (ver entrada 8).

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

**Conteo actual de tests:** backend **56** en **5** archivos (`health` 3, `tutor-tools` 15,
`entrega-archivo` 7, `actividades-ciclo` 13, `rubricas` 18) · ai-services **68 pasan, 1 skip** ·
frontend **3** (solo login). Lint del backend: 0 errores.
