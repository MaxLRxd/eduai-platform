# Mapa de arquitectura — eduai-platform

> Guía de orientación para el equipo. Escrita a partir del grafo de `graphify`
> (`GRAPH_REPORT.md`, generado el 2026-09-13) **verificado contra el código real**
> (2026-09-27).
>
> Para qué sirve: entender dónde tocar, qué no romper, y qué falta, sin leer los
> 3 microservicios de punta a punta.

---

## 1. Qué es esta carpeta

`graphify` es una herramienta que analiza el repo y lo convierte en un **grafo de
conocimiento**: lee el AST de cada archivo, detecta símbolos, relationships
(imports, llamadas, contiene) y agrupa todo con Community Detection (Louvain) en
"comunidades" que representan subsistemas.

| Archivo | Qué es | ¿Se regenera? |
|---|---|---|
| `GRAPH_REPORT.md` | Reporte legible: god nodes, comunidades, gaps, conexiones inesperadas | Sí, se pisa en cada corrida |
| `graph.html` | Grafo interactivo para navegar visualmente | Sí |
| `graph.json` / `manifest.json` | Grafo crudo + hashes por archivo (cache incremental) | Sí |
| `.graphify_*.json` | Artefactos intermedios (AST, extract, semantic, labels) | Sí |
| `memory/*.md` | Q&A que el grafo respondió, con outcome marcado | Manual |
| `reflections/LESSONS.md` | Lecciones extraídas de los outcomes de `memory/` | Sí |
| `cache/` | Cache de AST y semántico por versión | Sí |
| `README.md` | **Este archivo. Guía humana.** No lo genera graphify | No |

**Regla práctica:** `GRAPH_REPORT.md` es una foto dated del estado del código.
Si tocaste mucho código, re-corré graphify o ignorá el reporte y leé el código.
Este README es lo que no se pisa.

### Cómo re-correr graphify

La herramienta **no está en el repo** (no es dependencia npm ni pip, no hay
script). Es externa. Desde la raíz del proyecto, con la herramienta instalada en
tu máquina:

```bash
graphify .            # o el subcomando que corresponda a tu versión
```

El `manifest.json` guarda `mtime` + hashes por archivo, así que la corrida
incremental solo reprocesa lo que cambió.

---

## 2. Cómo leer `GRAPH_REPORT.md`

No lo leas linealmente. Las secciones que importan:

| Sección | Para qué |
|---|---|
| **God Nodes** | Los símbolos más conectados. Te dice dónde está el peso del sistema. |
| **Import Cycles** | Si dice "None detected" → bien. Si aparece algo, es un bug de diseño. |
| **Communities** | Subsistemas detectados. Los nombres 자동-generados ("Community 12") no significan nada; los nodos que lista sí. |
| **Surprising Connections** | Relaciones semánticas inferidas por el LLM. Útil para descubrir acoplamiento que no es visible en los imports. |
| **Knowledge Gaps** | Nodos con ≤1 conexión. Zona de código muerto o sin documentar. |
| **Suggested Questions** | El grafo te dice qué vale la pena investigar, con betweenness centrality. |

**Ojo con las Communities:** la cohesión baja (Comunidad 0, 1, 2 con ~0.07-0.08
de score) no es un problema *del código*: es que son módulos largos con
muchas funciones poco conectadas. La Comunidad 0 con 52 nodos es todo el módulo
`admin` + `auth` + `dashboard` mezclados.

---

## 3. Arquitectura real

Tres microservicios. **La regla que ordena todo: cada capa solo habla con la
adyacente.** El frontend nunca llama a la IA directo; el backend nunca sabe cómo
funciona un embedding.

