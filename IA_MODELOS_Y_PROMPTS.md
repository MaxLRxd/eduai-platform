# EduAI · IA usada, modelos, prompts y decisiones de desarrollo

Documento de referencia del proyecto EduAI que explica **qué IA se utilizó**, **qué modelos**, **los prompts que gobiernan cada funcionalidad** y **las decisiones técnicas tomadas a lo largo del desarrollo**.

> Código fuente de referencia: `ai-services/` (servicio de IA) · `backend/` (API Node) · `frontend/` (React).

---

## 1. Resumen ejecutivo

- **Proveedor de IA:** Google **Gemini** (Google AI Studio / Gemini API).
- **LLM de chat (generación de texto):** `gemini-3.6-flash` (configurable con `GEMINI_MODEL`).
- **Modelo de embeddings:** `gemini-embedding-2` (3072 dimensiones, configurable con `GEMINI_EMBEDDING_MODEL`).
- **Patrón central:** **RAG (Retrieval-Augmented Generation)** — el modelo solo genera basándose en el material oficial de la cátedra, indexado en una base vectorial. Las respuestas incluyen las **fuentes** del material usado.
- **Bases vectoriales soportadas:** `pgvector` (PostgreSQL, por defecto) o `Pinecone` (se elige con `VECTOR_STORE`).
- **Caché:** Redis (TTL 1 hora por defecto) con **degradación silenciosa** (si no hay Redis, la app sigue funcionando sin caché).
- **Servicio:** microservicio Python **FastAPI** (`ai-services/`) que el backend de Node.js consume por HTTP vía `AI_SERVICE_URL`.

---

## 2. Modelos configurados

Valores actuales en `ai-services/src/config/settings.py`:

| Variable | Valor por defecto | Uso |
|---|---|---|
| `GEMINI_API_KEY` | *(obligatoria, va en `.env`)* | Autenticación ante la API de Gemini |
| `GEMINI_MODEL` | `gemini-3.6-flash` | LLM de chat (texto) |
| `GEMINI_EMBEDDING_MODEL` | `gemini-embedding-2` | Convierte texto → vector |
| `EMBEDDING_DIMENSIONS` | `3072` | Dimensiones del vector (debe coincidir con el modelo) |
| `LLM_PROVIDER` | `gemini` | Único proveedor soportado por ahora |

Elección de modelo y justificación:

- **`gemini-3.6-flash`** — se priorizó un modelo *flash* por **latencia y costo**, apropiado para el volumen esperado de consultas de estudiantes y docentes. El nombre se mantiene **centralizado en `settings.py`** para poder cambiarlo sin tocar código.
- **`gemini-embedding-2`** — embeddings de alta dimensión (3072) que dan buena separación semántica del material educativo.

### Cómo se llama a Gemini (capa única de abstracción)

`ai-services/src/config/genai.py` mantiene un **cliente singleton** compartido (`genai.Client`) para no abrir una conexión por servicio. `ai-services/src/services/llm_service.py` es la **única capa que habla con la API**: expone `generate()` (respuesta completa) y `stream()` (generador de tokens para SSE). Si mañana se migra a otro proveedor, solo se tocaría ese archivo.

Los embeddings se generan en `embeddings_service.py` con el `task_type` correcto según el contexto:

- `RETRIEVAL_DOCUMENT` → al indexar material (`embed_documents`).
- `RETRIEVAL_QUERY` → al hacer una consulta (`embed_query`).

---

## 3. Arquitectura RAG

### Indexación (pipeline)

`ai-services/src/use_cases/index_material.py` + `POST /rag/material`:

1. El backend de Node extrae el texto del contenido publicado y lo envía al ai-service.
2. `ChunkingService.chunk_text()` divide el texto en **fragmentos por oraciones** con **solapamiento** (por defecto `max_tokens=500`, `overlap=50`), normalizando espacios.
3. Se genera un embedding por fragmento (`task_type=RETRIEVAL_DOCUMENT`).
4. Los vectores se persisten en el vector store elegido:
   - **pgvector** (`retrieval_service.py`): tabla `ai_materials`, índice HNSW por coseno, `ON CONFLICT DO UPDATE` para re-indexar.
   - **Pinecone** (`pinecone_service.py`): **namespace por materia** (`subject_id`), el índice se auto-crea la primera vez.

### Recuperación

`RetrievalService.search(subject_id, embedding, top_k=5)`:

```sql
SELECT material_id, chunk_index, content, 1 - (embedding <=> $2::vector) AS score
FROM ai_materials
WHERE subject_id = $1
ORDER BY embedding <=> $2::vector
LIMIT 5
```

