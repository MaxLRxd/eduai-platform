# Plan de acción para corrección/implementación de soluciones RAG

**Fecha:** 2026-10-24  
**Proyecto:** eduai-platform  
**Basado en:** `analisis-rag-contra-checklist.txt`  
**Estado objetivo:** Alcanzar cumplimiento integral del checklist RAG

---

## 1. Resumen ejecutivo

El RAG actual es sólido en arquitectura, embeddings, vector store con pgvector/HNSW y trazabilidad. Las brechas principales son:
- **Crítica:** Ausencia de umbral de similitud mínima (única barrera contra invención es el prompt).
- **Importante:** Chunking sin preservación de estructura y metadatos limitados.
- **Mejoras:** Documentación de modelos/costos, medición formal y mejoras de recuperación (híbrido/reranking).

Este plan prioriza las correcciones críticas primero, con criterios de aceptación verificables.

---

## 2. Priorización

| Prioridad | Categoría | Impacto | Esfuerzo |
| --- | --- | --- | --- |
| **P0 - Crítica** | Umbral de similitud + "saber decir que no" | Alto (previene alucinaciones) | Bajo-Medio |
| **P1 - Importante** | Chunking estructurado, metadatos, calibración | Alto (mejor recuperación) | Medio |
| **P2 - Deseable** | Búsqueda híbrida, reranking, evaluación, costos | Medio (producción/optimización) | Medio-Alto |

---

## 3. Plan detallado por áreas

### P0.1 - Implementar umbral de similitud mínima (URGENTE)

**Objetivo:** Añadir una segunda capa de protección (umbral + prompt) para responder sin invocar al LLM cuando no hay fragmentos relevantes.

| Tarea | Archivo(s) | Detalle | Criterio de aceptación |
| --- | --- | --- | --- |
| **3.1.1** Añadir configuración | `ai-services/src/config/settings.py` | Agregar `retrieval_min_score: float = 0.0` (configurable por env `RETRIEVAL_MIN_SCORE`). Documentar valor por defecto y rango (0.0 - 1.0). | Variable cargada desde `.env`, con valor por defecto seguro. |
| **3.1.2** Filtrado en búsqueda vectorial | `ai-services/src/services/retrieval_service.py` | Modificar `search()` para filtrar por `score >= min_score` (o recibir parámetro). Opción A: filtrar post-query en Python. Opción B: `WHERE (1 - (embedding <=> $2)) >= $4`. Preferir opción B con índice aprovechable cuando sea posible. | Solo retorna chunks con `score >= RETRIEVAL_MIN_SCORE`. |
| **3.1.3** Comportamiento "decir que no" sin LLM | `ai-services/src/use_cases/ask_tutor.py` | Si tras filtrado no hay `sources`/resultados relevantes: retornar respuesta directa sin llamar a `llm.generate()`/`llm.stream()`. Mensaje claro: *"No cuento con información suficiente en el material indexado para esta materia para responder esa pregunta."* Mantener trazabilidad (`sources: []`, `cached: false`). | Para pregunta fuera de corpus no se realiza llamada al LLM. Respuesta acorde al requisito 5.5. |
| **3.1.4** Actualizar router/consistencia | `ai-services/src/routers/rag_router.py`, `ai-services/src/routers/tutor_router.py` | Verificar que ambos caminos (normal/stream) respeten el nuevo comportamiento. | Tests manuales/confirman mismo comportamiento en ambos endpoints. |

**Notas:** El código actual pasa todos los resultados de `search()` al contexto (línea 49-57 de `ask_tutor.py`). Ahí hay que cortar antes de construir el prompt.

---

### P0.2 - Calibración del umbral

**Objetivo:** Elegir un valor de umbral con evidencia, no arbitrario.

