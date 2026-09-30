# EduAI Platform — Avance del Proyecto

> Snapshot: 2026-09-27 · Reemplaza a `AVANCE.txt` (última actualización 2026-09-06).
>
> **Mapa de arquitectura para el equipo:** `graphify-out/README.md` (arquitectura real, god nodes, puntos de extensión e inventario de pendientes **verificado contra el código**).

## Stack

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
- Docente: contenido de las materias (solo texto, ver pendientes)
- Alumno: entregas, enrolamiento a materias (claves), perfil, progreso
- Alumno: contenido de las materias + chat del Tutor IA contextual por materia
- Analytics: conexión con backend

## Admin — conectado al backend real

- **Usuarios:** listado, alta, activar/desactivar, cambio de rol — `/api/admin/users` (GET/POST/PATCH)
- **Materias:** listado, alta, edición, asignación de docente — `/api/admin/materias` (GET/POST/PUT) y `/:id/profesores`
  - Fix: `profesor_id` agregado al DTO de usuario (la asignación usa la tabla `Profesor`, no el id de usuario)
- **Claves de matriculación:** listado con inscriptos, generación y revocación — `GET/POST /api/admin/enrollment-keys` + `PATCH /:id/revocar`
- **Ajustes/Branding:** `GET/PUT /api/admin/branding` — nombre y colores de la institución
  - Los presets de color siguen siendo estáticos de la UI (`MOCK_COLOR_PRESETS`), no viven en backend
- **Reportes:** `GET /api/admin/reports` — 6 reportes con datos reales (asistencia, notas, tutor IA, retención, MAU, resumen ejecutivo)
  - Exportación CSV real por reporte: `GET /api/admin/reports/:type/export`
- **Logo/escudo:** subida por data URL (migración `logo_url` → TEXT), preview y "quitar logo"

## Servicio de IA (ai-service) — integrado

Endpoint y use case por cada caso de uso (el `main.py` monta `tutor_router` + `rag_router`):

| Feature | Endpoint | Estado |
|---|---|---|
| Tutor chat (CU-A04) | `POST /tutor/chat` + `POST /tutor/chat/stream` (SSE) | OK |
| Resumen de documento (CU-A05) | `POST /tutor/resumen` | ✅ **Cableado desde 2026-09-27** — `POST /api/materias/:materiaId/tutor/resumen` (solo ALUMNO + inscripción) con panel propio en `ResumenPanel.tsx`: elige un material con texto o pega texto libre |
| Simulacro de examen (CU-A08) | `POST /tutor/examen` | ✅ **Cableado desde 2026-09-27** — `POST /api/materias/:materiaId/tutor/examen` (solo ALUMNO + inscripción, usa RAG de la materia) con panel propio en `SimulacroPanel.tsx`: cantidad + dificultad, respuestas ocultas hasta que las pide |
| Modo estudio socrático (CU-A09) / pistas (CU-A06) | modos del `ask_tutor` (`MODE_PROMPTS`) | ✅ **UI dedicada desde 2026-09-27** — selector de modo en el chat del alumno (`StudentCourseDetailPage.tsx`), el `modo` viaja en el body del POST y del stream |
| Generar material docente (CU-P10) | `POST /tutor/generar-material` | OK — frontend `TeacherAIPage` |
| Corrección de entregas (CU-P05) | `POST /tutor/corregir-entrega` | OK — frontend `TeacherCorrectionsPage` |
| Depurar prompt (CU-SYS01) | `POST /tutor/depurar` | OK |
| Indexar/borrar material RAG | `POST /rag/material` + `DELETE` + `POST /rag/material/archivo` | OK — texto y archivos (PDF/DOCX/PPTX/TXT) desde 2026-09-25 |
| OCR de imágenes (CU-P02) | `POST /rag/material/archivo` (vía `DocumentService`) | ✅ **Implementado 2026-09-30** — `OcrService` con tesseract: extrae texto de JPG/PNG/GIF/WEBP/BMP/TIFF y de **PDF escaneados** (rasteriza con poppler y transcribe página por página, marcando `[pagina N]`). El backend ya no saltea `IMAGEN` al indexar, así que una foto de apunte entra al RAG. Sin tesseract el servicio degrada a texto vacío en vez de romper el arranque |