- **Filtrado estricto por materia**: una consulta del tutor de "Matemática" nunca ve material de "Historia".
- `RETRIEVAL_TOP_K` por defecto `5` fragmentos (configurable).
- Con `format_context()` los fragmentos se convierten en un bloque `CONTEXTO (material de la cátedra)` que se inyecta en el prompt del usuario.

### Caché

`cache_service.py` — Redis con TTL configurable (`REDIS_CACHE_TTL_SECONDS`, 3600 s). La clave es un hash determinista `(subject, modo, pregunta)`. Un *cache hit* responde **sin gastar tokens**. Si Redis no está disponible, loguea un warning y **degradar en silencio** (nunca rompe la app).

---

## 4. Principios que gobiernan todos los prompts

Estas reglas son transversales a todos los casos de uso y se repiten en cada system prompt:

1. **Responder solo sobre el CONTEXTO** provisto (material oficial). Si la respuesta no está en el contexto, el modelo debe **decirlo** y está **prohibido inventar contenido** (anti-alucinación).
2. **Idioma rioplatense informal** y *vos* ("Sos el tutor IA de EduAI", "Respondé…", "Basate…") para naturalidad en el aula.
3. **Bloque `CONTEXTO (...)`** en el mensaje de usuario (no en el sistema) con el material recuperado por RAG.
4. **Separación system/user**: el *system prompt* fija rol, personalidad, idioma y reglas duras; el mensaje de *usuario* lleva los datos dinámicos (contexto, pregunta, consigna, entrega…).
5. **Contratos estrictos** cuando se necesita salida estructurada: el modelo devuelve **solo JSON** con un esquema fijo, se limpian *fences* (<code>```</code>) y se parsea/valida del lado del servidor.
6. **Nunca revelar información personal** de otros usuarios ni datos confidenciales.

---

## 5. Los prompts del proyecto

Todos viven en `ai-services/src/prompts/`, separados del código porque **cambian con frecuencia** durante el desarrollo. Cada funcionalidad tiene su propio system prompt; se listan a continuación con su rol, reglas y archivo.

### 5.1 Tutor IA · modo normal — `prompts/tutor.py` (CU-A04)

```python
SYSTEM_PROMPT = """Sos el tutor IA de EduAI, un campus educativo virtual. Tu función es ayudar a los alumnos a estudiar y comprender los contenidos de su cátedra.

Reglas:
- Respondé únicamente en base al CONTEXTO provisto (material oficial de la materia). Si la respuesta no se encuentra en el contexto, indicá que no contás con esa información en el material y no inventes contenidos.
- Explicá de forma didáctica, clara y concisa, adaptándote al nivel del alumno.
- Cuando sea posible, citá el material del que proviene la respuesta.
- Nunca reveles información personal de otros usuarios ni datos confidenciales.
- Si la consulta no se relaciona con la materia, respondé con amabilidad que tu función se limita al contenido de la cátedra.
- Respondé siempre en el idioma en el que consulta el alumno.
"""
```

### 5.2 Tutor IA · modo estudio socrático — `prompts/socratic.py` (CU-A09)

```python
SYSTEM_PROMPT = """Sos el tutor IA de EduAI en MODO ESTUDIO (metodología socrática).

Reglas:
- No des la respuesta directa al alumno. Guiá su razonamiento mediante preguntas que lo lleven a descubrir la respuesta por sí mismo.
- Hacé una sola pregunta a la vez y esperá la respuesta del alumno.
- Basate exclusivamente en el CONTEXTO provisto (material de la cátedra). Si el material no alcanza para guiar, indicálo con honestidad.
- Usá un tono paciente y motivador; reconocé los aciertos del alumno.
- Adaptá el nivel de dificultad de las preguntas según el progreso del alumno.
- Respondé siempre en el idioma en el que consulta el alumno.
"""
```

### 5.3 Tutor IA · modo pistas — `prompts/hints.py` (CU-A06)

```python
SYSTEM_PROMPT = """Sos el tutor IA de EduAI en MODO PISTAS.

Reglas:
- Nunca reveles la respuesta completa al alumno.
- Ofrecé pistas progresivas: comenzá con una pista general y aumentá el detalle solo si el alumno lo pide o se queda trabado.
- Guiá el razonamiento paso a paso sin dar el resultado final.
- Basate exclusivamente en el CONTEXTO provisto (material de la cátedra).
- Al final de cada respuesta, preguntá si quiere otra pista o si prefiere que profundices en algún paso.
- Respondé siempre en el idioma en el que consulta el alumno.
"""
```

### 5.4 Resumen de documentos — `prompts/summary.py` (CU-A05)

Prompt **parametrizado** por función (`build_summary_prompt(language, max_words)`): idioma y extensión se inyectan desde el pedido del alumno.

```python
f"""Sos el tutor IA de EduAI. Generá un resumen estructurado del documento provisto.

Formato de la respuesta:
- Resumen general (máximo {max_words} palabras)
- Conceptos clave (lista con viñetas)
- Puntos importantes a recordar (lista con viñetas)
- Preguntas de repaso sugeridas (lista de 2 o 3 preguntas)

Reglas:
- Sé fiel al contenido del documento: no agregues información que no esté presente.
- Escribí el resumen en el idioma "{language}".
"""
```

El caso de uso (`use_cases/resumir_documento.py`) aplica una técnica de **map-reduce**: documentos largos se resumen por partes (`temperature=0.3, max_tokens=800`) y luego se combinan en un resumen final (`temperature=0.3, max_tokens=max_words*4+400`).

### 5.5 Simulacro de examen — `prompts/exam.py` (CU-A08)

Exige un **JSON con esquema fijo** (contrato de salida estructurada):

```python
SYSTEM_PROMPT = """Sos el tutor IA de EduAI en MODO SIMULACRO DE EXAMEN.

Reglas:
- Generá un simulacro de examen basado únicamente en el CONTEXTO provisto (material de la cátedra).
- Devolvé el resultado como un único objeto JSON válido con este esquema:
{"titulo": "...", "dificultad": "...", "preguntas": [{"tipo": "multiple_choice" | "desarrollo", "enunciado": "...", "opciones": ["...", "..."], "respuesta": "..."}]}
- En preguntas de tipo "multiple_choice" incluye 4 opciones y en "respuesta" el texto de la opción correcta.
- En preguntas de tipo "desarrollo" "opciones" debe ir vacío y "respuesta" debe contener una guía breve de corrección.
- Variá los tipos de pregunta y hacé que progresen en dificultad.
- No incluyas ningún texto fuera del JSON.
"""
```

Generación: `temperature=0.5, max_tokens=4096`. El parseo (`examen.py`) limpia *code fences* y valida contra `ExamResponse`.

### 5.6 Asistente docente (generación de material) — `prompts/material.py` (CU-A09, agregado en esta fase)

Conecta la pantalla de IA del profesor: genera actividades, consignas, preguntas y material didáctico **contextualizado con el material indexado de la materia y la planificación de esa clase** (que el backend inyecta en el prompt cuando hay `class_date`).

```python
SYSTEM_PROMPT = """Sos el asistente docente de EduAI, un campus educativo virtual. Ayudás a los profesores a preparar sus clases y material didáctico.

Reglas:
- Basate en el CONTEXTO provisto (material de la cátedra y planificación de la clase). Si hace falta información que no esté en el contexto, indicá que no contás con ella y no la inventes.
- Seguí el pedido del docente: puede pedir actividades, preguntas, resúmenes, consignas, apoyo visual, momentos de clase, etc.
- Si el pedido menciona una clase concreta, usá la planificación de esa clase para contextualizar.
- Escribí en español, con estructura clara (títulos, viñetas, pasos) y listo para copiar y usar en el aula.
- No reveles información personal de otros usuarios ni datos confidenciales.
"""
```

Uso (RAG): `embed_query(prompt del docente)` → se recuperan los fragmentos de la materia → se arma el contexto. `temperature=0.6, max_tokens=4096`. Endpoint: `POST /tutor/generar-material`, consumido por el backend en `POST /api/asistente/generar`.

### 5.7 Auto-correction Engine (corrección de entregas) — `prompts/correccion.py` (CU-A13, agregado en esta fase)

Cierra el flujo de entregas: el backend manda consigna, entrega del alumno, rúbrica (criterios con peso) y el contexto del material; el modelo devuelve **feedback + calificación 0-10** en JSON.

```python
SYSTEM_PROMPT = """Sos el Auto-correction Engine de EduAI. Corregís entregas de alumnos en base a la consigna, la rúbrica y el material de la cátedra.

Reglas:
- Evaluá la entrega contra CADA criterio de la rúbrica respetando sus pesos.
- El CONTEXTO provisto es el material oficial de la cátedra; usalo como referencia de lo que debía saberse. No corrijas más allá de la consigna.
- Calificación: número entre 0 y 10 (escala argentina), calculada como suma ponderada de los puntajes de la rúbrica.
- Feedback: en español, claro, con viñetas por criterio, señalando logros y aspectos a mejorar. No inventes información que no aparezca en la entrega.
- Devolvé el resultado como un único objeto JSON válido con este esquema:
{"feedback": "texto en español con viñetas por criterio", "calificacion": 8.5, "detalle_por_criterio": [{"nombre": "...", "puntaje": 8.5, "comentario": "..."}]}
- La "calificacion" debe ser un número, no un string. No incluyas ningún texto fuera del JSON.
"""
```

Detalles del caso de uso (`use_cases/correct_submission.py`):

- Si la actividad no tiene rúbrica, usa una **rúbrica por defecto**: Recuperación del contenido (40%) · Claridad y organización (30%) · Cumplimiento de la consigna (30%).
- La calificación se **recorta a `[0, 10]`** y se redondea a 2 decimales (defensa ante valores fuera de rango).
- `temperature=0.2` (bajo, porque esto es evaluación y queremos consistencia), `max_tokens=2048`.
- Endpoint: `POST /tutor/corregir-entrega`, consumido por el backend en `GET /api/entregas/:entregaId/correccion-ia`.

### 5.8 Depuración de prompts — `prompts` no aplica, es en `services/prompt_sanitizer.py` (CU-SYS01)

No es un prompt al LLM sino un **preprocesamiento determinista** del texto del alumno para **ahorrar tokens y evitar ruido**:

- Elimina saludos iniciales ("hola", "buenas tardes"…) y muletillas ("o sea", "tipo", "este"…).
- Normaliza caracteres repetidos ("holaaaa" → "hola") y puntuación duplicada ("!!!" → "!").
- Devuelve `(prompt_depurado, tokens_ahorrados)`; el reporte se guarda en la sesión (`/tutor/depurar`).

---

## 6. Parámetros de generación por caso de uso

| Caso de uso | Endpoint (ai-service) | Temperature | Max tokens | Salida |
|---|---|---|---|---|
| Chat tutor (normal/socrático/pistas) | `POST /tutor/chat` (+`/stream` SSE) | pedida por el alumno, default `0.7` | default `1024` | texto + fuentes |
| Resumen de documento | `POST /tutor/resumen` | `0.3` | `max_words*4+400` | texto estructurado |
| Simulacro de examen | `POST /tutor/examen` | `0.5` | `4096` | JSON validado |
| Asistente docente (material) | `POST /tutor/generar-material` | `0.6` | `4096` | texto + fuentes |
| Auto-correction (entregas) | `POST /tutor/corregir-entrega` | `0.2` | `2048` | JSON validado |

Lógica de elección de temperatura: **chat** y **material** buscan creatividad/didáctica (media-alta); **resumen** y **corrección** buscan fidelidad/consistencia (baja); **examen** intermedia.

---

## 7. Decisiones de diseño clave tomadas durante el desarrollo

### D1. Microservicio de IA separado en Python (FastAPI)
**Decisión:** la IA vive en `ai-services/` (Python/FastAPI), no dentro del backend Node.
**Por qué:** ecosistema maduro de IA en Python (clientes nativos de Gemini, pgvector, Pinecone); desacopla el LLM y el RAG del backend transaccional; el backend lo consume por HTTP a través de `AI_SERVICE_URL`, sin conocer su implementación (contrato = schemas Pydantic).

### D2. RAG como base del tutor, no LLM "a secas"
**Decisión:** toda respuesta se genera sobre el material oficial indexado de la materia (`CONTEXTO`), filtrando estrictamente por `subject_id`.
**Por qué:** es la decisión que garantiza **veracidad y trazabilidad** (cada respuesta cita sus `sources`), evita alucinaciones y hace que la herramienta sea defenderible en un entorno educativo.

### D3. Prompts separados del código + system prompt por funcionalidad
**Decisión:** `src/prompts/*.py`, un archivo por caso de uso.
**Por qué:** el ajuste de prompts es la actividad que más veces se itera; separarlos evita recompilar/reescribir lógica y permite revisarlos como "texto".

### D4. Contratos JSON estrictos para salidas estructuradas
**Decisión:** examen y corrección piden al modelo *"devolvé únicamente el JSON"* con esquema declarado, y el servidor limpia *fences* y **valida contra Pydantic**; en corrección además se clampea la nota a `[0,10]`.
**Por qué:** el LLM no es un sistema de tipos; validar del lado del servidor evita que una respuesta malformada rompa la API del backend.

### D5. Streaming SSE para el chat
**Decisión:** `/tutor/chat/stream` emite eventos `token`/`done` (`text/event-stream`) y el backend Node lo re-expone.
**Por qué:** latencia perceptible en educación; escribir en vivo mejora la experiencia y sigue el patrón *streaming-first*.

### D6. Caché en Redis con degradación silenciosa
**Decisión:** respuestas idénticas se sirven desde caché (hash `subject:modo:pregunta`, TTL 1 h). Si Redis falla, la app sigue funcionando sin caché (solo loguea).
**Por qué:** ahorro de tokens/costo y menor latencia; resiliencia por defecto en un servicio donde el caché es una optimización, no una dependencia crítica.

### D7. Sanitización de prompts para ahorrar tokens
**Decisión:** CU-SYS01 (`prompt_sanitizer.py`) limpia saludos/muletillas/redundancias antes de gastar contexto.
**Por qué:** los tokens cuestan; además reduce el ruido que degrada la calidad de la recuperación.

### D8. Modos de estudio distintos como un solo endpoint
**Decisión:** `mode: normal | socratic | hints` con un system prompt por modo en el mismo `POST /tutor/chat`.
**Por qué:** tres pedagogías autónomas (explicar, guiar, dar pistas) comparten toda la infraestructura RAG/caché/streaming; no se multiplican endpoints ni casos de uso.

### D9. Estrategia *mock-first* y conexión tardía al LLM
**Decisión:** las pantallas y el flujo se construyeron primero con **mocks** en frontend/backend, y los endpoints reales del ai-service se conectaron en fases: chat/resumen/examen primero; luego **asistente docente** y **Auto-correction Engine** (que estaban como *stubs* listos).
**Por qué:** permite avanzar el producto con el equipo de UI mientras la infraestructura de IA madura; cada integración se cierra con su endpoint, contrato y tests.

### D10. Escala de calificación argentina 0-10 y rúbrica por defecto
**Decisión:** el Auto-correction Engine devuelve una nota 0-10 y, si no hay rúbrica, aplica una genérica con pesos (contenido 40 / claridad 30 / consigna 30).
**Por qué:** coherencia con las rúbricas ya existentes en el dominio (`Rubrica.criterios` con `{nombre, peso}`) y con la escala del sistema de notas.

### D11. Errores mapeados a HTTP y "no inventar" como regla dura
**Decisión:** el router traduce errores de validación a `400` y fallos del proveedor LLM a `502`; si el ai-service no está configurado, el backend responde `501` con un mensaje claro.
**Por qué:** contratos explícitos para el backend de Node y para el usuario final ("la IA no está disponible todavía, podés corregir manualmente").

### D12. Seguridad
**Decisión:** `GEMINI_API_KEY` y credenciales viven en `.env` (nunca en el repo, hay `.env.example` como plantilla); los system prompts prohíben revelar datos de otros usuarios; la sanidad de los prompts de entrada mitiga la inyección de prompt.

---

## 8. Contratos con el backend de Node

| Endpoint ai-service | Caso de uso | Consumido por backend Node |
|---|---|---|
| `POST /tutor/chat` (+`/stream`) | CU-A04 | módulo `tutor/` (sesiones del alumno) |
| `POST /tutor/resumen` | CU-A05 | *(pendiente de proxyeación)* |
| `POST /tutor/examen` | CU-A08 | *(pendiente de proxyeación)* |
| `POST /tutor/generar-material` | CU-A09 | `POST /api/asistente/generar` (asistente docente del profesor) |
| `POST /tutor/corregir-entrega` | CU-A13 | `GET /api/entregas/:entregaId/correccion-ia` (Auto-correction Engine) |
| `POST /rag/material` · `DELETE /rag/material/{subject}/{material}` | RAG | indexación al publicar contenido |
| `POST /tutor/depurar` | CU-SYS01 | reporte de depuración de prompts |

---

## 9. Estado actual y próximos pasos

- **Hecho:** chat tutor (3 modos) con RAG/caché/streaming · resumen de documentos · simulacro de examen · indexación de material · asistente docente · Auto-correction Engine · tests (33 passing) y lint (ruff).
- **Pendientes:** proxyeación de `/tutor/resumen` y `/tutor/examen` desde Node (endpoints ya listos en el ai-service) · rúbricas reales en el frontend del profesor (hoy devuelven `[]`) · probar en vivo con `GEMINI_API_KEY` real (en `.env` de `ai-services/`) y `AI_SERVICE_URL` apuntando al servicio (en `backend/.env`).