```
┌─────────────────────────────────────────────────────────────┐
│  frontend/          React 18 + Vite + Tailwind             │
│                     @tanstack/react-query     :5173         │
│  - router/ guards por rol                                   │
│  - services/  ← ÚNICO lugar que hace fetch()                │
│  - hooks/     ← estado + react-query                        │
│  - pages/     ← composición, casi sin lógica                │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP /api/*
┌──────────────────────────┴──────────────────────────────────┐
│  backend/           Node + Express + Prisma                 │
│                     JWT access/refresh         :3000         │
│  - modules/<dominio>/                                      │
│      routes/ → controller → service → prisma                │
│  - middlewares/  auth, requireRole, errorHandler            │
│  - config/        env (zod), logger (pino), aiClient,       │
│                   storage, cache (redis)                    │
└────────┬────────────────────────────────────┬───────────────┘
         │ SQL (Prisma)                       │ HTTP → AI_SERVICE_URL
         │                                    │
  ┌──────┴─────────────┐         ┌────────────┴──────────────┐
  │ PostgreSQL + pgvector│        │  ai-services/  FastAPI     │
  │   :5433  ai_materials │        │                 :8000     │
  │ Redis  :6379 (caché)  │        │  - routers/  (contratos)  │
  └───────────────────────┘        │  - use_cases/ (orquesta)  │
                                   │  - services/  (infra IA)  │
                                   │  - prompts/    (texto)    │
                                   │  Gemini + pgvector/Pinecone│
                                   └────────────────────────────┘
```

### Contrato de la frontera backend ↔ ai-services

`backend/src/config/aiClient.ts` es el **único** archivo del backend que habla
HTTP con la IA. Hoy llama 6 rutas. Si agregás un caso de uso de IA, la cadena
obligatoria es:

```
prompts/<caso>.py          (texto del system prompt)
  → use_cases/<caso>.py    (RAG: embedding → retrieval → contexto → LLM)
    → schemas/tutor.py     (contrato Pydantic de entrada/salida)
      → routers/tutor_router.py  (endpoint HTTP, errores → 400/502)
        → main.py          (wiring en app.state)
          → aiClient.ts    (llamada Node, con degradación elegante)
            → modules/<x>/  (controller + guard de autorización)
              → services/<x>.ts  en el frontend
```

**Degradación elegante:** si `AI_SERVICE_URL` no está configurado, `aiClient`
devuelve `null` y los controllers responden 501 con mensaje claro. El sistema
arranca sin IA; no se cae.

---

## 4. Los god nodes (NO los toques sin entender)

El grafo los llama así porque conectan 20+ comunidades. El grafo no dice
"están mal" — dice "si lo tocás, se entera todo el sistema".

### `AppError` — 153 aristas · betweenness 0.056

`backend/src/middlewares/error.ts:3`. Una clase `Error` con `statusCode` +
`message`. **Es la abstracción de error centralizada del backend.**

Por qué toca 21 comunidades: cada controller y cada service hace
`throw new AppError(...)`. Los módulos nunca se llaman entre sí directamente;
todos se ponen de acuerdo en `AppError`. Por eso es el nodo #1.

> **Consecuencia práctica:** el contrato de errores es `(statusCode, message)`.
> Si agregás un tipo de error nuevo, **no** crees otra clase de error ni
> tires un string suelto — tirá `AppError`. `errorHandler` convierte
> `AppError` → status + JSON, y cualquier otra cosa → 500 genérico.
> Si tirás algo que no es `AppError`, el usuario ve "error interno" y perdés
> el mensaje real.

### `api()` — 42 aristas · `frontend/src/services/api.ts`

Único cliente HTTP del frontend. Concentra auth, refresh token, `ApiError`.
Los `services/*.ts` son wrappers finos sobre este.

> **Consecuencia práctica:** el resto de la app **no debe hacer `fetch`**.
> Si algo necesita el token o el refresh, va por acá. (`tutor.service.ts` es la
> excepción: hace `fetch` directo para el SSE, porque `EventSource` no puede
> mandar `Authorization` y el stream usa cookie de refresh.)

### `obtenerProfesorAsignado()` — 35 aristas

