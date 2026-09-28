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
| OCR de imágenes (CU-P02) | — | ❌ **No existe** (`ocr_service.py` está en `IMPLEMENTATION.md` pero nunca se implementó). Las imágenes se suben pero no se indexan |

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

- **Deploy cloud sin definir** (quedó del Sprint 0): Railway/Render para backend+ai-service y RDS/DB; ver `README.md` y `.github/workflows/ci.yml`.
- **Bug en `backend/Dockerfile` (target `prod`):** ~~`CMD` llama `npm run db:deploy` que **no existe**~~ → ✅ **resuelto (2026-09-17):** se agregó el script `db:deploy` = `prisma migrate deploy`, el CMD pasó a `sh -c "npm run db:deploy && node dist/index.js"` (el exec-form con `&&` no funciona sin shell) y el CLI `prisma` se movió de `devDependencies` a `dependencies` para que `npm ci --omit=dev` lo incluya en la imagen prod.
- **`ai-service` exige `GEMINI_API_KEY` al arrancar** → ✅ **resuelto (2026-09-17):** `gemini_api_key` ahora tiene default `""` y el cliente se crea **de forma perezosa** (`genai.get_genai_client` + propiedad `client` en `LLMService`/`EmbeddingsService`). Sin clave el servicio bootea, `/healthz` y `/tutor/depurar` funcionan, y el primer uso del LLM/embeddings falla con `502` y mensaje claro (`GEMINI_API_KEY no configurada…`).
- **`pinecone_service.py`:** usa el cliente síncrono de Pinecone dentro de métodos `async` (bloquea el event loop). Aceptable para probar, revisar si se apuesta a Pinecone en prod.
- **Cambiar de vector store no migra datos:** pgvector (`ai_materials`) y Pinecone son índices independientes; al switchear hay que re-indexar el material.
- **CI:** ✅ **arreglado (2026-09-27).** El pipeline estaba roto en 2 de 3 jobs: `backend` corría `npm run lint` sin que ese script existiera (ni `eslint`/`typescript-eslint` en devDeps), y `ai-service` corría `ruff check src tests` sobre un directorio inexistente. Agregado el `lint` del backend, sus devDeps, y corregido el path de ruff. Ahora `npm run lint` y `npm test` de la raíz funcionan. Opcional: agregar un job de `docker compose build`.
- **Scripts Windows-only:** `dev:local` y `ai:setup` hardcodean `.venv\Scripts\`. En Linux/Mac no levantan — bloquea a cualquier compañero que no esté en Windows.
- **Tests del backend: 2 archivos** (`health.test.ts`, `tutor-tools.test.ts`) para 17 módulos. Es la deuda de cobertura más grande del proyecto.

### 4. IA — modos y flujo

- **UI del alumno:** ✅ **modo socrático y pistas tienen UI dedicada (2026-09-27).** El selector de modo vive en `StudentCourseDetailPage.tsx` y el `modo` viaja en el body de `POST /mensajes` y del stream. El **resumen de documentos (CU-A05) también quedó cableado** con panel propio (`ResumenPanel.tsx`).
- **Simulacro de examen (CU-A08):** ✅ **cableado (2026-09-27).** El botón viejo que mandaba un prompt de texto al chat se reemplazó por `SimulacroPanel.tsx`, que llama a `POST /api/materias/:materiaId/tutor/examen` con cantidad y dificultad elegibles.
- **OCR de imágenes (CU-P02):** no implementado. `ocr_service.py` aparece en `IMPLEMENTATION.md` pero nunca existió. El tipo `IMAGEN` existe en el dominio y los archivos se suben, pero **no se indexan** al vector store.
- **Registro de sesiones IA:** el `modo` ahora viaja por request, pero `useTutorChat.ts:16` cachea el `sesionId` en un ref → **la sesión se crea con el modo del primer mensaje y nunca se actualiza**. Si el alumno cambia de NORMAL a SOCRATIC a mitad de chat, `sesionIA.modo` queda desalineado del modo real. Los `mensajeIA` tampoco guardan el modo con el que se respondió.

### 5. Licencias, email y extras

- **Licencias:** sin proveedor de billing. `PLANES_LICENCIA` está hardcodeado en `admin.service.ts:551` con `LIMITE_MAU = 5000`; el único dato real es el count de alumnos activos.
- **Export PDF** de reportes: falta (la exportación CSV ya es real, `admin.service.ts:520`).
- **Email:** `EMAIL_API_KEY`/`EMAIL_FROM` en `.env` sin consumidor; el módulo `notificaciones` del backend es solo in-app. Falta el canal email.
- **ChromaDB:** `CHROMA_URL` sigue en el `.env` sin uso — solo hay pgvector (default) y Pinecone. Decidir y borrar la variable.

## PRÓXIMOS PASOS SUGERIDOS

1. ✅ Implementar subida de archivos (multipart + destino local) y ruta de descarga (**hecho, 2026-09-25**). Resta reemplazar disco local por R2 cuando se defina el deploy.
2. ✅ Cablear RAG de archivos (con `DocumentService`) para tipos no-TEXTO (**hecho, 2026-09-25**).
3. ✅ Arreglar `db:deploy` en el Dockerfile prod (**hecho, 2026-09-17**); queda validar `docker compose up --build` completo.
4. ✅ Arreglar el CI y verificar lint/test/build de los tres módulos (**hecho, 2026-09-27**).
5. ✅ Exponer los modos socrático y pistas en la UI del alumno (**hecho, 2026-09-27**).
6. **Definir el deploy cloud** (Railway/Render + R2 + DB) — es lo que bloquea la entrega.
7. ✅ Cablear los endpoints muertos: resumen (CU-A05) y examen (CU-A08) (**hecho, 2026-09-27** — `aiClient.ts` + módulo backend + service/hook/UI + 11 tests).
8. **Cubrir el backend con tests** — 2 archivos para 17 módulos; el de tutorTools cubre el flujo nuevo, el resto sigue sin tests.
9. Arreglar los scripts Windows-only de la raíz.
10. Evaluar Licencias, email, export PDF y OCR.

## CÓMO CORRER

### Docker (recomendado)

```bash
# 1. Completar .env (raíz): GEMINI_API_KEY obligatoria para el ai-service
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