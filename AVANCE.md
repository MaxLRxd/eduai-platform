# EduAI Platform — Avance del Proyecto

> Snapshot: 2026-09-25 · Reemplaza a `AVANCE.txt` (última actualización 2026-09-06).

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
| Resumen de documento (CU-A05) | `POST /tutor/resumen` | OK (endpoint; sin UI dedicada) |
| Simulacro de examen (CU-A08) | `POST /tutor/examen` | OK (acceso vía botón en chat alumno) |
| Modo estudio socrático (CU-A09) / pistas (CU-A06) | modos del `ask_tutor` (`MODE_PROMPTS`) | Parcial: hay prompts y backend lo soporta, sin UI dedicada |
| Generar material docente (CU-P10) | `POST /tutor/generar-material` | OK — frontend `TeacherAIPage` |
| Corrección de entregas (CU-P05) | `POST /tutor/corregir-entrega` | OK — frontend `TeacherCorrectionsPage` |
| Depurar prompt (CU-SYS01) | `POST /tutor/depurar` | OK |
| Indexar/borrar material RAG | `POST /rag/material` + `DELETE` + `POST /rag/material/archivo` | OK — texto y archivos (PDF/DOCX/PPTX/TXT) desde 2026-09-25 |

Backend cableado en `backend/src/config/aiClient.ts` (chatTutor, streamTutor, indexMaterial, generarMaterialDocente, corregirEntregaIA) — todos con degradación elegante si `AI_SERVICE_URL` no está configurado.

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
- **CI:** `.github/workflows/ci.yml` tiene jobs de backend/frontend/ai-service (lint + tests + build). Verificar que pase en el repo; opcional: job de `docker compose build`.

### 4. IA — modos y flujo

- **UI del alumno:** el chat usa modo normal (+ botón "Simulacro de examen" por prompt, `StudentCourseDetailPage.tsx:150-153`). No hay UI dedicada para resumen (CU-A05), pistas (CU-A06) ni modo socrático (CU-A09) aunque backend/ai-service los soportan.
- **Registro de sesiones IA:** modelos `sesionIA`/`mensajeIA` existen y el backend registra el stream (`tutor.service.ts`); revisar que los modos socrático/pistas queden bien persistidos.

### 5. Licencias, email y extras

- **Licencias:** sin backend (depende de proveedor de billing, no definido). Página admin existe con mock.
- **Export PDF** de reportes: falta (la exportación CSV ya es real).
- **Email:** `EMAIL_API_KEY`/`EMAIL_FROM` en `.env` sin consumidor; el módulo `notificaciones` del backend es solo in-app. Falta el canal email.

## PRÓXIMOS PASOS SUGERIDOS

1. ✅ Implementar subida de archivos (multipart + destino local) y ruta de descarga (**hecho, 2026-09-25**). Resta reemplazar disco local por R2 cuando se defina el deploy.
2. ✅ Cablear RAG de archivos (con `DocumentService`) para tipos no-TEXTO (**hecho, 2026-09-25**).
3. ✅ Arreglar `db:deploy` en el Dockerfile prod (**hecho, 2026-09-17**); queda validar `docker compose up --build` completo.
4. Correr el CI y verificar lint/test/build de los tres módulos.
5. Definir el deploy cloud (Railway/Render + R2 + DB).
6. Exponer modos del tutor en la UI del alumno (resumen, pistas, socrático).
7. Evaluar Licencias, email y export PDF.

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