Guard de autorización transversal. Valida que el usuario sea profesor
**asignado a esa materia** antes de generar material, indexar contenido o
leer Analytics. Vive en `backend/src/modules/materias/`.

> **Consecuencia práctica:** es la defensa contra el IDOR más común del
> proyecto (docente A leyendo la materia del docente B). Cualquier endpoint
> nuevo que reciba un `materiaId` y devuelva material de esa materia **tiene
> que pasar por acá**.

### `RetrievalService` / `LLMService` / `EmbeddingsService` — 24-28 aristas

Los tres services de `ai-services/src/services/`. Son intercambiables por
`vector_store.py` (pgvector ↔ Pinecone) y por proveedor de LLM.

> **Consecuencia práctica:** los tests usan fakes de estos
> (`ai-services/src/tests/fakes.py`). Cambiar la implementación no debe
> romper los tests: si tocás la interfaz, tocá el fake.

### `express` — 41 aristas

Normal en un monolito modular. No implica nada raro.

---

## 5. Inventario de módulos

### Backend — 17 módulos, todos con la misma estructura

`routes → controller → service → prisma`

| Módulo | Responsabilidad |
|---|---|
| `auth` | login, refresh, logout, me, registro |
| `admin` | usuarios, materias, claves, branding, reportes, licencias |
| `analytics` | comprensión, dudas, errores frecuentes, riesgo |
| `asistente` | proxy de generación de material docente |
| `contenidos` | CRUD + **subida de archivos** + indexado RAG |
| `correccion` | entregas, rúbricas, cola de corrección, corrección IA |
| `dashboard` | 3 variantes por rol |
| `actividades` | consignas de las actividades |
| `asistencias` | registro diario, estados |
| `materias` | CRUD + inscripción por clave + asignación de profesor |
| `messages` / `notificaciones` | mensajería docente↔alumno / in-app |
| `notas` | calificaciones |
| `planning` | planificación de clase por fecha |
| `secciones` / `config` | estructura de la materia / branding |
| `tutor` | sesiones IA, mensajes, stream SSE |

### ai-services

| Carpeta | Contenido |
|---|---|
| `prompts/` | `tutor`, `socratic`, `hints`, `summary`, `exam`, `material`, `correccion` — **texto fuera del código a propósito** |
| `use_cases/` | `ask_tutor`, `index_material`, `correct_submission`, `generar_material`, `examen`, `resumir_documento`, `depurar_prompt` |
| `routers/` | `tutor_router` (CU de IA), `rag_router` (indexado) |
| `services/` | `retrieval_service` (pgvector), `pinecone_service`, `vector_store` (factory), `embeddings_service`, `llm_service`, `chunking_service`, `document_service`, `cache_service` (Redis), `prompt_sanitizer` |

### Frontend

- **Hooks:** un hook por dominio (`useCourses`, `useAssignments`, `useTutorChat`…). Contienen el estado y las queries de react-query.
- **Services:** un archivo por dominio. Solo `fetch`.
- **Pages:** Alumni, Teacher, Admin. Componen, no tienen lógica.
- **Components/ui:** primitivas Tailwind (`Button`, `Card`, `Modal`, `Tag`…).

---

## 6. Puntos de extensión (dónde agregar)

| Quiero agregar… | Toco… |
|---|---|
| Un caso de uso de IA nuevo | La cadena de la §3, completa. `prompts/` primero. |
| Un endpoint de dominio nuevo | `modules/<dominio>/` con las 4 capas + `requireRole` |
| Una página nueva | `pages/<rol>/` + ruta en `router/` con el guard del rol |
| Un campo en la base | `prisma/schema.prisma` + migración + actualizar el DTO del módulo |
| Un campo en un contrato backend↔IA | `schemas/tutor.py` (Pydantic) **y** la interface de `aiClient.ts` |
| Un vector store nuevo | `services/vector_store.py` + un test en `test_vector_store.py` |