| Tarea | Archivo(s) | Detalle | Criterio de aceptación |
| --- | --- | --- | --- |
| **3.2.1** Crear set de prueba | `ai-services/tests/eval/rag_threshold_eval.json` (nuevo) | Generar 10-20 preguntas: (a) sí están en corpus (con respuesta esperada), (b) sí con sinónimos/reformuladas, (c) no están en corpus. Incluir material/tema de prueba. | Archivo con casos etiquetados y trazables. |
| **3.2.2** Script de calibración | `ai-services/scripts/calibrate_threshold.py` (nuevo) | Script que para cada pregunta: embed + search(top_k alto, ej. 10), loggear scores por chunk, ejecutar con distintos umbrales (0.4, 0.5, 0.6, 0.7...), medir: % preguntas in-corpus con al menos 1 chunk >= umbral, % preguntas out-of-corpus con 0 chunks >= umbral (buen comportamiento). | Genera reporte CSV/JSON con métricas FP/FN por umbral. |
| **3.2.3** Fijar valor por defecto | `ai-services/src/config/settings.py` + `.env.example` | Tras calibración, setear `RETRIEVAL_MIN_SCORE` con valor justificado (ej. 0.55). Añadir comentario explicando calibración. | Valor documentado con evidencia del script. |

---

### P1.1 - Mejorar troceado (chunking) y preservación de estructura

**Objetivo:** Reducir cortes inadecuados y preparar base para metadatos más ricos (cumplir 2.2-2.4).

| Tarea | Archivo(s) | Detalle | Criterio de aceptación |
| --- | --- | --- | --- |
| **3.3.1** Detección básica de estructura | `ai-services/src/services/chunking_service.py` | Detectar títulos (líneas cortas con mayúsculas/numero como "Unidad 1", "Capítulo", "Tema"), listas, párrafos. Intentar no partir entre título y primer párrafo. Mantener lógica de solapamiento existente. | Chunks respetan mejor jerarquía en documentos con títulos. |
| **3.3.2** Manejo de oraciones largas | `ai-services/src/services/chunking_service.py` | Para oraciones > `max_chars`: cortar por espacios/puntuación (evitar partir palabras a la mitad). Añadir solapamiento mínimo entre sub-chunks si es posible. | No hay cortes a mitad de palabra en la mayoría de casos. |
| **3.3.3** Configuración flexible | `ai-services/src/config/settings.py` | Añadir `CHUNK_MAX_TOKENS`, `CHUNK_OVERLAP_TOKENS` (ya usados implícitamente). Exponerlos vía settings. | Configurables desde `.env`. |

---

### P1.2 - Enriquecer metadatos de chunks

**Objetivo:** Guardar información útil para trazabilidad y futuros mejoras (cumplir 2.5).

| Tarea | Archivo(s) | Detalle | Criterio de aceptación |
| --- | --- | --- | --- |
| **3.4.1** Ampliar esquema de BD | `ai-services/src/services/retrieval_service.py` (migración en `_init_schema`) | Agregar columnas opcionales: `section_title TEXT`, `article_num TEXT`, `page_num INT`, `source_path TEXT`. Mantener compatibilidad con filas existentes (migración idempotente). | Migración no destruye datos; columnas nuevas existen con valores NULL en registros antiguos. |
| **3.4.2** Propagar metadatos desde chunking | `ai-services/src/services/chunking_service.py`, `ai-services/src/use_cases/index_material.py` | `chunk_text()` puede retornar objetos `{text, section_title, ...}` o pasar metadatos por separado. Adaptar `IndexMaterialUseCase` para guardar metadatos. | Al reindexar, nuevos chunks guardan metadatos cuando disponibles. |
| **3.4.3** Exponer metadatos en fuentes | `ai-services/src/use_cases/_helpers.py`, `ai-services/src/schemas/tutor.py` | Incluir `section_title`/`page_num` en `build_sources()` y en el schema `TutorSource`. Actualizar frontend/consumidores si aplica. | API retorna metadatos enriquecidos para mostrar al usuario. |

---

### P1.3 - Documentación y justificación

