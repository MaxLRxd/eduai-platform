# Graph Report - eduai-platform  (2026-11-22)

## Corpus Check
- 413 files · ~193,105 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3084 nodes · 7842 edges · 141 communities (109 shown, 19 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 283 edges (avg confidence: 0.89)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c884c2ed`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- embeddings_service.py
- prisma.ts
- tutor/tutor.service.ts
- test_router.py
- app.ts
- DocumentService
- App.tsx
- test_depuracion_prompts.py
- domain.ts
- react
- AssignmentSubmitModal.tsx
- actividades.service.ts
- schemas/tutor.py
- test_pinecone_service.py
- corregir_simulacro.py
- aiClient.ts
- admin.service.ts
- backend/package.json
- auth/auth.service.ts
- TeacherActivitiesPage.tsx
- Documentacion tecnica
- Backend Node.js + Express
- analytics/analytics.service.ts
- Endpoints de la API
- main.py
- materias.service.ts
- AppError
- contenidos.service.ts
- generar-docs-api.mjs
- test_llm_retry.py
- planning/planning.service.ts
- services/tutor.service.ts
- error.ts
- frontend/package.json
- RetrievalService
- @tanstack/react-query
- scripts
- test_correccion_externa.py
- api.ts
- compilerOptions
- CU-A04 Consultar Tutor IA
- obtenerProfesorAsignado
- TeacherCorrectionsPage.tsx
- Manual de usuario
- dependencies
- devDependencies
- notas.service.ts
- admin.controller.ts
- 7. Decisiones de diseño clave tomadas durante el desarrollo
- TeacherContentPage.tsx
- Documento de implementacion
- prompt_sanitizer.py
- @prisma/client
- devDependencies
- api
- adminUsers.service.ts
- PineconeRetrievalService
- Cosas que faltan (BOLO)
- asistencias.service.ts
- config/config.service.ts
- email.service.ts
- SimulacroPanel.tsx
- adminReports.service.ts
- adminSettings.service.ts
- useTutorChat.ts
- services/analytics.service.ts
- progress.service.ts
- ai-services/requirements.txt
- ReportesMaterialCard.tsx
- compilerOptions
- compilerOptions
- ai-service (Python/FastAPI)
- storage.ts
- correct_submission.py
- OcrService
- courses.service.ts
- Deploy cloud — documento de decisión
- document_service.py
- scripts
- StudentCourseDetailPage.tsx
- 🟡 DEUDA TÉCNICA Y RIESGOS CONOCIDOS
- Plan de acción — EduAI Platform
- limpiar_markdown
- asistente.routes.ts
- benchmark-tutor.mjs
- FakePinecone
- 🟠 FUNCIONALIDAD (2–6 ✅ hechas; 6 cerrada 2026-10-17)
- CU-P02 Cargar contenido (OCR)
- flujo-completo.e2e.mjs
- EduAI · Prompts de desarrollo — Sesión de trabajo
- seed.ts
- resumen-archivo.test.tsx
- useTeacherAssistant.ts
- Clave de acceso a materia
- ._limpiar
- Alumno
- Detalle de lo hecho (contexto técnico)
- FakeIndex
- BUGS Y FALTANTES (reporte de usuarios — 2026-11-17)
- Profesor
- scripts
- Variables de entorno del ai-service
- asistente.service.ts
- dependencies
- correccion-propia.test.tsx
- frontend/eslint.config.mjs
- Resumir documento
- frontend/tsconfig.json
- actions/setup-node@v4 (Node 22)
- asyncpg
- fastapi
- google-genai
- pgvector
- Baja de materia
- CU-A02 Navegar contenido
- CU-P03 Gestionar actividades
- nginx.conf
- IndiceLento
- test_ninguna_operacion_congela_el_event_loop
- dashboard.controller.ts
- AVANCE.md
- General
- vite.config.ts
- CI workflow GitHub Actions
- prisma
- CU-A07 Feedback automatico de entrega
- CU-P04 Rubricas y correccion IA
- ref_node_assert

## God Nodes (most connected - your core abstractions)
1. `AppError` - 245 edges
2. `react` - 80 edges
3. `api()` - 79 edges
4. `apiErrorMessage()` - 63 edges
5. `prisma` - 56 edges
6. `obtenerProfesorAsignado()` - 52 edges
7. `express` - 43 edges
8. `RetrievalService` - 42 edges
9. `@tanstack/react-query` - 42 edges
10. `_build_app()` - 38 edges

## Surprising Connections (you probably didn't know these)
- `Centralized error abstraction (star topology, load-bearing seam)` --rationale_for--> `AppError`  [EXTRACTED]
  graphify-out/memory/query_20260913_211720_0e476545_why_does_apperror_bridge_21_communities.md → backend/src/middlewares/error.ts
- `errorHandler()` --conceptually_related_to--> `Centralized error abstraction (star topology, load-bearing seam)`  [INFERRED]
  backend/src/middlewares/error.ts → graphify-out/memory/query_20260913_211720_0e476545_why_does_apperror_bridge_21_communities.md
- `Arquitectura: frontend -> backend -> (db, redis, ai-service)` --semantically_similar_to--> `Cada capa solo habla con la adyacente (intercambiabilidad)`  [INFERRED] [semantically similar]
  docs/DOCUMENTACION_TECNICA.md → IMPLEMENTATION.md
- `Query: Why does AppError bridge 21 communities?` --references--> `AppError`  [EXTRACTED]
  graphify-out/memory/query_20260913_211720_0e476545_why_does_apperror_bridge_21_communities.md → backend/src/middlewares/error.ts
- `Cacheo con Redis (TTL)` --semantically_similar_to--> `Redis cache`  [INFERRED] [semantically similar]
  IMPLEMENTATION.md → docs/DOCUMENTACION_TECNICA.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Flujo de consulta al tutor (sanitizar, cache, embedding, retrieval, LLM)** — ask_tutor_usecase, ai_services_src_services_prompt_sanitizer, ai_services_src_services_cache_service, ai_services_src_services_embeddings_service, retrieval_service, ai_services_src_services_llm_service [EXTRACTED 0.95]
- **Flujo de indexacion RAG (archivo -> texto -> chunks -> embeddings -> vector store)** — ai_services_src_routers_rag_router, ai_services_src_services_document_service, index_material_usecase, ai_services_src_services_chunking_service, ai_services_src_services_embeddings_service, retrieval_service [EXTRACTED 0.95]
- **Centralized error-handling pattern (AppError star topology)** — backend_src_middlewares_error_apperror, backend_src_middlewares_error_errorhandler, backend_src_middlewares_error_notfound, backend_src_middlewares_error, graphify_out_memory_query_20260913_211720_0e476545_why_does_apperror_bridge_21_communities_centralized_error_abstraction [EXTRACTED 1.00]
- **EduAI runtime stack** — c_frontend, c_backend, c_aiservice, c_postgres, c_redis [EXTRACTED 1.00]

## Communities (141 total, 19 thin omitted)

### Community 0 - "embeddings_service.py"
Cohesion: 0.05
Nodes (51): Migracion de dimension de embeddings y reindexado, config/genai.py (cliente Gemini singleton), Degradacion silenciosa de Redis, prompts/ (tutor, socratic, hints, exam, summary), main(), get_genai_client(), Devuelve el cliente compartido de Gemini, creado de forma perezosa. Si la clave…, Settings (+43 more)

### Community 1 - "prisma.ts"
Cohesion: 0.05
Nodes (63): createApp(), adapter, prisma, AccessTokenPayload, signAccessToken(), prismaMock, notificacionCreada, prismaMock (+55 more)

### Community 2 - "tutor/tutor.service.ts"
Cohesion: 0.05
Nodes (71): registrarConsultaTutor(), seccionDeFuentes(), corregirSimulacro(), crearSesion(), enviarMensaje(), extraerFuentesSse(), extraerTextoSse(), latenciaGlobal() (+63 more)

### Community 3 - "test_router.py"
Cohesion: 0.06
Nodes (33): FakeCache, FakeCorreccionLLM, FakeEmbeddings, FakeLLM, FakeRetrieval, Fakes de los servicios externos para los tests del tutor IA., asyncio, fixture (+25 more)

### Community 4 - "app.ts"
Cohesion: 0.09
Nodes (34): protegerArchivoSubido(), env, envSchema, parsed, health(), requireAuth(), requireRole(), rateLimit() (+26 more)

### Community 5 - "DocumentService"
Cohesion: 0.19
Nodes (3): DocumentService, Ultimo recurso: solo acepta algo que parezca texto de verdad. Sin este filtro,…, TestIntegracionConDocumentService

### Community 6 - "App.tsx"
Cohesion: 0.07
Nodes (48): App(), AppShell(), AuthLayout(), botonClase, inputClase, BADGE_CLASSES, ROLE_LABEL, Sidebar() (+40 more)

### Community 7 - "test_depuracion_prompts.py"
Cohesion: 0.05
Nodes (44): Reglas de estilo comunes para las respuestas del asistente IA., System prompt del modo pistas sin revelar respuesta (CU-A06)., System prompt del asistente docente (CU-A09): generación de material didáctico., System prompt del modo estudio con metodología socrática (CU-A09)., System prompt del tutor IA en modo normal (CU-A04)., TutorRequest, CacheService, Caché clave/valor con TTL. Degrada de forma silenciosa si Redis no está… (+36 more)

### Community 8 - "domain.ts"
Cohesion: 0.06
Nodes (61): STUDENTS_AREA_TABS, TeacherAreaTab, TeacherAreaTabs(), TopicDetailPanel(), CourseFilter(), Table(), TableWrap(), Td() (+53 more)

### Community 9 - "react"
Cohesion: 0.07
Nodes (60): Props, FILAS, Metrica, MetricasExito, SuccessMetricsCard(), hora(), MessageThread(), ChangePasswordCard() (+52 more)

### Community 10 - "AssignmentSubmitModal.tsx"
Cohesion: 0.16
Nodes (20): AssignmentSubmitModal(), esVencida(), PLACEHOLDER, TITULO, useSubmitAssignment(), useUploadAssignmentFile(), ArchivoSubido, EntregaApi (+12 more)

### Community 11 - "actividades.service.ts"
Cohesion: 0.07
Nodes (52): ActualizarActividadInput, actualizarActividadSchema, ActualizarRubricaInput, actualizarRubricaSchema, CorregirEntregaInput, corregirEntregaSchema, CrearActividadInput, crearActividadSchema (+44 more)

### Community 12 - "schemas/tutor.py"
Cohesion: 0.06
Nodes (58): main.py (create_app, lifespan, app.state), schemas/tutor.py (contratos Pydantic), System prompt para la generación de simulacros de examen (CU-A08)., borrar_materia(), delete_material(), estado_material(), index_material(), index_material_file() (+50 more)

### Community 13 - "test_pinecone_service.py"
Cohesion: 0.18
Nodes (17): FakeMatch, make_service(), asyncio, Tests del servicio de búsqueda vectorial en Pinecone., test_close_closes_client(), test_count_chunks_cuenta_los_vectores_del_namespace_de_la_materia(), test_count_chunks_tambien_acepta_una_respuesta_tipo_dict_y_un_indice_vacio(), test_creates_serverless_index_when_missing() (+9 more)

### Community 14 - "corregir_simulacro.py"
Cohesion: 0.14
Nodes (28): ExamAnswerItem, ExamItemResult, Una pregunta del simulacro con lo que respondió el alumno (CU-A11)., FakeExamenCorreccionLLM, Devuelve una correccion fija para las preguntas de desarrollo recibidas., corregir(), desarrollo(), mc() (+20 more)

### Community 15 - "aiClient.ts"
Cohesion: 0.08
Nodes (52): aiDisponible(), aiHeaders(), baseUrl(), borrarMateriaIndexadaIA(), ChatMessageInput, chatTutor(), contarFragmentosIA(), CorreccionExamenItemInput (+44 more)

### Community 16 - "admin.service.ts"
Cohesion: 0.08
Nodes (40): GenerarClaveAdminInput, actualizarEstado(), actualizarMateria(), asignarProfesor(), assertUuid(), avisar(), cambiarRol(), crearMateria() (+32 more)

### Community 17 - "backend/package.json"
Cohesion: 0.06
Nodes (35): author, description, eslint, @types/node, typescript, typescript-eslint, keywords, license (+27 more)

### Community 18 - "auth/auth.service.ts"
Cohesion: 0.08
Nodes (38): cambiarPassword(), login(), logout(), me(), refresh(), register(), restablecerPassword(), limiteCredenciales (+30 more)

### Community 19 - "TeacherActivitiesPage.tsx"
Cohesion: 0.16
Nodes (26): ActivityFormModal(), AYUDA, errorDeApi(), TIPOS, toInputDate(), EVALUATIONS_AREA_TABS, key(), useCreateActivity() (+18 more)

### Community 20 - "Documentacion tecnica"
Cohesion: 0.13
Nodes (17): Documentacion tecnica, Actores: Alumno, Docente, Administrador, Arquitectura: frontend -> backend -> (db, redis, ai-service), Modelo de datos (29 tablas Prisma), Degradacion controlada ante caida del ai-service, Suite E2E flujo-completo.e2e.mjs, Frontend: rutas por rol, React Query, sesion, tema, X-Internal-Token (secreto backend/ai-service) (+9 more)

### Community 21 - "Backend Node.js + Express"
Cohesion: 0.22
Nodes (13): Rol Administrador, ai-service FastAPI, Rol Alumno, Backend Node.js + Express, Degradacion controlada, Rol Docente, Docker Compose, Frontend React + Vite (+5 more)

### Community 22 - "analytics/analytics.service.ts"
Cohesion: 0.11
Nodes (31): actualizarPregunta(), comprension(), crearPregunta(), dudas(), eliminarPregunta(), filtrosDe(), listarPreguntas(), progreso() (+23 more)

### Community 23 - "Endpoints de la API"
Cohesion: 0.10
Nodes (20): Endpoints de la API, Modelo de acceso: Publico/Autenticado/Rol, Zod, limitador, API: Actividades, entregas y rubricas, API: Administracion (/api/admin), API: Analytics y preguntas frecuentes, API: Asistente docente (generar, pdf), API: Autenticacion (/api/auth), API: Configuracion e institucion (branding) (+12 more)

### Community 24 - "main.py"
Cohesion: 0.05
Nodes (45): create_app(), healthz(), lifespan(), get, Solo el backend puede usar el servicio: evita que terceros consuman la cuota…, verificar_token_interno(), build_summary_prompt(), System prompt para el resumen de documentos (CU-A05). (+37 more)

### Community 25 - "materias.service.ts"
Cohesion: 0.14
Nodes (22): crear(), crearClave(), detalle(), inscriptos(), mias(), perfilAlumno(), unirse(), CrearClaveInput (+14 more)

### Community 26 - "AppError"
Cohesion: 0.15
Nodes (31): AppError, actualizar(), actualizarRubrica(), corregir(), corregirConIA(), crear(), crearRubrica(), eliminar() (+23 more)

### Community 27 - "contenidos.service.ts"
Cohesion: 0.11
Nodes (32): archivoDisponible(), listarPorMateria(), ActualizarContenidoInput, actualizarContenidoSchema, CrearContenidoInput, crearContenidoSchema, reportarContenidoSchema, tipoContenidoSchema (+24 more)

### Community 28 - "generar-docs-api.mjs"
Cohesion: 0.08
Nodes (21): ref_node_child_process, ref_node_url, app, destino, filas, importaciones, lineas, montajes (+13 more)

### Community 29 - "test_llm_retry.py"
Cohesion: 0.07
Nodes (45): es_error_transitorio(), True si el error del proveedor es transitorio y vale la pena reintentar., _ClienteFalso, _Embedding, fixture, Tests del embedding por chunk (gemini-embedding-2 agrega los contents)., _Respuesta, _service() (+37 more)

### Community 30 - "planning/planning.service.ts"
Cohesion: 0.34
Nodes (15): clienteS3(), eliminarArchivo(), guardarArchivo(), leerArchivo(), prefijoPublico(), asignarMaterialDesdeContenido(), assertUuid(), eliminarMaterial() (+7 more)

### Community 31 - "services/tutor.service.ts"
Cohesion: 0.12
Nodes (21): enviar(), messageFromError(), useResumen(), resumir(), useSimulacro(), generar(), limpiar(), AskTutorResult (+13 more)

### Community 32 - "error.ts"
Cohesion: 0.11
Nodes (21): logger, app, server, errorHandler(), notFound(), resolverError(), contarNoLeidas(), listar() (+13 more)

### Community 33 - "frontend/package.json"
Cohesion: 0.10
Nodes (19): description, eslint, @types/node, typescript, typescript-eslint, name, private, type (+11 more)

### Community 34 - "RetrievalService"
Cohesion: 0.07
Nodes (21): _init_connection(), Si la tabla existente usa otra dimension, la recrea y devuelve las filas (id,…, Materias que tienen fragmentos indexados, con cuantos, Borra TODO el material indexado de una materia., Acceso a la base vectorial de material educativo indexado., Fragmentos de material indexados para la materia (0 = nada para fundamentar)., RetrievalService, FakeConn (+13 more)

### Community 35 - "@tanstack/react-query"
Cohesion: 0.05
Nodes (53): AuthContext, AuthContextValue, AuthProvider(), readStoredUser(), User, BrandingContext, BrandingContextValue, BrandingProvider() (+45 more)

### Community 36 - "scripts"
Cohesion: 0.09
Nodes (22): description, devDependencies, concurrently, name, private, scripts, ai:setup, ai:test (+14 more)

### Community 37 - "test_correccion_externa.py"
Cohesion: 0.12
Nodes (28): System prompt para corregir las respuestas de desarrollo de un simulacro…, caso(), externa(), LLMRegistrador, pedido(), propia_del_simulacro(), asyncio, CU-A11 (A2, A4): las respuestas externas se corrigen contra el material; sin… (+20 more)

### Community 38 - "api.ts"
Cohesion: 0.09
Nodes (40): aFilas(), CategoriasNotaEditor(), Fila, ImportarNotasActividad(), clave(), useActualizarNota(), useCalificaciones(), useGuardarCategorias() (+32 more)

### Community 39 - "compilerOptions"
Cohesion: 0.09
Nodes (21): compilerOptions, allowImportingTsExtensions, composite, isolatedModules, jsx, lib, module, moduleDetection (+13 more)

### Community 40 - "CU-A04 Consultar Tutor IA"
Cohesion: 0.14
Nodes (15): Benchmark del tutor, Depuracion de prompts, Preguntas frecuentes del tutor, IES Santa Fe Practica Profesionalizante 2, RAG Retrieval-Augmented Generation, SSE streaming del tutor, Tutor IA contextualizado por materia, CU-A04 Consultar Tutor IA (+7 more)

### Community 41 - "obtenerProfesorAsignado"
Cohesion: 0.15
Nodes (25): assertUuid(), listarInscriptos(), obtenerProfesorAsignado(), actualizar(), actualizar(), crear(), eliminar(), listarPorMateria() (+17 more)

### Community 42 - "TeacherCorrectionsPage.tsx"
Cohesion: 0.12
Nodes (34): Criterio, criterioVacio(), errorDeFormulario(), Props, RubricFormModal(), useCorrectionQueue(), useCorrectWithAi(), useCreateRubric() (+26 more)

### Community 43 - "Manual de usuario"
Cohesion: 0.12
Nodes (19): La IA sugiere, el docente decide, Manual de usuario, Admin: claves de matriculacion (vencimiento, usos, revocar), Admin: materias, asignar docente, baja y desmatriculacion, Admin: reportes CSV/PDF, licencias y apariencia, Admin: gestion de usuarios y baja, Alumno: inscripcion por clave de matriculacion, Alumno: Inicio (promedio, asistencia, proximas actividades) (+11 more)

### Community 44 - "dependencies"
Cohesion: 0.10
Nodes (20): dependencies, @aws-sdk/client-s3, @aws-sdk/lib-storage, bcryptjs, cookie-parser, cors, dotenv, express (+12 more)

### Community 45 - "devDependencies"
Cohesion: 0.10
Nodes (20): devDependencies, eslint, jest, supertest, @swc/core, @swc/jest, tsx, @types/bcryptjs (+12 more)

### Community 46 - "notas.service.ts"
Cohesion: 0.09
Nodes (42): actualizar(), crear(), listarCategorias(), listarFuentesCalificacion(), listarPorMateria(), mías(), reemplazarCategorias(), resumenCalificaciones() (+34 more)

### Community 47 - "admin.controller.ts"
Cohesion: 0.07
Nodes (51): actualizarEstado(), actualizarMateria(), asignarProfesor(), cambiarRol(), crearMateria(), crearUsuario(), desmatricular(), desmatricularTodos() (+43 more)

### Community 48 - "7. Decisiones de diseño clave tomadas durante el desarrollo"
Cohesion: 0.06
Nodes (34): 1. Resumen ejecutivo, 2. Modelos configurados, 3. Arquitectura RAG, 4. Principios que gobiernan todos los prompts, 5.1 Tutor IA · modo normal — `prompts/tutor.py` (CU-A04), 5.2 Tutor IA · modo estudio socrático — `prompts/socratic.py` (CU-A09), 5.3 Tutor IA · modo pistas — `prompts/hints.py` (CU-A06), 5.4 Resumen de documentos — `prompts/summary.py` (CU-A05) (+26 more)

### Community 49 - "TeacherContentPage.tsx"
Cohesion: 0.06
Nodes (69): ClassFormModal(), ClassMaterialOption, CreatedClassInfo, ClassMaterialModal(), SeccionEditForm(), Tipo, Modal(), useCourseContentTree() (+61 more)

### Community 50 - "Documento de implementacion"
Cohesion: 0.14
Nodes (15): Tests del ai-service con fakes, pytest / pytest-asyncio / httpx / ruff (dev deps), Modulos del backend (rutas -> controlador -> servicio), frontend/index.html (entrada SPA Vite), src/main.tsx (punto de montaje #root), Documento de implementacion, Backend en capas: rutas, controladores, servicios, middlewares, CI/CD con GitHub Actions (ci.yml, deploy.yml) (+7 more)

### Community 51 - "prompt_sanitizer.py"
Cohesion: 0.13
Nodes (22): estimate_tokens(), Estimación aproximada de tokens (código independiente del modelo)., _matches_greeting(), _normalize_whitespace(), Depuración de prompts de usuario (CU-SYS01)., Elimina saludos, muletillas y contenido irrelevante. Devuelve (prompt_depurado,…, Prefijo con limite de palabra: "hi" saluda, "historia" no., Quita saludos encadenados al comienzo ("hola, buenas tardes, ..."). (+14 more)

### Community 52 - "@prisma/client"
Cohesion: 0.19
Nodes (11): dashboard(), dashboardAdmin(), dashboardAlumno(), dashboardProfesor(), periodoDeFecha(), actividad(), materia(), prismaMock (+3 more)

### Community 53 - "devDependencies"
Cohesion: 0.11
Nodes (19): devDependencies, autoprefixer, eslint, eslint-plugin-react-hooks, jsdom, postcss, tailwindcss, @testing-library/jest-dom (+11 more)

### Community 54 - "api"
Cohesion: 0.13
Nodes (23): EnrolledStudentsPanel(), Header(), PROFILE_PATH_BY_ROLE, EnrolledStudent, useEnrolledStudents(), useRefreshEnrollment(), useUnenrollAll(), useUnenrollStudent() (+15 more)

### Community 55 - "adminUsers.service.ts"
Cohesion: 0.11
Nodes (31): useAdminKeys(), useGenerateAdminKey(), useRevokeAdminKey(), invalidateUsers(), useAdminProfessors(), useAdminUsers(), useChangeAdminUserRole(), useCreateAdminUser() (+23 more)

### Community 56 - "PineconeRetrievalService"
Cohesion: 0.13
Nodes (5): PineconeRetrievalService, Materias (namespaces) con fragmentos indexados, con cuantos., Borra TODO el material indexado de una materia (su namespace)., Cuantos fragmentos hay indexados para la materia (cada materia es un namespace)., Acceso a la base vectorial de material educativo indexado en Pinecone.

### Community 57 - "Cosas que faltan (BOLO)"
Cohesion: 0.09
Nodes (21): 1.1 Probar el envío real del correo (recuperación de contraseña), 1.2 Ver el CI corriendo en GitHub, 1. Para cerrar lo último que se hizo, 2.1 Revocar el acceso al desactivar un usuario, 2.2 Vulnerabilidades de `npm audit`, 2.3 URLs firmadas para los archivos, 2. Seguridad, 3.1 Logo roto (+13 more)

### Community 58 - "asistencias.service.ts"
Cohesion: 0.20
Nodes (15): actualizar(), listarPorMateria(), mías(), registrarDia(), ActualizarAsistenciaInput, actualizarAsistenciaSchema, estadosAsistencia, RegistraAsistenciaInput (+7 more)

### Community 59 - "config/config.service.ts"
Cohesion: 0.11
Nodes (27): getBranding(), getBrandingPublico(), subirLogo(), updateBranding(), BrandingInput, brandingSchema, COLOR_PRESETS, ColorPreset (+19 more)

### Community 60 - "email.service.ts"
Cohesion: 0.10
Nodes (28): enlaceDeRecuperacion(), hashToken(), restablecerPassword(), solicitarRecuperacion(), urlDeLaApp(), notificarPorEmail(), EmailMessage, EmailProvider (+20 more)

### Community 61 - "SimulacroPanel.tsx"
Cohesion: 0.16
Nodes (13): CorreccionPropiaPanel(), parVacio(), DIFICULTAD_TAG, DIFICULTADES, formatearFecha(), ResultadoCorreccion(), SimulacroPanel(), VEREDICTO (+5 more)

### Community 62 - "adminReports.service.ts"
Cohesion: 0.21
Nodes (14): useAdminReports(), useExportReport(), useExportReportPdf(), AdminReportsPage(), downloadCsv(), downloadPdf(), EXPORT_LABELS, ExportPdfResult (+6 more)

### Community 63 - "adminSettings.service.ts"
Cohesion: 0.15
Nodes (18): useAdminSettings(), useSaveBranding(), AdminSettingsPage(), getBranding(), getColorPresets(), saveBranding(), SaveBrandingInput, uploadBrandingLogo() (+10 more)

### Community 64 - "useTutorChat.ts"
Cohesion: 0.15
Nodes (21): aMensajes(), guardarUltimaSesion(), leerUltimaSesion(), TUTOR_LENTO_MS, useTutorChat(), actualizarRespuesta(), ask(), nuevaConversacion() (+13 more)

### Community 65 - "services/analytics.service.ts"
Cohesion: 0.18
Nodes (19): useAnalytics(), useTopicDetail(), AlertaApi, ComprensionApi, DudaApi, filtrosQuery(), getFrequentErrors(), getFrequentQuestions() (+11 more)

### Community 66 - "progress.service.ts"
Cohesion: 0.21
Nodes (12): useProgress(), ESTADO_LABEL, getProgressData(), gradeColor(), ProgresoApi, ProgressData, ProgressOverview, ResumenProgresoApi (+4 more)

### Community 67 - "ai-services/requirements.txt"
Cohesion: 0.22
Nodes (8): google-genai, structlog, redis, asyncpg, pgvector, pinecone, pypdf, python-docx, python-pptx, pytesseract + pdf2image + Pillow (CU-P02), fastapi, uvicorn, pydantic-settings, python-multipart, ai-service job (ruff + pytest), pytest, ruff check src, actions/setup-python@v5 (Python 3.12)

### Community 68 - "ReportesMaterialCard.tsx"
Cohesion: 0.18
Nodes (13): EstadoReporte, MaterialItem(), MaterialRow(), fecha(), ReportesMaterialCard(), getReportesMaterial(), reportarProblemaMaterial(), resolverReportesMaterial() (+5 more)

### Community 69 - "compilerOptions"
Cohesion: 0.12
Nodes (15): compilerOptions, declaration, esModuleInterop, forceConsistentCasingInFileNames, module, moduleResolution, outDir, resolveJsonModule (+7 more)

### Community 70 - "compilerOptions"
Cohesion: 0.12
Nodes (15): compilerOptions, allowImportingTsExtensions, composite, isolatedModules, lib, module, moduleDetection, moduleResolution (+7 more)

### Community 71 - "ai-service (Python/FastAPI)"
Cohesion: 0.18
Nodes (16): ai-service (Python/FastAPI), AI service README, pinecone, Redis cache, CU-A05 Resumen de documento, Desvios respecto del plan original, Flujo RAG (material -> respuesta del tutor), Resumir un documento (panel Resumen, PDF) (+8 more)

### Community 72 - "storage.ts"
Cohesion: 0.14
Nodes (14): asegurarDirectorioUploads(), formatoDe(), normalizarEndpoint(), sanitizarBase(), StorageProvider, StoredFile, UPLOADS_DIR, usarS3 (+6 more)

### Community 73 - "correct_submission.py"
Cohesion: 0.09
Nodes (40): System prompt del Auto-correction Engine (CU-A13): corrección de entregas con…, CorrectSubmissionRequest, CriterioRubrica, NivelDesempeno, Un nivel de la rubrica (Excelente, Bueno...); `puntaje` es el % del peso que se…, _caso(), _detalle(), LLMRegistrador (+32 more)

### Community 74 - "OcrService"
Cohesion: 0.17
Nodes (5): OcrService, True si el binario de tesseract esta instalado. Se cachea el resultado., parametrize, TestDisponibilidad, TestFormatosSoportados

### Community 75 - "courses.service.ts"
Cohesion: 0.19
Nodes (14): useCourse(), ClaseArbolDto, COLOR_PALETTE, colorDeMateria(), ContenidoDto, estadoUnidad(), getCourseById(), getCourses() (+6 more)

### Community 76 - "Deploy cloud — documento de decisión"
Cohesion: 0.12
Nodes (15): 1. Qué hay que decidir, 2. Lo que YA está resuelto y es agnóstico del proveedor, 3. La trampa principal: 3 servicios = 3 cold starts, 4. Restricción: DB y `ai-service` en la misma región, 5. Sobre Postgres con `pgvector`, 6. Opciones a comparar, 7. Preguntas abiertas para la reunión, 8. Checklist antes de poder deployar (+7 more)

### Community 77 - "document_service.py"
Cohesion: 0.16
Nodes (12): Extracción de texto de documentos (PDF, DOCX, PPTX, TXT, imágenes)., Servicio de OCR para CU-P02: imagenes y PDF escaneado. Usa tesseract via…, _pdf_con_texto(), _png_1px(), Tests del OCR (CU-P02). No requieren tesseract instalado: se simula el binario., Un PNG valido minimo, generado con Pillow si esta disponible., PDF de una pagina con capa de texto real, armado con pypdf., docx (+4 more)

### Community 78 - "scripts"
Cohesion: 0.14
Nodes (14): scripts, build, db:deploy, db:generate, db:migrate, db:seed, db:studio, demo:reset (+6 more)

### Community 79 - "StudentCourseDetailPage.tsx"
Cohesion: 0.23
Nodes (10): formatoFechaClase(), formatoSesion(), MODO_BANNER, MODO_LABEL, MODO_NOMBRE, preguntaUnidadActual(), StudentCourseDetailPage(), UNIT_TAG_COLOR (+2 more)

### Community 80 - "🟡 DEUDA TÉCNICA Y RIESGOS CONOCIDOS"
Cohesion: 0.17
Nodes (12): 10. ✅ Cambiar de vector store: procedimiento y limpieza (2026-11-20), 11. ✅ `pinecone_service.py` ya no bloquea el event loop (2026-11-20), 12. Gemini intermitente, 13. ✅ `CHROMA_URL` eliminada (2026-10-17), 14. ✅ E2E que faltaban (2026-11-20), 15. ✅ El CI estaba en rojo y no se veía (2026-11-20), 16. ✅ Base lista para demo (2026-11-20), 17. ✅ Recuperación de contraseña por correo (2026-11-20) (+4 more)

### Community 81 - "Plan de acción — EduAI Platform"
Cohesion: 0.18
Nodes (10): Diagnóstico, Fase 0 — Cierre rápido (1-2 h, casi sin código), Fase 1 — Seguridad (antes de la defensa), Fase 2 — Bugs visibles en demo (mayor retorno), Fase 3 — Calidad, Fase 4 — Post-defensa / opcional, Plan de acción — EduAI Platform, Recomendación de arranque (+2 more)

### Community 82 - "limpiar_markdown"
Cohesion: 0.31
Nodes (8): limpiar_markdown(), Limpieza de marcas markdown que el chat muestra como texto plano., Quita negritas, cursivas, backticks y encabezados del texto del modelo., test_puede_conservar_encabezados_para_material(), test_quita_encabezados_pero_conserva_vinetas(), test_quita_negritas_cursivas_y_backticks(), test_texto_vacio_se_devuelve_igual(), re

### Community 83 - "asistente.routes.ts"
Cohesion: 0.38
Nodes (7): generarMaterial(), generarMaterialPdf(), router, GenerarMaterialInput, generarMaterialSchema, MaterialPdfInput, materialPdfSchema

### Community 84 - "benchmark-tutor.mjs"
Cohesion: 0.18
Nodes (6): BASE, filas, N, PREGUNTAS, primeras, totales

### Community 85 - "FakePinecone"
Cohesion: 0.20
Nodes (3): fake_pinecone(), FakePinecone, fixture

### Community 86 - "🟠 FUNCIONALIDAD (2–6 ✅ hechas; 6 cerrada 2026-10-17)"
Cohesion: 0.20
Nodes (10): 1. Deploy a cloud — opcional, 2. ✅ Notificaciones — frontend implementado (2026-10-16), 3. ✅ Email — servicio implementado y cableado (2026-10-17), 4. ✅ R2 / object storage — cliente S3 integrado (2026-10-16), 5. ✅ Export PDF de reportes (2026-10-16), 6. ✅ Branding — presets en backend + logo a storage (2026-10-17), 🟢 DEPLOY — NO BLOQUEA LA ENTREGA, 🟠 FUNCIONALIDAD (2–6 ✅ hechas; 6 cerrada 2026-10-17) (+2 more)

### Community 88 - "flujo-completo.e2e.mjs"
Cohesion: 0.22
Nodes (8): ahora, AI_URL, BASE, ctx, llamar(), login(), SUFIJO, ref_node_test

### Community 89 - "EduAI · Prompts de desarrollo — Sesión de trabajo"
Cohesion: 0.20
Nodes (9): Contexto al inicio de la sesión, EduAI · Prompts de desarrollo — Sesión de trabajo, Lecciones de proceso de esta sesión, Prompt 1 · «¿Qué hicimos hasta ahora? ¿Qué más quedaría? Solo coméntamelo.», Prompt 2 · «Dale, hagamos ese» → Asistente docente IA, Prompt 3 · «Dale» → Corrección IA (Auto-correction Engine), Prompt 4 · «Generame un archivo .md explicando qué IA se usó, qué modelo, los distintos prompts y las decisiones a lo largo del desarrollo», Prompt 5 · Aclaración — «Me refería a los prompts que usamos a lo largo de todo el desarrollo» (+1 more)

### Community 90 - "seed.ts"
Cohesion: 0.24
Nodes (9): MATERIAL_DEMO, MaterialDemo, adapter, estadoAsistencia, fechaClase(), limpiar(), main(), prisma (+1 more)

### Community 91 - "resumen-archivo.test.tsx"
Cohesion: 0.24
Nodes (8): ResumenPanel(), elegirArchivo(), quitarArchivo(), descargarResumenPdf(), validarArchivoResumen(), apiMock, course, Course

### Community 92 - "useTeacherAssistant.ts"
Cohesion: 0.39
Nodes (7): useTeacherAssistant(), ask(), downloadPdf(), askTeacherAssistant(), downloadMaterialPdf(), exportMaterialPdf(), MaterialPdfResult

### Community 93 - "Clave de acceso a materia"
Cohesion: 0.40
Nodes (5): Clave de acceso a materia, CU-A01 Inscribirse a materia, 26 casos de uso: 22 completos, 4 parciales, Prueba E2E flujo-completo, Plazo de entrega

### Community 94 - "._limpiar"
Cohesion: 0.25
Nodes (4): Quita el ruido tipico de tesseract: lineas en blanco repetidas y espacios…, Transcribe una imagen a texto. Devuelve "" si no se puede., Transcribe un PDF escaneado rasterizando sus paginas. Devuelve "" si falla., TestLimpieza

### Community 95 - "Alumno"
Cohesion: 0.22
Nodes (9): Alumno, ✅ El alumno no ve cómo se arma su nota final, ✅ El chat con el tutor de IA no persiste, ✅ El chat con el tutor debe poder ampliarse, ✅ Entregas: columna "Nota", ✅ Material/PDF no abre ni descarga, ✅ Mensajería de alumno hacia el profesor, ✅ "Mis estadísticas" completamente mockeada (+1 more)

### Community 96 - "Detalle de lo hecho (contexto técnico)"
Cohesion: 0.22
Nodes (9): Detalle de lo hecho (contexto técnico), Docker verificado (2026-09-28), Entregas del alumno (CU-A03, 2026-09-30), Gemini en producción (2026-09-28) — modelo y reintentos, Gestión de actividades del docente (CU-P03, 2026-09-30), OCR de imágenes y PDF escaneado (CU-P02, 2026-09-30), RAG para archivos (✅ 2026-09-25), Rúbricas y corrección IA (CU-P04 + CU-A07, 2026-09-30) (+1 more)

### Community 98 - "BUGS Y FALTANTES (reporte de usuarios — 2026-11-17)"
Cohesion: 0.25
Nodes (8): Admin — conectado al backend real, Administrador, BUGS Y FALTANTES (reporte de usuarios — 2026-11-17), ✅ "Editar" materia no trae descripción ni nivel educativo, Estado: conectado al backend real, Resumen de estado, Servicio de IA (ai-service) — integrado, STACK

### Community 99 - "Profesor"
Cohesion: 0.25
Nodes (8): ✅ Correcciones de "Contenidos", ✅ El docente no puede ver el documento de una entrega, ✅ Filtros de mensajería, ✅ Gestionar secciones envía a "Mis alumnos", ✅ Material para estudiantes, Profesor, ✅ Reorganización de menús y jerarquías, ✅ Simulación de TPs y exámenes para "Calificaciones"

### Community 100 - "scripts"
Cohesion: 0.29
Nodes (7): scripts, build, dev, lint, preview, test, typecheck

### Community 101 - "Variables de entorno del ai-service"
Cohesion: 0.29
Nodes (7): Variables de entorno del ai-service, RETRIEVAL_MIN_SCORE (umbral de similitud), config/settings.py (Settings), RAG troubleshooting, Variables de entorno imprescindibles, Archivos de entorno (.env.example, .gitignore), Regla de oro: nada hardcodeado

### Community 102 - "asistente.service.ts"
Cohesion: 0.31
Nodes (8): assertUuid(), generarMaterial(), generarMaterialPdf(), MaterialPdf, renderMaterialPdf(), sinEmojis(), sinMarcasInline(), pdfkit

### Community 103 - "dependencies"
Cohesion: 0.40
Nodes (5): dependencies, react, react-dom, react-router-dom, @tanstack/react-query

### Community 106 - "Resumir documento"
Cohesion: 0.67
Nodes (3): CU-A05 Resumir documento, Resumir documento, Simulacro

### Community 108 - "actions/setup-node@v4 (Node 22)"
Cohesion: 0.67
Nodes (3): backend job (lint + typecheck + tests), frontend job (lint + typecheck + tests + build), actions/setup-node@v4 (Node 22)

### Community 129 - "test_ninguna_operacion_congela_el_event_loop"
Cohesion: 0.33
Nodes (5): _latidos_durante(), parametrize, Cuántas veces pudo correr otra corrutina mientras `operacion` esperaba la red., _servicio_lento(), test_ninguna_operacion_congela_el_event_loop()

### Community 130 - "dashboard.controller.ts"
Cohesion: 0.87
Nodes (5): dashboard(), dashboardAlumno(), dashboardProfesor(), periodoDeQuery(), requireUser()

### Community 131 - "AVANCE.md"
Cohesion: 0.33
Nodes (5): CÓMO CORRER, Docker (recomendado), EduAI Platform — Avance del Proyecto, Local (sin contenedores de app), Verificación

### Community 132 - "General"
Cohesion: 0.33
Nodes (6): ✅ Ajustes de prompting, ✅ Eliminar "SIMILAR A MOODLE", General, 🟡 Licencias, ✅ Problemas de encoding, ✅ Sacar el buscador de la plataforma

### Community 134 - "CI workflow GitHub Actions"
Cohesion: 0.67
Nodes (3): pytest + ruff, Tests backend/frontend (npm test), CI workflow GitHub Actions

## Knowledge Gaps
- **771 isolated node(s):** `name`, `version`, `description`, `main`, `dev` (+766 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1114 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **19 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `AppError` connect `AppError` to `prisma.ts`, `dashboard.controller.ts`, `tutor/tutor.service.ts`, `app.ts`, `actividades.service.ts`, `admin.service.ts`, `auth/auth.service.ts`, `analytics/analytics.service.ts`, `materias.service.ts`, `contenidos.service.ts`, `planning/planning.service.ts`, `error.ts`, `obtenerProfesorAsignado`, `notas.service.ts`, `admin.controller.ts`, `@prisma/client`, `asistencias.service.ts`, `config/config.service.ts`, `email.service.ts`, `asistente.routes.ts`, `asistente.service.ts`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **Why does `DocumentService` connect `DocumentService` to `main.py`, `OcrService`, `test_router.py`, `document_service.py`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `useTutorChat.ts`, `frontend/package.json`, `@tanstack/react-query`, `ReportesMaterialCard.tsx`, `App.tsx`, `api.ts`, `domain.ts`, `AssignmentSubmitModal.tsx`, `TeacherCorrectionsPage.tsx`, `StudentCourseDetailPage.tsx`, `TeacherContentPage.tsx`, `TeacherActivitiesPage.tsx`, `api`, `useTeacherAssistant.ts`, `SimulacroPanel.tsx`, `services/tutor.service.ts`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `api()` (e.g. with `adminSettings.service.test.ts` and `config.service.test.ts`) actually correct?**
  _`api()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `version`, `description` to the rest of the system?**
  _771 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `embeddings_service.py` be split into smaller, more focused modules?**
  _Cohesion score 0.04801864801864802 - nodes in this community are weakly interconnected._
- **Should `prisma.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.051648351648351645 - nodes in this community are weakly interconnected._