---

## 7. Lo que falta

Verificado contra el código, no contra la documentación. Ordenado por lo que
bloquea a los demás.

### 7.1 Bloqueantes (define si el proyecto se puede entregar)

| # | Falta | Estado real | Nota |
|---|---|---|---|
| 1 | **Deploy cloud** | ❌ No existe | No hay `deploy.yml` ni `docker-compose.staging.yml`. Solo CI. Hay 3 Dockerfiles multi-stage y `frontend/nginx.conf` listos. Railway/Render + Postgres queda sin definir. |
| 2 | **Almacenamiento R2** | ❌ No existe | Cero clientes S3 en el repo. Los uploads van a **disco local** (`UPLOAD_DIR` = `data/uploads`, `backend/src/config/storage.ts`). Las 4 vars `R2_*` están parseadas en `env.ts` pero **nadie las lee**. El puerto está listo para S3-compatible. |
| 3 | **Observabilidad** | ⚠️ Solo parcial | Hay `structlog` + `pino` + `/healthz`, pero **cero métricas**: ni Sentry, ni OTel, ni Prometheus. Declarado fuera de alcance del MVP. |
| 4 | **Cobertura de tests del backend** | ⚠️ Crítico | **2 archivos de test** (`health.test.ts`, `tutor-tools.test.ts`) para 17 módulos — el único que cubre lógica de negocio es el nuevo del flujo resumen/examen. En ai-services hay 9 archivos; en frontend 1. |
| 5 | ~~**Scripts Windows-only**~~ | ✅ Resuelto 2026-09-28 | `dev:local`, `ai:setup` y `ai:test` delegan en `scripts/venv.mjs` / `scripts/venv-setup.mjs`, que resuelven `.venv\Scripts\` vs `.venv/bin/` según `process.platform`. |

### 7.2 Funcionalidades a medio cablear

Casos de uso que reachable en `ai-services`. **Resumen (CU-A05) y examen (CU-A08)
se cablearon completos el 2026-09-27**; queda OCR.

| Caso de uso | ai-services | Backend proxy | Frontend |
|---|---|---|---|
| Resumen de documento (CU-A05) | ✅ `POST /tutor/resumen` | ✅ `POST /api/materias/:materiaId/tutor/resumen` (2026-09-27) | ✅ `ResumenPanel.tsx` + `useResumen` |
| Simulacro de examen (CU-A08) | ✅ `POST /tutor/examen` | ✅ `POST /api/materias/:materiaId/tutor/examen` (2026-09-27) | ✅ `SimulacroPanel.tsx` + `useSimulacro` |
| OCR de imágenes (CU-P02) | ❌ no existe | ❌ | ❌ (el tipo `IMAGEN` existe en el dominio y se sube, pero **no se indexa**) |

> **Cómo se cablearon (2026-09-27), por si hay que repetir el patrón:**
> función en `aiClient.ts` (`resumirDocumento` / `generarExamen`, timeout 120 s y 180 s) →
> schemas Zod en `tutor.schemas.ts` → service con `obtenerInscripcion()` y validación de pertenencia →
> controller + rutas con `requireRole("ALUMNO")` → service en `tutor.service.ts` (frontend) →
> hook con estado de carga/error → panel propio en la página del alumno.
> El examen usa RAG de la materia; el resumen **no** usa RAG, solo manda el texto
> (de un `contenido` con `texto_contenido` o de texto libre pegado por el alumno) y
> **rechaza binarios** con un 400 claro. Sin migraciones: no se persiste nada.
> Cubierto por `backend/src/tests/tutor-tools.test.ts` (11 casos).

### 7.3 Pendientes de negocio

| # | Falta | Detalle |
|---|---|---|
| 5 | **Licencias** | `PLANES_LICENCIA` hardcodeado en `admin.service.ts:551` + `LIMITE_MAU = 5000`. Sin proveedor de billing, sin persistencia. El único dato real es el count de alumnos. |
| 6 | **Email** | `EMAIL_API_KEY` / `EMAIL_FROM` marcadas en `.env.example` como *"sin consumidor"*. No existe `email.service.ts`. `notificaciones` es 100% in-app. |
| 7 | **Export PDF** | Solo CSV (`admin.service.ts:520`). No hay `pdfkit`/`puppeteer`/`jspdf`. |
| 8 | **ChromaDB** | `CHROMA_URL` sin uso. Solo hay pgvector y Pinecone. Decidir y borrar la variable, o implementarlo. |

### 7.4 Deuda técnica conocida

| # | Detalle | Ubicación |
|---|---|---|
| 9 | `Pinecone` síncrono dentro de métodos `async` → **bloquea el event loop** | `ai-services/src/services/pinecone_service.py` |
| 10 | **Cambiar de vector store no migra datos**: pgvector (`ai_materials`) y Pinecone son índices independientes. Al switchear hay que re-indexar todo. | `vector_store.py` |
| 11 | `ai-service/` (singular, legacy) existe con `src/` y `tests/` **vacíos** | raíz del repo |
| 12 | 3 warnings de `react-hooks/exhaustive-deps` sin resolver | `TeacherAttendancePage.tsx:27`, `TeacherCorrectionsPage.tsx:35` |
| 13 | `MOCK_COLOR_PRESETS` sigue siendo estático en la UI de branding | `frontend/src/services/adminSettings.service.ts` |
| 14 | `GET /api/admin/license` devuelve planes hardcodeados | `admin.routes.ts:80` |

---

### 7.5 El CI (ya corregido 2026-09-27) ✅

**Estaba roto:** 2 de los 3 jobs de `.github/workflows/ci.yml` fallaban
siempre, así que el pipeline nunca dio verde. Encontrado al correr los comandos
del workflow a mano.

| Job | Qué pasaba | Fix |
|---|---|---|
| `backend` | `npm run lint` → **"Missing script"**. El backend no tenía script `lint`, y tampoco `eslint` ni `typescript-eslint` en sus devDeps (el `eslint.config.mjs` estaba ahí, orphaned). | Agregado el script + las deps |
| `ai-service` | `ruff check src tests` → `ai-services/tests/` **no existe**; los tests están en `src/tests/`. | `ruff check src` |
| `frontend` | El bloque `test` de vitest no estaba en `vite.config.ts` y rompía `tsc -b`. | Config separado en `vitest.config.ts` |

En la raíz, `npm run lint` y `npm test` también fallaban por cascada. Arreglados.

**Lint newly habilitado en el backend** — destapó 5 errores preexistentes que
nadie veía porque el script no existía. Los 3 fixes:
- `dashboard.service.ts:180` — `usuarioId` sin usar → `_usuarioId`
  (se agregó `argsIgnorePattern: "^_"` al `eslint.config.mjs`, que es el
  estándar para este caso)
- `messages.controller.ts:6` — `Request<any, any, any, any>` → `Pick<Request, "user">`,
  el mismo patrón que ya usaba `admin.controller.ts:14`
- `types/express.d.ts:4` — `eslint-disable` directive que ya no hacía falta

> **Verificación actual:** backend 18 tests · ai-services 66 (+1 skipped) ·
> frontend 3. `npm run lint` y `npm test` de la raíz funcionan.
>
> **OCR implementado (CU-P02, 2026-09-30):** `OcrService` con tesseract + poppler
> (`ocr_service.py`). Extrae texto de imágenes (jpg/png/gif/webp/bmp/tiff) y de
> **PDF escaneados**, que antes no se indexaban. El backend dejó de saltear
> `IMAGEN` en la indexación RAG. Se corrigió de paso un bug donde el SVG y los
> binarios desconocidos terminaban indexados como texto. E2E verificado: una
> imagen subida por el docente llega al vector store y el alumno la recupera
> por RAG.
>
> **`docker compose build` + `up -d` verificados el 2026-09-28**: los 5 servicios
> levantan y responden. Se encontraron y corrigieron 3 bugs que ni el CI ni el
> lint veían — el más importante, `backend` pedía `typescript@^7` mientras
> `typescript-eslint@8` exige `<6.1.0`, lo que rompía el build de la imagen
> (el CI no lo detectaba porque `npm ci` no re-resuelve peers). Ver la sección
> "Docker verificado" de `AVANCE.md` para el detalle de los tres.
>
> **Gemini configurado y probado con key real (2026-09-28)**: el modelo por
> defecto `gemini-3.6-flash` daba 503 "high demand" constante en cuenta gratuita
> (igual que 3.7/3.8/3.5-flash y `flash-latest`); los `*-flash-lite` responden.
> Default movido a `gemini-3.5-flash-lite` y se agregó **retry con backoff
> exponencial** en `llm_service.py` (solo para errores transitorios: 503/429/timeouts).
> Pendiente Known: el índice HNSW no se crea porque `EMBEDDING_DIMENSIONS=3072`
> supera el límite de 2000 de pgvector — la búsqueda cae a escaneo secuencial y
> funciona, pero degrada con volumen. Detalle en `AVANCE.md`.

---

### 7.6 Gaps que reporta el grafo

- **316 nodos aislados** (símbolos con ≤1 conexión): mayormente DTOs, types e
  interfaces. Preocupante solo si aparece lógica de negocio ahí adentro.
- **Comunidades 0, 1 y 2 con cohesión ~0.07-0.08**: `admin+auth+dashboard`,
  `RAG+tutor+corrección`, y el shell de la app respectivamente. Son módulos
  grandes, no un problema de acoplamiento.

---

## 8. Reglas del proyecto (para no romper nada)

1. **Las capas solo se hablan con las adyacentes.** Si el frontend necesita
   llamar a la IA, primero va por el backend.
2. **Todo error de negocio es un `AppError`.** Nunca otra clase, nunca un
   string.
3. **Todo endpoint con `materiaId` valida la asignación del profesor.** Es el
   IDOR más probable del proyecto.
4. **Nada de valores hardcodeados.** Toda config viene de `env` (validado con
   zod). Ni URLs, ni keys, ni passwords.
5. **Los fakes se actualizan junto con la interfaz.** `ai-services/src/tests/fakes.py`.
6. **Contrato primero.** Definí el shape de entrada/salida antes de codear.
   El proyecto tiene tres lenguajes y dos equipos; el contrato es lo único que
   los ata.
7. **Verificación por capa antes de commitear** (es lo que corre el CI):
   ```bash
   # todo (backend + ai-services + frontend)
   npm run lint
   npm test

   # o por módulo
   npm run typecheck --workspace backend
   npm run lint      --workspace frontend
   npm run build     --workspace frontend
   ```
    > `dev:local` y `ai:setup` ya son cross-platform (§7.1 #5, resuelto 2026-09-28).

---

## 9. Glosario

| Término | Qué es |
|---|---|
| **CU** | Caso de uso. El proyecto los numera: `CU-A04` = alumno, `CU-P10` = profesor, `CU-SYS01` = sistema. |
| **RAG** | Retrieval-Augmented Generation: antes de responder, busca en el material indexado de la materia y lo pasa como contexto. |
| **SSE** | Server-Sent Events. El streaming del chat del tutor. |
| **pgvector** | Extensión de Postgres para vectores. Vector store por defecto. |
| **God node** | Símbolo con muchísima conectividad. Suele indicar un seam arquitectónico, no un problema. |
| **Betweenness centrality** | Qué tan "puente" es un nodo entre comunidades. Alto = tocarlo tiene blast radius. |
| **Cohesion** | Qué tan conectadas están las cosas dentro de una comunidad. Baja = módulo grande. |