Backend cableado en `backend/src/config/aiClient.ts` — llama 8 rutas: `chatTutor`, `streamTutor`, `indexMaterial`, `indexArchivo`, `generarMaterialDocente`, `corregirEntregaIA`, `resumirDocumento`, `generarExamen`. Todas con degradación elegante si `AI_SERVICE_URL` no está configurado (devuelven `null` → 501/502 con mensaje claro).

> Los 4 endpoints de `tutor/` del `tutor_router` de Python están proxeyaados desde Node. `resumen` y `examen` se agregaron el 2026-09-27 con sus tests en `backend/src/tests/tutor-tools.test.ts` (11 casos: pertenencia del contenido a la materia, binarios sin texto, no inscripto, rol docente, 502 de la IA, validación del body).

## FALTA / PENDIENTE

### 1. Subida y almacenamiento de archivos (✅ hecho 2026-09-25)

- **Endpoint multipart real en backend:** `POST /api/secciones/:seccionId/contenidos/archivo` con `multer` (memoryStorage, límite `MAX_FILE_SIZE_MB`=50 por defecto) y `requireRole("PROFESOR")` — `contenidos.routes.ts`.
- **Destino:** disco local en `UPLOAD_DIR` (default `data/uploads`, gitignoreado; en compose `/data/uploads` con volumen `uploads`) — `config/storage.ts` (sanitiza nombre, `archivo_url` = `/uploads/<nombre>`).
- **Descarga/visualización:** `app.use("/uploads", express.static(...))` → los `archivo_url` ahora sirven contenido real. El frontend muestra el material como link descargable.
- **Tipos soportados:** PDF, DOCX/PPTX, TXT/MD, imágenes (JPG/PNG/GIF/WEBP/SVG) y video (MP4/MOV/WEBM); inferidos por extensión (`inferirTipo`). Formato no soportado → 400.
- **Errores de multer** (archivo muy grande) resueltos como 413/400 claros vía `errorHandler`.
- **Seed:** ya no usa URLs falsas `/materiales/<n>/guia.pdf` (404); ahora crea contenidos TEXTO reales indexables.
- **R2:** sigue sin consumidor; la decisión queda para el paso de deploy cloud (el interfaz `storage.ts` está listo para intercambiarlo por un cliente S3-compatible).

### 2. RAG para archivos (✅ hecho 2026-09-25)

- **Nuevo endpoint en ai-service:** `POST /rag/material/archivo` (multipart: `subject_id`, `material_id`, `archivo`) que extrae texto con `DocumentService` (ya cableado en app.state) y lo indexa con `IndexMaterialUseCase` — `rag_router.py`.
- **Backend:** `aiClient.indexArchivo` envía el binario como FormData; `contenidos.service.crearArchivo` crea el contenido e intenta indexar (degradación elegante si `AI_SERVICE_URL` no está configurado). Imágenes/video se guardan pero no se indexan.
- **UI docente:** `TeacherContentPage` sube archivos de verdad (FormData vía `useUploadMaterialFile`), muestra estado "⏳ RAG/🤖 RAG/— RAG" y permitir descargar el material. Se eliminó el alert "pendiente".
- **Tests:** `test_router.py` cubre el endpoint de archivo (indexación + archivo vacío).

### 3. Configuración / infra / deploy

