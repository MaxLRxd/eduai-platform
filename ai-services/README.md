# EduAI · AI Service — Tutor IA

Microservicio en **Python / FastAPI** con responsabilidad única: todo lo relacionado con inteligencia artificial del proyecto EduAI. Su pieza central es el **tutor IA contextualizado por materia**, construido sobre un pipeline RAG (recuperación aumentada por generación) que usa **Gemini** como LLM, **pgvector** (PostgreSQL) o **Pinecone** como base vectorial (se elige con `VECTOR_STORE`) y **Redis** como caché.

El backend de Node.js lo consume por HTTP y no necesita saber cómo funciona internamente.

---

## Índice

1. [Estructura de archivos](#1-estructura-de-archivos)
2. [Explicación de cada archivo](#2-explicación-de-cada-archivo)
3. [Cómo se conectan entre sí](#3-cómo-se-conectan-entre-sí)
4. [Endpoints disponibles](#4-endpoints-disponibles)
5. [Casos de uso cubiertos](#5-casos-de-uso-cubiertos)
6. [Cómo ejecutarlo](#6-cómo-ejecutarlo)
7. [Testeo](#7-testeo)

---

## 1. Estructura de archivos

```
ai-services/
├── .env.example              # Variables de entorno (plantilla, va al repo)
├── conftest.py               # Configuración de pytest (env vars para tests)
├── pyproject.toml            # Config de pytest y ruff
├── requirements.txt          # Dependencias de producción
├── requirements-dev.txt      # Dependencias de desarrollo (tests)
├── Dockerfile                # Imagen del servicio
└── src/
    ├── main.py               # Punto de entrada de la app FastAPI
    ├── config/
    │   ├── settings.py       # Carga y validación de variables de entorno
    │   ├── genai.py          # Cliente compartido de Gemini
    │   └── __init__.py
    ├── prompts/
    │   ├── tutor.py          # Prompt modo normal (CU-A04)
    │   ├── socratic.py       # Prompt modo estudio socrático (CU-A09)
    │   ├── hints.py          # Prompt modo pistas (CU-A06)
    │   ├── exam.py           # Prompt simulacro de examen (CU-A08)
    │   ├── summary.py        # Prompt resumen de documentos (CU-A05)
    │   └── __init__.py
    ├── routers/
    │   ├── tutor_router.py   # Endpoints del tutor IA + SSE
    │   ├── rag_router.py     # Endpoints de indexación de material
    │   └── __init__.py
    ├── schemas/
    │   ├── tutor.py          # Contratos Pydantic de entrada/salida
    │   └── __init__.py
    ├── services/
    │   ├── llm_service.py    # Llamadas a Gemini (sync + streaming)
    │   ├── embeddings_service.py  # Embeddings (texto → vector)
    │   ├── retrieval_service.py   # Búsqueda vectorial en pgvector
    │   ├── pinecone_service.py    # Búsqueda vectorial en Pinecone
    │   ├── vector_store.py        # Factory: elige vector store por VECTOR_STORE
    │   ├── cache_service.py       # Caché Redis con TTL
    │   ├── chunking_service.py    # División de textos en fragmentos
    │   ├── document_service.py    # Extracción de texto (PDF/DOCX/PPTX/TXT)
    │   ├── prompt_sanitizer.py    # Depuración de prompts (CU-SYS01)
    │   └── __init__.py
    ├── use_cases/
    │   ├── ask_tutor.py      # CU-A04: consultas contextualizadas
    │   ├── index_material.py # Pipeline RAG: indexar material
    │   ├── resumir_documento.py  # CU-A05: resúmenes
    │   ├── examen.py         # CU-A08: simulacros de examen
    │   ├── depurar_prompt.py # CU-SYS01: depuración de prompts
    │   ├── _helpers.py       # Utilidades compartidas entre casos de uso
    │   └── __init__.py
    └── tests/
        ├── fakes.py          # Fakes de servicios externos para tests
        ├── test_chunking.py
        ├── test_prompt_sanitizer.py
        ├── test_ask_tutor.py
        ├── test_router.py
        ├── test_pinecone_service.py
        └── test_vector_store.py
```

---

## 2. Explicación de cada archivo

### Archivos de configuración

**`.env.example`** — Plantilla con las variables de entorno que necesita el servicio. Cada desarrollador la copia como `.env` y completa los valores reales (nunca van al repo). Variables:

| Variable | Descripción |
|---|---|
| `GEMINI_API_KEY` | Clave de API de Google Gemini |
| `GEMINI_MODEL` | Modelo LLM de chat (por defecto `gemini-3.6-flash`) |
| `GEMINI_EMBEDDING_MODEL` | Modelo de embeddings (por defecto `gemini-embedding-2`) |
| `EMBEDDING_DIMENSIONS` | Dimensión de los vectores (3072 para `gemini-embedding-2`) |
| `LLM_PROVIDER` | Proveedor LLM (solo `gemini` por ahora) |
| `DATABASE_URL` | Conexión a PostgreSQL (usada por pgvector) |
| `REDIS_URL` | Conexión a Redis para el caché |
| `VECTOR_STORE` | Base vectorial: `pgvector` (por defecto) o `pinecone` |
| `PINECONE_API_KEY` | Clave de API de Pinecone (requerida si `VECTOR_STORE=pinecone`) |
| `PINECONE_INDEX` | Nombre del índice de Pinecone (por defecto `eduai`, se auto-crea si no existe) |
| `PINECONE_CLOUD` | Nube del índice serverless (por defecto `aws`) |
| `PINECONE_REGION` | Región del índice serverless (por defecto `us-east-1`) |
| `PINECONE_METRIC` | Métrica de distancia (por defecto `cosine`) |
| `REDIS_CACHE_TTL_SECONDS` | TTL de las respuestas cacheadas (3600 s) |
| `RETRIEVAL_TOP_K` | Cantidad de fragmentos recuperados por consulta (5) |

**`conftest.py`** — Archivo especial de pytest ubicado en la raíz. Setea variables de entorno de prueba (`GEMINI_API_KEY=test-key`, etc.) antes de que se importe `settings.py`, para que los tests corran sin `.env` real. Además, al estar en la raíz, permite importar el paquete `src.*` desde los tests.

**`pyproject.toml`** — Configuración declarativa de herramientas:
- `[tool.pytest.ini_options]`: `testpaths` apunta a `src/tests`, `asyncio_mode = "auto"` (los tests asíncronos corren sin decoradores extra) y `addopts = "-q"`.
- `[tool.ruff]`: linter con `line-length = 100`, `select = ["E", "F", "I", "W"]` (errores, no-usados, imports, warnings). Se ignora `E501` en `src/prompts/*` porque ahí el contenido son prompts de texto, no código.

**`requirements.txt`** — Dependencias de producción: `fastapi`, `uvicorn[standard]`, `pydantic-settings`, `google-genai` (cliente de Gemini), `structlog` (logging JSON), `redis`, `asyncpg` + `pgvector` (base vectorial local), `pinecone` (base vectorial gestionada), `pypdf`, `python-docx`, `python-pptx` (extracción de texto de documentos).

**`requirements-dev.txt`** — Herramientas de desarrollo: `pytest`, `pytest-asyncio`, `httpx` (para `TestClient`) y `ruff`.

**`Dockerfile`** — Imagen basada en `python:3.12-slim`. Instala `requirements.txt`, copia el código y arranca con `uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload`.

---

### Config de la aplicación (`src/config/`)

**`src/config/__init__.py`** — Vacío. Marca el directorio como paquete Python.

**`src/config/settings.py`** — Define la clase `Settings` (hereda de `BaseSettings` de pydantic-settings) con **todos** los parámetros del servicio y sus valores por defecto. Lee de la variable de entorno y/o del archivo `.env`. Se instancia una vez como `settings` y se importa en todo el proyecto. Es la fuente única de verdad de la configuración: si falta una variable obligatoria, la app falla explícitamente al arrancar (regla de oro del proyecto: nada hardcodeado).

**`src/config/genai.py`** — Función `get_genai_client(api_key)` que devuelve un **cliente único y compartido** de Gemini (`genai.Client`). Se usa un patrón singleton (variable `_client` a nivel de módulo) para no crear una conexión por cada servicio que la necesita.

---

### Prompts (`src/prompts/`)

Los prompts están separados del código porque cambian con frecuencia durante el desarrollo. Cada archivo exporta un `SYSTEM_PROMPT` (o una función que lo construye).

- **`src/prompts/__init__.py`** — Vacío. Marca el paquete.
- **`src/prompts/tutor.py`** — Prompt del **modo normal** (CU-A04). Instruye al modelo a responder *solo* con el material provisto en el contexto, de forma didáctica y citando el material; si no tiene la información, debe decirlo y no inventar.
- **`src/prompts/socratic.py`** — Prompt del **modo estudio** (CU-A09). Prohíbe dar la respuesta directa: obliga a guiar al alumno con una pregunta a la vez hasta que descubra la respuesta por sí mismo.
- **`src/prompts/hints.py`** — Prompt del **modo pistas** (CU-A06). Prohíbe revelar la respuesta completa; entrega pistas progresivas.
- **`src/prompts/exam.py`** — Prompt del **modo simulacro** (CU-A08). Exige devolver un JSON con un esquema fijo de preguntas (`multiple_choice`/`desarrollo`), opciones y respuesta.
- **`src/prompts/summary.py`** — Función `build_summary_prompt(language, max_words)` que arma el prompt de resumen estructurado (CU-A05) con el idioma y la extensión pedidos.

---

### Schemas (`src/schemas/`)

**`src/schemas/__init__.py`** — Vacío. Marca el paquete.

**`src/schemas/tutor.py`** — Define con Pydantic los **contratos de entrada y salida** de cada endpoint. Son el "idioma" entre el backend de Node.js y este servicio. Modelos:
- `TutorMode` (enum): `normal`, `socratic`, `hints`.
- `ChatMessage`: mensaje de historial (`user`/`assistant` + contenido).
- `TutorRequest`: entrada de `/tutor/chat` (subject, pregunta, modo, historial, `max_tokens`, `temperature`).
- `Source`: fragmento del material usado como fuente (con score de similitud).
- `TutorResponse`: respuesta del chat (texto, modo, fuentes, prompt depurado, tokens ahorrados, `cached`).
- `SummaryRequest`/`SummaryResponse`: entrada/salida de `/tutor/resumen`.
- `ExamRequest`/`ExamQuestion`/`ExamResponse`: entrada/salida de `/tutor/examen`.
- `IndexMaterialRequest`/`IndexMaterialResponse`: entrada/salida de indexación RAG.
- `DepurarPromptRequest`/`DepurarPromptResponse`: entrada/salida de `/tutor/depurar`.

---

### Servicios (`src/services/`)

Capa que encapsula el acceso a los **recursos externos**. No saben nada de HTTP.

**`src/services/__init__.py`** — Vacío. Marca el paquete.

**`src/services/llm_service.py`** — Envuelve la API de Gemini:
- `generate(...)` → respuesta completa (no stream).
- `stream(...)` → generador asíncrono que va cediendo los tokens de a uno (SSE).
- Construye los `types.Content`/`types.GenerateContentConfig` (system instruction, temperatura, max tokens) requeridos por la API.
- Valida que `LLM_PROVIDER` sea `gemini` y loguea errores con structlog. **Si mañana se cambia a otro proveedor, solo se toca este archivo.**

**`src/services/embeddings_service.py`** — Convierte texto en vectores usando el modelo de embeddings configurado:
- `embed_documents(texts)` → usa `task_type="RETRIEVAL_DOCUMENT"` (indexación).
- `embed_query(text)` → usa `task_type="RETRIEVAL_QUERY"` (consultas).
- Ambos usan el mismo cliente compartido de `config/genai.py`.

**`src/services/retrieval_service.py`** — Acceso a **pgvector** (PostgreSQL):
- Crea el pool `asyncpg` y registra el tipo `vector` en cada conexión (`init=register_vector`). Primero se asegura de que exista la extensión `vector` (sin eso, `register_vector` falla con `unknown type: public.vector`).
- Crea la tabla `ai_materials` (id, subject_id, material_id, chunk_index, content, embedding) e índices: por `subject_id` y HNSW por coseno.
- `upsert_chunks(...)` → inserta/actualiza los fragmentos con su embedding.
- `delete_material(...)` → borra un material (útil para re-indexar).
- `search(subject_id, embedding, top_k)` → recupera los `top_k` fragmentos más similares por coseno (`1 - (embedding <=> $vector)`), filtrados por materia.

**`src/services/pinecone_service.py`** — Acceso a **Pinecone** (serverless) con **la misma interfaz** que `retrieval_service`:
- `_ensure_index()` → crea el cliente Pinecone y, si el índice no existe, lo **crea solo** (`create_index` serverless con `ServerlessSpec(cloud, region)` y dimensiones = `EMBEDDING_DIMENSIONS`), esperando a que esté listo.
- Usa un **namespace por `subject_id`** (las consultas de una materia solo ven sus vectores).
- Guarda `material_id`, `chunk_index` y el texto del fragmento en los **metadatos** de cada vector (id `material_id:chunk_index`).
- `upsert_chunks(...)` → sube los vectores en lotes de 100.
- `delete_material(...)` → borra por filtro de `material_id` dentro del namespace.
- `search(subject_id, embedding, top_k)` → `query` con `include_metadata=True` y mapea los matches a los mismos dicts que pgvector.
- `close()` → cierra el cliente Pinecone.

**`src/services/vector_store.py`** — Factory `build_retrieval_service()`: lee `settings.vector_store` y devuelve `RetrievalService` (pgvector) o `PineconeRetrievalService`. Si es `pinecone` y falta `PINECONE_API_KEY`, falla explícitamente al arrancar. Es lo que `main.py` usa para que los casos de uso no sepan con qué base vectorial trabajan.

**`src/services/cache_service.py`** — Caché en Redis con TTL:
- `initialize()` prueba la conexión; **si Redis no está disponible, degrada silenciosamente** (loguea warning y deja el caché desactivado en vez de romper la app).
- `get`/`set` con TTL configurable. Encapsula las claves (el resto del código no sabe cómo se formatean).

**`src/services/chunking_service.py`** — Divide textos largos en fragmentos aptos para embedding/contexto:
- `estimate_tokens(text)` → aproximación de tokens (`len // 4`, independiente del modelo).
- `chunk_text(text, max_tokens, overlap_tokens)` → fragmenta por oraciones con solapamiento controlado.

**`src/services/document_service.py`** — Extrae texto plano de archivos: PDF (`pypdf`), DOCX (`python-docx`), PPTX (`python-pptx`) y TXT. Detecta el tipo por extensión y, si falla, por el magic number (ej. `%PDF`). Nunca lanza: devuelve `""` y loguea.

**`src/services/prompt_sanitizer.py`** — Depuración de prompts (CU-SYS01):
- `sanitize_prompt(prompt)` → elimina saludos iniciales, muletillas ("o sea", "tipo", "este"...), caracteres repetidos y puntuación duplicada. Devuelve `(prompt_depurado, tokens_ahorrados)`.

---

### Casos de uso (`src/use_cases/`)

Capa que **orquesta los servicios** para resolver un problema completo. No saben nada de HTTP.

**`src/use_cases/__init__.py`** — Vacío. Marca el paquete.

**`src/use_cases/_helpers.py`** — Utilidades compartidas:
- `format_context(results)` → arma el bloque "CONTEXTO" legible para el prompt.
- `build_sources(results)` → convierte resultados crudos de la búsqueda en `Source`.
- `normalize_messages(messages)` → garantiza que el historial comience con `user` y sin roles consecutivos repetidos (requisito de la API de Gemini).
- `cache_key(subject, mode, question)` → hash determinista para el caché.

**`src/use_cases/ask_tutor.py`** — El corazón del tutor (CU-A04). Flujo (`execute`):
1. Depura el prompt (`prompt_sanitizer`).
2. Revisa el **caché** de Redis por la misma pregunta; si hay hit, responde sin llamar al LLM.
3. Genera el embedding de la pregunta (`embeddings_service.embed_query`).
4. Recupera los fragmentos más relevantes de la materia (`retrieval_service.search`).
5. Arma los mensajes con el sistema prompt del modo elegido + contexto + consulta.
6. Llama al LLM (`llm_service.generate`) o streamea (`stream`, que devuelve eventos `token`/`done` para SSE).
7. Guarda la respuesta en caché.

**`src/use_cases/index_material.py`** — Pipeline RAG de indexación: recibe el texto de un material → lo fragmenta (`chunking`) → borra la versión anterior → genera embeddings (`embed_documents`) → persiste (`upsert_chunks`).

**`src/use_cases/resumir_documento.py`** — Resumen de documentos (CU-A05): si el documento es corto, un único resumen estructurado; si es largo, resume por partes y luego combina.

**`src/use_cases/examen.py`** — Simulacro de examen (CU-A08): recupera contexto, genera con el prompt de examen y **parsea la respuesta JSON** del modelo en un `ExamResponse` (con limpieza de fences ``` ``` ```).

**`src/use_cases/depurar_prompt.py`** — Envuelve `sanitize_prompt` y devuelve el reporte completo (original, depurado, tokens originales/depurados/ahorrados) para registrarlo en `mensajes_ia`.

---

### Routers (`src/routers/`)

Capa HTTP. Reciben la petición, la validan con los schemas, llaman al caso de uso y formatean la respuesta.

**`src/routers/__init__.py`** — Vacío. Marca el paquete.

**`src/routers/tutor_router.py`** — Endpoints del tutor:
- `POST /tutor/chat` → chat completo.
- `POST /tutor/chat/stream` → SSE en tiempo real (`text/event-stream`).
- `POST /tutor/resumen` → resumen de documento.
- `POST /tutor/examen` → simulacro de examen.
- `POST /tutor/depurar` → depuración de prompts.
Los casos de uso se toman de `request.app.state` (inyectados en `main.py`). Los errores del LLM se traducen a `502` y los de validación a `400`.

**`src/routers/rag_router.py`** — Endpoints de indexación:
- `POST /rag/material` → indexa un material (texto extraído) para que el tutor tenga contexto.
- `DELETE /rag/material/{subject_id}/{material_id}` → elimina un material indexado.

---

### Punto de entrada (`src/main.py`)

- Configura **structlog** en formato JSON estructurado hacia stdout (para Docker/Railway).
- `create_app()` → crea la app FastAPI e incluye ambos routers.
- `lifespan` → **inyecta las dependencias** en `app.state`: crea los servicios, los casos de uso y los deja disponibles para los routers. Al cerrar, cierra caché y pool de la base.
- Expone `GET /healthz` para los healthchecks.

> **Nota sobre los nombres:** `tutor_router.py` y `rag_router.py` usan guión bajo (no `tutor.router.py`) porque Python no permite importar archivos con nombre punteado.

---

### Tests (`src/tests/`)

> El `conftest.py` que setea las variables de entorno de los tests vive en la raíz de `ai-services/` (no en `src/tests/`), para que los tests puedan importar el paquete `src.*`.

- **`fakes.py`** — Implementaciones falsas de `LLM`, `Embeddings`, `Retrieval` y `Cache` para probar la lógica sin llamadas externas ni base de datos.
- **`test_chunking.py`** — Prueba `chunk_text`: documentos cortos/largos, entrada vacía, normalización de espacios.
- **`test_prompt_sanitizer.py`** — Prueba la depuración: saludos, muletillas, puntuación repetida, prompts vacíos.
- **`test_ask_tutor.py`** — Prueba el caso de uso completo con fakes: respuesta + fuentes, **segunda llamada servida desde caché**, y el streaming (tokens + evento done).
- **`test_router.py`** — Prueba los endpoints HTTP con `TestClient` y fakes: `/healthz`, `/tutor/chat`, validación 422, `/tutor/chat/stream` (formato SSE) y `/tutor/depurar`.
- **`test_pinecone_service.py`** — Prueba `PineconeRetrievalService` con un cliente Pinecone falso: auto-creación del índice serverless, no recreación si existe, metadatos/namespace en upsert, mapeo de matches en search, delete por filtro y `close()`.
- **`test_vector_store.py`** — Prueba la factory: devuelve el tipo correcto según `VECTOR_STORE`, exige `PINECONE_API_KEY` en modo pinecone y rechaza valores desconocidos.

---

## 3. Cómo se conectan entre sí

```
                    ┌─────────────────────────────────────────────────┐
                    │              src/main.py (FastAPI)              │
                    │  create_app() → registra routers                │
                    │  lifespan() → inyecta servicios y casos de uso  │
                    └────────────┬──────────────────┬─────────────────┘
                                 │                  │
                     HTTP        │                  │  app.state.*
              ┌──────────────────▼──────┐   ┌───────▼─────────────────┐
              │     routers/            │   │    use_cases/           │
              │  tutor_router.py        │──►│  ask_tutor.py           │
              │  rag_router.py          │   │  index_material.py      │
              │  (validan con schemas)  │   │  resumir_documento.py   │
              └──────────┬──────────────┘   │  examen.py              │
                         │ schemas/tutor.py │  depurar_prompt.py      │
                         └──────────────────┴───┬───────────┬─────────┘
                                                │           │
                                ┌───────────────▼───┐   ┌───▼───────────────┐
                                │    services/      │   │    prompts/       │
                                │ llm_service ──────┼──►│ tutor/socratic/   │
                                │ embeddings_service│   │ hints/exam/summary│
                                │ retrieval_service │   └───────────────────┘
                                │ cache_service     │
                                │ chunking_service  │
                                │ document_service  │
                                │ prompt_sanitizer  │
                                └───┬─────────┬─────┘
                                    │         │
                    ┌───────────────▼───┐   ┌─▼──────────────┐
                    │  Gemini API       │   │  pgvector  ◄───┼──┐
                    │  (LLM + embeddings)│  │  o Pinecone    │  │ VECTOR_STORE
                    └───────────────────┘   │  Redis         │  │
                                            └────────────────┘◄─┘
```

**Flujo de una consulta al tutor (`/tutor/chat`):**

1. `tutor_router` recibe la petición y la valida contra `TutorRequest`.
2. Llama a `AskTutorUseCase.execute()`.
3. El caso de uso verifica **Redis** (caché) → si existe la misma respuesta, la devuelve sin gastar tokens.
4. Si es cache miss: depura el prompt → `embeddings_service` convierte la pregunta en vector → el vector store elegido por `VECTOR_STORE` (`vector_store.py`) busca en **pgvector o Pinecone** los fragmentos de la materia → arma el mensaje con el prompt del modo (`prompts/*`) + contexto → `llm_service` llama a **Gemini** → guarda la respuesta en caché.
5. Devuelve `TutorResponse` (respuesta + fuentes usadas + metadatos de depuración).

**Flujo de indexación (`POST /rag/material`):**

1. `rag_router` recibe subject + material + texto (extraído previamente por el backend con `document_service` o ya en texto).
2. `IndexMaterialUseCase` fragmenta el texto → genera embeddings → los persiste en el vector store configurado (pgvector o Pinecone, en el namespace de la materia).
3. A partir de ahí el material queda disponible para las consultas del tutor.

---

## 4. Endpoints disponibles

| Método | Ruta | Descripción | Caso de uso |
|---|---|---|---|
| GET | `/healthz` | Healthcheck | — |
| POST | `/tutor/chat` | Consulta contextualizada al tutor | CU-A04 |
| POST | `/tutor/chat/stream` | Ídem, en streaming SSE | CU-A04 |
| POST | `/tutor/resumen` | Resumen estructurado de un documento | CU-A05 |
| POST | `/tutor/examen` | Simulacro de examen en JSON | CU-A08 |
| POST | `/tutor/depurar` | Depuración de prompt con reporte de tokens | CU-SYS01 |
| POST | `/rag/material` | Indexa material para el tutor | RAG pipeline |
| DELETE | `/rag/material/{subject}/{material}` | Elimina material indexado | RAG pipeline |

Los modos de estudio (`normal`, `socratic`, `hints`) se eligen con el campo `mode` de `/tutor/chat`.

---

## 5. Casos de uso cubiertos

- **CU-A04** — Consultar Tutor IA en lenguaje natural contextualizado por materia (modos `normal`, `socratic`, `hints`).
- **CU-A05** — Solicitar resumen de un documento al tutor.
- **CU-A06** — Solicitar pistas sin revelar la respuesta (`mode: "hints"`).
- **CU-A08** — Generar simulacro de examen.
- **CU-A09** — Modo estudio con metodología socrática (`mode: "socratic"`).
- **CU-SYS01** — Depurar el prompt de usuario.

---

## 6. Cómo ejecutarlo

```bash
# 1) Copiar la plantilla y completar la clave
cp .env.example .env          # en Windows: copy .env.example .env

# 2) Elegir base vectorial (por defecto pgvector)
#    Para usar Pinecone: VECTOR_STORE=pinecone + PINECONE_API_KEY (y cloud/región)
#    El índice se crea solo la primera vez.

# 3) Con Docker (recomendado)
docker compose up --build ai-service

# 4) Sin Docker (local, con Python 3.12+)
pip install -r requirements.txt -r requirements-dev.txt
uvicorn src.main:app --reload --port 8000
```

La documentación interactiva (Swagger) queda en `http://localhost:8000/docs`.

---

## 7. Testeo

```bash
ruff check src conftest.py     # linter
pytest                         # 27 tests
```