**Objetivo:** Cubrir 7.1-7.4.

| Tarea | Archivo(s) | Detalle | Criterio de aceptación |
| --- | --- | --- | --- |
| **3.5.1** Documento de justificación de modelos | `docs/ai-models-justification.md` (nuevo) | Analizar: costo (entrada/salida), latencia, esfuerzo de integración, ventana de contexto, privacidad. Comparar alternativas (Gemini vs otros), justificar elección actual. Incluir costos aproximados por 1K consultas. | Documento completo con tabla comparativa y conclusión. |
| **3.5.2** Política de privacidad | `docs/ai-privacy.md` (nuevo) | Documentar: qué datos se envían a Gemini API, claves fuera de navegador, token interno backend↔ai-services, recomendaciones de uso con datos sensibles. | Documento claro y referenciado. |
| **3.5.3** Actualizar README | `README.md` / `ai-services/README.md` | Añadir sección RAG: arquitectura, configuración (umbral, top_k, chunking), troubleshooting, cómo reindexar. | README actualizado con configuración relevante. |

---

### P2.1 - Búsqueda híbrida (BM25 + vectorial)

**Objetivo:** Mejorar recuperación para nombres, fechas, números o términos exactos.

| Tarea | Archivo(s) | Detalle | Criterio de aceptación |
| --- | --- | --- | --- |
| **3.6.1** Añadir BM25 | `ai-services/pyproject.toml` o `requirements.txt` | Evaluar `rank_bm25` o `pg_trgm` + `tsvector` en Postgres. `pg_trgm`/`tsvector` más integrado con pgvector. | Dependencia añadida si se opta por Python; o migración SQL si Postgres nativo. |
| **3.6.2** Implementar híbrido | `ai-services/src/services/retrieval_service.py` | Añadir método `search_hybrid()` con fusión (reciprocal rank fusion o weighted score). Configurable `RETRIEVAL_MODE = vector|hybrid`. | Búsqueda híbrida funcional con resultados fusionados. |
| **3.6.3** Integración | `ai-services/src/use_cases/ask_tutor.py` | Usar modo híbrido según configuración. | Configurable sin romper comportamiento vectorial actual. |

---

### P2.2 - Reranking

**Objetivo:** Reordenar top resultados con modelo más preciso (cross-encoder).

| Tarea | Archivo(s) | Detalle | Criterio de aceptación |
| --- | --- | --- | --- |
| **3.7.1** Servicio de reranking | `ai-services/src/services/reranker_service.py` (nuevo) | Implementar con modelo ligero (ej. bge-reranker-v2-m3 vía API o local). Hacerlo opcional vía `RERANK_ENABLED=false` por defecto. | Servicio con interfaz clara, fallo graceful si no disponible. |
| **3.7.2** Integración | `ai-services/src/use_cases/ask_tutor.py` | Tras retrieval (con umbral aplicado), tomar top N (ej. 20), rerankear a top_k (ej. 5). Pasar reranked al contexto. | Reranking mejora orden cuando habilitado, sin afectar flujo base. |

---

### P2.3 - Evaluación formal

**Objetivo:** Medición objetiva de calidad RAG.

| Tarea | Archivo(s) | Detalle | Criterio de aceptación |
| --- | --- | --- | --- |
| **3.8.1** Suite de evaluación | `ai-services/tests/eval/rag_eval_suite.json` (nuevo) | Crear conjunto con preguntas/respuestas esperadas, ground truth por material. | Suite versionada y reproducible. |
| **3.8.2** Métricas | `ai-services/scripts/eval_rag.py` (nuevo) | Calcular: Recall@k (hay chunk relevante en top-k), MRR, contexto suficiente, tasa de "no sé" correcta (fuera de corpus), ausencia de alucinación en in-corpus. | Reporte automatizado con métricas claras. |
| **3.8.3** CI opcional | `.github/workflows/rag-eval.yml` (nuevo, opcional) | Ejecutar evaluación con dataset pequeño en PRs. | Workflow funcional o documentado como manual. |