- **Deploy cloud:** ⬜ **abierto, requiere reunión (2026-09-28).** Es lo único que bloquea la
  entrega. Se escribió **`DEPLOY.md`** como documento de decisión para discutirlo en equipo:
  comparativa de proveedores (Fly.io / Railway / Render+Vercel / VM propia), la trampa de los
  **3 cold starts** (3 servicios = 3 arranques en cadena; el que molesta es el del `ai-service`,
  que ya tarda 26 s con el modelo caliente), el requisito de que **DB y `ai-service` estén en la
  misma región**, 7 preguntas abiertas y un checklist de lo que falta antes de deployar.
  Postgres + `pgvector` **queda sin definir**.
- **Bug en `backend/Dockerfile` (target `prod`):** ~~`CMD` llama `npm run db:deploy` que **no existe**~~ → ✅ **resuelto (2026-09-17):** se agregó el script `db:deploy` = `prisma migrate deploy`, el CMD pasó a `sh -c "npm run db:deploy && node dist/index.js"` (el exec-form con `&&` no funciona sin shell) y el CLI `prisma` se movió de `devDependencies` a `dependencies` para que `npm ci --omit=dev` lo incluya en la imagen prod.
- **`ai-service` exige `GEMINI_API_KEY` al arrancar** → ✅ **resuelto (2026-09-17):** `gemini_api_key` ahora tiene default `""` y el cliente se crea **de forma perezosa** (`genai.get_genai_client` + propiedad `client` en `LLMService`/`EmbeddingsService`). Sin clave el servicio bootea, `/healthz` y `/tutor/depurar` funcionan, y el primer uso del LLM/embeddings falla con `502` y mensaje claro (`GEMINI_API_KEY no configurada…`).
- **`pinecone_service.py`:** usa el cliente síncrono de Pinecone dentro de métodos `async` (bloquea el event loop). Aceptable para probar, revisar si se apuesta a Pinecone en prod.
- **Cambiar de vector store no migra datos:** pgvector (`ai_materials`) y Pinecone son índices independientes; al switchear hay que re-indexar el material.
- **CI:** ✅ **arreglado (2026-09-27).** El pipeline estaba roto en 2 de 3 jobs: `backend` corría `npm run lint` sin que ese script existiera (ni `eslint`/`typescript-eslint` en devDeps), y `ai-service` corría `ruff check src tests` sobre un directorio inexistente. Agregado el `lint` del backend, sus devDeps, y corregido el path de ruff. Ahora `npm run lint` y `npm test` de la raíz funcionan. Opcional: agregar un job de `docker compose build`.
- **Scripts cross-platform:** ✅ **arreglados 2026-09-28.** `dev:local`, `ai:setup` y `ai:test` ya no hardcodean `.venv\Scripts\`: delegan en `scripts/venv.mjs` y `scripts/venv-setup.mjs`, que resuelven `Scripts/` vs `bin/` según `process.platform`. Verificado levantando uvicorn en Windows; en Linux/macOS eligen `bin/`.
- **Tests del backend: 2 archivos** (`health.test.ts`, `tutor-tools.test.ts`) con 18 tests para 17 módulos. Sigue siendo la deuda de cobertura más grande del proyecto.

### 4. IA — modos y flujo

- **UI del alumno:** ✅ **modo socrático y pistas tienen UI dedicada (2026-09-27).** El selector de modo vive en `StudentCourseDetailPage.tsx` y el `modo` viaja en el body de `POST /mensajes` y del stream. El **resumen de documentos (CU-A05) también quedó cableado** con panel propio (`ResumenPanel.tsx`).
- **Simulacro de examen (CU-A08):** ✅ **cableado (2026-09-27).** El botón viejo que mandaba un prompt de texto al chat se reemplazó por `SimulacroPanel.tsx`, que llama a `POST /api/materias/:materiaId/tutor/examen` con cantidad y dificultad elegibles.
- **OCR de imágenes (CU-P02):** ✅ **hecho (2026-09-30).** `src/services/ocr_service.py`.
  - Dependencias de sistema en el `Dockerfile`: `tesseract-ocr`, `tesseract-ocr-spa`, `tesseract-ocr-eng`
    y `poppler-utils`. Python: `pytesseract`, `pdf2image`, `Pillow`.
  - **PDF escaneado:** si `pypdf` saca menos de 24 caracteres, se considera escaneado y se
    rasterizan hasta 10 páginas (`pdf2image` + poppler) y se transcriben.
  - **SVG queda fuera a propósito**: es XML vectorial, PIL no lo renderiza. Antes de este cambio
    el SVG caía al `decode` final y **el XML crudo terminaba indexado en el vector store**; ahora
    devuelve vacío. Lo mismo para video.
  - **Filtro de binarios:** el fallback a `decode("utf-8")` ahora rechaza texto con >5% de
    caracteres de reemplazo o de control, así que un `.bin` o `.zip` desconocido no se indexa.
  - Idioma: `spa+eng`. Testado en Docker con tesseract 5.5.0: una imagen de apunte y el mismo
    contenido en JPG dan 206 caracteres, y el PDF escaneado 217. El texto llega al chunking
    correctamente (1 chunk listo para embeber).
  - ✅ **E2E verificado (2026-09-30)** con `GEMINI_API_KEY` puesta: un docente sube un PNG por
    `POST /api/secciones/:id/contenidos/archivo` → `tipo=IMAGEN`, `rag_indexado=True` en 1,3 s.
    Se puso una marca única (`39CECD`) solo en esa imagen y el alumno la recupera por RAG con
    score 0.808. La cadena completa funciona: imagen → OCR → chunks → embeddings → pgvector → RAG.
  - Tests: 21 casos nuevos en `test_ocr_service.py` (motor ausente, formatos, limpieza, binarios).
    Ojo: **mocks**ean tesseract, así que pasan aunque falte el binario. La prueba real es el E2E.
- **Registro de sesiones IA:** ✅ **corregido (2026-09-28).** El `modo` viaja en **cada** request
  y el backend lo prioriza sobre el de la sesión (`modo ? modoAMin(modo) : modoAMin(sesion.modo)`),
  así que la IA siempre respondía en el modo pedido — el chat funcionaba bien. Lo que quedaba
  desalineado era el **registro**: `sesionIA.modo` se quedaba clavado en el modo del primer mensaje,
  lo que rompía los analytics por modo y el fallback cuando un cliente omite `modo`.
  Ahora `sincronizarModo()` persiste el cambio (sin escribir si el modo no cambió).
  4 tests nuevos cubren el caso. **Pendiente menor:** `mensajeIA` sigue sin guardar el modo con el
  que se respondió cada mensaje; para eso hace falta una migración de Prisma.

### 5. Licencias, email y extras

- **Licencias:** sin proveedor de billing. `PLANES_LICENCIA` está hardcodeado en `admin.service.ts:551` con `LIMITE_MAU = 5000`; el único dato real es el count de alumnos activos.
- **Export PDF** de reportes: falta (la exportación CSV ya es real, `admin.service.ts:520`).
- **Email:** `EMAIL_API_KEY`/`EMAIL_FROM` en `.env` sin consumidor; el módulo `notificaciones` del backend es solo in-app. Falta el canal email.
- **ChromaDB:** `CHROMA_URL` sigue en el `.env` sin uso — solo hay pgvector (default) y Pinecone. Decidir y borrar la variable.

## PRÓXIMOS PASOS SUGERIDOS

1. ✅ Implementar subida de archivos (multipart + destino local) y ruta de descarga (**hecho, 2026-09-25**). Resta reemplazar disco local por R2 cuando se defina el deploy.
2. ✅ Cablear RAG de archivos (con `DocumentService`) para tipos no-TEXTO (**hecho, 2026-09-25**).
3. ✅ Arreglar `db:deploy` en el Dockerfile prod (**hecho, 2026-09-17**) y validar `docker compose up --build` completo (**hecho, 2026-09-28** — ver "Docker verificado").
4. ✅ Arreglar el CI y verificar lint/test/build de los tres módulos (**hecho, 2026-09-27**).
5. ✅ Exponer los modos socrático y pistas en la UI del alumno (**hecho, 2026-09-27**).
6. ⬜ **Definir el deploy cloud** — es lo que bloquea la entrega. **Abierto y documentado para
   discutir en `DEPLOY.md`** (proveedores, cold starts, región de la DB, preguntas abiertas).
7. ✅ Cablear los endpoints muertos: resumen (CU-A05) y examen (CU-A08) (**hecho, 2026-09-27** — `aiClient.ts` + módulo backend + service/hook/UI + 11 tests).
8. **Cubrir el backend con tests** — 2 archivos para 17 módulos; el de tutorTools cubre el flujo nuevo, el resto sigue sin tests.
9. ✅ Arreglar los scripts Windows-only de la raíz (**hecho, 2026-09-28** — `scripts/venv.mjs` + `scripts/venv-setup.mjs`).
10. ✅ Persistir el cambio de modo del tutor a mitad de sesión (**hecho, 2026-09-28** — `sincronizarModo()` en `tutor.service.ts` + 4 tests).
11. ✅ OCR de imágenes y PDF escaneado, CU-P02 (**hecho y verificado E2E, 2026-09-30** — `OcrService` con tesseract + poppler; una imagen subida por el docente llega al RAG y el alumno la recupera).
12. Evaluar Licencias, email, export PDF.

## Docker verificado (2026-09-28)

`docker compose build` + `up -d` levantan los 5 servicios y responden:
`backend /api/healthz` → `{"status":"ok","db":"ok"}`, `ai-service /healthz` → `{"status":"ok"}`,
`frontend :5173` → 200. Seed: 10 alumnos, 1 admin, 6 profesores, clave `Clave1234`.

Tres bugs reales que aparecieron al validar, ya corregidos:

1. **`docker compose build` fallaba con `ERESOLVE`.** `backend/package.json` pedía `typescript: ^7.0.2`, pero `typescript-eslint@8` exige `>=4.8.4 <6.1.0`. Localmente no se notaba porque el root del workspace hoistea el TS 5.9.3 del frontend y `typescript-eslint` resolvía contra ese; en la imagen no hay hoist y el peer check fallaba. **El CI no lo detectaba** porque usa `npm ci` (respeta el lock, no re-resuelve peers). Bajado a `^5.9.3`, la misma versión que ya usaban el root y el frontend.
2. **`backend/package-lock.json` era un lock standalone obsoleto** (pinned a TS 7) y **no está versionado**: vestigio de antes de los workspaces. El `Dockerfile` lo copiaba (`COPY package.json package-lock.json* ./`) y era el que disparaba el ERESOLVE. npm escribe el lock del root, nunca uno por subdirectorio.
3. **El ai-service moría al arrancar:** `RuntimeError: Form data requires "python-multipart"`. `python-multipart` ya estaba en `requirements.txt`; el culpable era el volumen `aipy_venv`, que monta `/app/.venv` encima del venv horneado en la imagen y quedó con las deps de un build anterior. Se resuelve con `docker volume rm eduai_aipy_venv` (o `docker compose down -v`). **Ojo: cada vez que cambie `requirements.txt` hay que rehacer ese volumen.**

> El flujo resumen/examen se validó end-to-end contra el stack: login → `/api/materias/mias` →
> `/api/materias/:id/secciones` → `/api/secciones/:id/contenidos` → `POST .../tutor/resumen`.
> Los guards responden bien (400 por enviar ambos `contenido_id` y `texto` o ninguno,
> 404 si el contenido es de otra materia, 502 si la IA no está disponible).

## Gemini en producción (2026-09-28)

Con `GEMINI_API_KEY` real se encontró que el modelo por defecto no servía:

- **`gemini-3.6-flash` devuelve 503 "high demand" de forma constante** en cuentas gratuitas.
  Lo mismo con `3.7-flash`, `3.8-flash`, `3.5-flash` y `flash-latest`; `gemini-2.5-flash` da 404.
  Los que sí responden son **`gemini-3.5-flash-lite`** y `gemini-3.1-flash-lite`.
  **Default cambiado a `gemini-3.5-flash-lite`** en `settings.py` y en los dos `.env.example`.
  Ojo: el 503 es intermitente, no permanente — `3.6-flash` a veces responde. Por eso el retry
  (abajo) es lo que hace que la app sea confiable, y no el cambio de modelo solo.
- **Reintentos con backoff exponencial** en `llm_service.py`: hasta 4 reintentos
  (2s, 4s, 8s, 16s, tope 30s) con jitter, solo ante errores transitorios
  (503, 429, `UNAVAILABLE`, `RESOURCE_EXHAUSTED`, timeouts). Los errores permanentes
  (400 de prompt, 401 de key, 404 de modelo) **no** se reintentan: gastarían cuota sin chances.
  Configurable con `LLM_MAX_RETRIES`, `LLM_RETRY_BASE_DELAY_SECONDS`, `LLM_RETRY_MAX_DELAY_SECONDS`.
  El streaming reintenta **solo al abrir** el stream, nunca a mitad (duplicaría tokens).
  Cubierto por `test_llm_retry.py` (10 casos).
- **Prompts corregidos** según lo que devolvió el modelo en la prueba real:
  el resumen arrancaba con "¡Hola! Soy tu tutor IA..." (ahora arranca directo en "Resumen general"),
  y en el examen la respuesta de una pregunta de desarrollo era
  *"La guía de corrección debe indicar que..."* — el modelo se filtraba una instrucción del prompt
  en vez de dar la respuesta (ahora se pide explícitamente la respuesta en sí).
- **El índice HNSW nunca se crea** y el warning era silencioso: `EMBEDDING_DIMENSIONS=3072`
  pero pgvector no indexa más de 2000 dimensiones con HNSW. La búsqueda **funciona igual**
  (escaneo secuencial) y el examen recupera material correctamente, pero degrada con volumen.
  El warning ahora dice la causa y el arreglo. Arreglo de fondo: bajar `EMBEDDING_DIMENSIONS`
  a ≤2000 y reindexar, o migrar a un índice IVF. **Requiere reindexar el material, no se hizo.**

## CÓMO CORRER

### Docker (recomendado)

```bash
# 1. Completar .env (raíz): GEMINI_API_KEY obligatoria para el ai-service
#    (usar un modelo *-flash-lite: los flash "grandes" dan 503 en cuentas gratuitas)
# 2. Levantar todo
docker compose up --build -d #el -d es para que se levanten en segundo plano y no quede la consola ahí, opcional
# 3. Migraciones + seed (el CMD dev no los corre solo)

docker compose exec backend npx prisma db seed
#4. Verificar estado
docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"

#5. Para limpiar docker
docker compose down -v --rmi all --remove-orphans
docker builder prune -a -f
```

Credenciales de prueba (`seed.ts`): `admin@ies.edu` (ADMIN) · `profe1@ies.edu` (PROFESOR) · `alumno1@ies.edu` (ALUMNO) — password `Clave1234`.

Servicios: frontend `http://localhost:5173` · backend `http://localhost:3000` · ai-service `http://localhost:8000` (`/docs`) · Postgres `localhost:5433` · Redis `localhost:6379`.

### Local (sin contenedores de app)

```bash
npm install                # workspaces raíz
npm run ai:setup           # venv + pip install en ai-services
docker compose up -d db redis
npm run db:migrate && npm run db:seed   # (con backend/.env propio)
npm run dev:local          # backend + ai + frontend con concurrently
```

### Verificación

- `npm run typecheck` (backend y frontend) · `npm run lint` · `npm test` (istan las suites de backend, ai-services y frontend)