---

## 4. Checklist de verificación

Usar para validar cada corrección:

### P0 - Crítico
- [ ] `RETRIEVAL_MIN_SCORE` configurable en settings/.env.example
- [ ] `RetrievalService.search()` filtra por umbral
- [ ] `AskTutorUseCase` responde sin LLM cuando no hay resultados >= umbral
- [ ] Funciona en modo normal y streaming
- [ ] Calibración documentada con evidencia (script + resultados)

### P1 - Importante
- [ ] Chunking mejora cortes por estructura/oraciones largas
- [ ] Esquema BD migrado con nuevas columnas de metadatos
- [ ] Metadatos aparecen en `sources` de respuesta
- [ ] Documentación de modelos/costos y privacidad creada
- [ ] README actualizado

### P2 - Deseable
- [ ] Búsqueda híbrida funcional (opcional, configurable)
- [ ] Reranking funcional (opcional, configurable)
- [ ] Suite de evaluación ejecutable con reporte

---

## 5. Orden de ejecución recomendado

| Paso | Acción | Razón |
| --- | --- | --- |
| **1** | P0.1 (umbral + "decir que no") | Crítico, menor riesgo, alta efectividad |
| **2** | P0.2 (calibración) | Validar umbral con datos reales antes de commit a valor fijo |
| **3** | P1.1-P1.2 (chunking + metadatos) | Mejora recuperación, útil para trazabilidad |
| **4** | P1.3 (documentación) | Cierra brechas del checklist (secciones 7) |
| **5** | P2.* (híbrido/reranking/eval) | Optimizaciones incrementales |

---

## 6. Archivos a crear/modificar (resumen)

### Nuevos
- `ai-services/tests/eval/rag_threshold_eval.json`
- `ai-services/scripts/calibrate_threshold.py`
- `ai-services/scripts/eval_rag.py`
- `ai-services/src/services/reranker_service.py` (opcional P2)
- `docs/ai-models-justification.md`
- `docs/ai-privacy.md`

### Modificados
- `ai-services/src/config/settings.py`
- `ai-services/src/services/retrieval_service.py`
- `ai-services/src/services/chunking_service.py`
- `ai-services/src/use_cases/ask_tutor.py`
- `ai-services/src/use_cases/_helpers.py`
- `ai-services/src/use_cases/index_material.py`
- `ai-services/src/schemas/tutor.py`
- `ai-services/.env.example`
- `README.md` / `ai-services/README.md`

---

## 7. Riesgos y mitigaciones

| Riesgo | Mitigación |
| --- | --- |
| **Umbral muy alto** (rechaza preguntas válidas) | Calibrar con set mixto, empezar conservador (ej. 0.5), hacerlo configurable. |
| **Umbral muy bajo** (no previene alucinaciones) | Priorizar reducir falsos negativos en "fuera de corpus" sobre maximizar recall. |
| **Migración de BD rompe datos** | Usar transacciones como ya hace `_init_schema()`, probar en copia/local antes. |
| **Cambios rompen streaming** | Mantener lógica idéntica en `execute()` y `stream()`, testear ambos caminos. |
| **Overhead de reranking/híbrido** | Todo opcional via flags, deshabilitado por defecto. |

---

## 8. Definición de "done"

El plan se considera completo cuando:
1. Pregunta fuera del corpus → respuesta sin invocación al LLM y mensaje claro.
2. Pregunta dentro del corpus con reformulación → recupera con umbral correcto y cita fuentes.
3. Umbral calibrado y documentado con evidencia.
4. Chunking/mejoras de metadatos no rompen indexado/reindexado existente.
5. Documentación de modelos/costos/privacidad actualizada.
6. Checklist secciones 1-9 actualizadas a mayor cumplimiento (objetivo: reducir "No cumple" críticos a 0).