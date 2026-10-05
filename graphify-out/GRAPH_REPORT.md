# Graph Report - eduai-platform  (2026-10-04)

## Corpus Check
- 136 files · ~86,178 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1783 nodes · 4288 edges · 102 communities (80 shown, 22 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 185 edges (avg confidence: 0.89)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- RAG Schemas and Indexing
- Backend AI Client
- Admin Module
- OCR and Document Extraction
- Content and Activity Services
- Prompt Modes and Test Doubles
- Backend Integration Tests
- App Shell and Navigation
- Auth Service and Seed Data
- Tutor Frontend Services
- Shared UI Primitives
- Activities and Rubrics Service
- UI Components and Buttons
- App Bootstrap and Env Config
- Pinecone Test Doubles
- Analytics Module
- Content and File Upload
- Retrieval and Material Generation
- Backend Package Manifest
- Auth Middleware and Validation
- Rubric and Assignment Modals
- Embeddings Service and App Factory
- Router Tests and Auto-correction
- LLM Retry Tests
- Pinecone Retrieval Service
- Teacher Course Services
- LLM Service and Gemini Client
- Corrections and Rubrics Frontend
- AI Service Documentation
- Activities Controller
- Frontend TS Config App
- Frontend Domain Types
- Subjects and Enrollment Keys
- Admin Users Frontend
- Root Package Manifest
- Document Summary Use Case
- Backend Dev Dependencies
- Notifications and Messaging Service
- Attendance Module
- Frontend Package Manifest
- Frontend Dev Dependencies
- Prompt Sanitizer and Chunking
- Sections and Enrollment Guards
- Grades Module
- Frontend Routing and Pages
- Frontend Auth Service
- Analytics Frontend
- Student Progress Service
- Backend TS Config
- Admin Branding Frontend
- Frontend TS Config Node
- Venv Bootstrap Scripts
- Backend Runtime Dependencies
- Messages Frontend
- Project Handoff Docs
- Messages Controller
- Dashboard Module
- Student Course Detail Page
- Cache Test Doubles
- Admin Reports and CSV Export
- Cloud Deploy Decision
- Backend npm Scripts
- Branding Config Module
- Enrollment Keys Frontend
- Admin Subjects Frontend
- Courses Frontend Service
- CI Pipeline and OCR Docs
- Sections Module Schema
- Dashboard Frontend Service
- Assignments Frontend Service
- AI Models and Prompts Doc
- Enrollment Frontend
- Admin Licensing Frontend
- Planning Module
- Teacher AI Assistant Module
- Frontend npm Scripts
- Docker Compose Services
- Frontend Runtime Dependencies
- Frontend Build Tooling
- Project README
- ESLint Configuration
- Frontend TS Project References
- Pinecone Dependency
- Correction Controller
- asyncpg Dependency
- Backend Compose Service
- Frontend Compose Service

## God Nodes (most connected - your core abstractions)
1. `AppError` - 172 edges
2. `react` - 55 edges
3. `api()` - 47 edges
4. `express` - 41 edges
5. `LLMService` - 30 edges
6. `RetrievalService` - 28 edges
7. `Button()` - 26 edges
8. `prisma` - 25 edges
9. `EmbeddingsService` - 25 edges
10. `Card()` - 24 edges

## Surprising Connections (you probably didn't know these)
- `errorHandler()` --conceptually_related_to--> `Centralized error abstraction (star topology, load-bearing seam)`  [INFERRED]
  backend/src/middlewares/error.ts → graphify-out/memory/query_20260913_211720_0e476545_why_does_apperror_bridge_21_communities.md
- `Centralized error abstraction (star topology, load-bearing seam)` --rationale_for--> `AppError`  [EXTRACTED]
  graphify-out/memory/query_20260913_211720_0e476545_why_does_apperror_bridge_21_communities.md → backend/src/middlewares/error.ts
- `Prompts Kept Out of Code` --semantically_similar_to--> `Tutor Prompt Modes (normal/socratic/hints/exam/summary)`  [INFERRED] [semantically similar]
  IMPLEMENTATION.md → ai-services/README.md
- `Contextual AI Tutor per Subject` --semantically_similar_to--> `Tutor IA Chat Service (subject-contextualized)`  [INFERRED] [semantically similar]
  README.md → ai-services/README.md
- `Backend Layered Architecture (routes/controllers/services/base)` --semantically_similar_to--> `AI Service Use Case Orchestration`  [INFERRED] [semantically similar]
  IMPLEMENTATION.md → ai-services/README.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Centralized error-handling pattern (AppError star topology)** — backend_src_middlewares_error_apperror, backend_src_middlewares_error_errorhandler, backend_src_middlewares_error_notfound, backend_src_middlewares_error, graphify_out_memory_query_20260913_211720_0e476545_why_does_apperror_bridge_21_communities_centralized_error_abstraction [EXTRACTED 1.00]
- **Layered Decoupled Architecture (adjacent-layer rule)** — implementation_backend_layers, implementation_ai_service_architecture, implementation_adjacent_layer_rule, ai_services_contracts [INFERRED 0.85]
- **RAG Pipeline (index material and retrieve context)** — readme_rag_pipeline, ai_services_vector_store, ai_services_use_cases, docker_compose_db [INFERRED 0.85]
- **Tutor IA Chat Query Pipeline** — ai_services_tutor_ia, ai_services_prompt_modes, ai_services_use_cases, ai_services_e2e_flow, ai_services_vector_store [INFERRED 0.85]
- **Stack de tres microservicios** — docker_compose_backend, docker_compose_frontend, docker_compose_ai_service, docker_compose_db, docker_compose_redis [EXTRACTED 1.00]
- **Cadena RAG + base vectorial** — avance_rag, avance_pgvector, ia_modelos_y_prompts_patron_rag, ia_modelos_y_prompts_gemini_embedding_2, ia_modelos_y_prompts_task_type_embeddings [EXTRACTED 1.00]
- **Deuda que cerraron CU-P03/P04/A07** — prompts_desarrollo_corregir_ia_stub, prompts_desarrollo_rubricas_frontend_inertes, avance_cu_p03, avance_cu_p04, avance_cu_a07, avance_desvincular_rubrica, avance_esperado_rubrica [INFERRED 0.95]

## Communities (102 total, 22 thin omitted)

### Community 0 - "RAG Schemas and Indexing"
Cohesion: 0.06
Nodes (36): delete_material(), index_material(), index_material_file(), chat(), chat_stream(), corregir_entrega(), depurar(), examen() (+28 more)

### Community 1 - "Backend AI Client"
Cohesion: 0.06
Nodes (55): aiDisponible(), baseUrl(), ChatMessageInput, chatTutor(), CorreccionIARequest, CorreccionIAResult, DificultadExamen, ExamenIAResult (+47 more)

### Community 2 - "Admin Module"
Cohesion: 0.07
Nodes (55): actualizarEstado(), actualizarMateria(), asignarProfesor(), cambiarRol(), crearMateria(), crearUsuario(), estadoLicencia(), exportarReporte() (+47 more)

### Community 3 - "OCR and Document Extraction"
Cohesion: 0.05
Nodes (8): DocumentService, OcrService, _pdf_con_texto(), _png_1px(), TestDisponibilidad, TestFormatosSoportados, TestIntegracionConDocumentService, TestLimpieza

### Community 4 - "Content and Activity Services"
Cohesion: 0.08
Nodes (50): ActivityFormModal(), AYUDA, errorDeApi(), TIPOS, toInputDate(), key(), useCreateActivity(), useDeleteActivity() (+42 more)

### Community 5 - "Prompt Modes and Test Doubles"
Cohesion: 0.06
Nodes (15): TutorRequest, CacheService, FakeCorreccionLLM, FakeEmbeddings, FakeLLM, FakeRetrieval, test_ask_tutor_returns_answer_and_sources(), test_ask_tutor_second_call_is_cached() (+7 more)

### Community 6 - "Backend Integration Tests"
Cohesion: 0.09
Nodes (24): createApp(), corregirEntregaIA(), adapter, prisma, health(), errorHandler(), notFound(), resolverError() (+16 more)

### Community 7 - "App Shell and Navigation"
Cohesion: 0.12
Nodes (25): Header(), PROFILE_PATH_BY_ROLE, BADGE_CLASSES, ROLE_LABEL, Sidebar(), Icon(), IconKey, PATHS (+17 more)

### Community 8 - "Auth Service and Seed Data"
Cohesion: 0.09
Nodes (30): adapter, estadoAsistencia, fechaClase(), limpiar(), main(), prisma, signAccessToken(), login() (+22 more)

### Community 9 - "Tutor Frontend Services"
Cohesion: 0.11
Nodes (26): enviar(), useTutorChat(), ask(), obtenerSesion(), messageFromError(), useResumen(), resumir(), useSimulacro() (+18 more)

### Community 10 - "Shared UI Primitives"
Cohesion: 0.21
Nodes (20): Button(), CourseFilter(), Modal(), Table(), TableWrap(), Td(), Th(), Thead() (+12 more)

### Community 11 - "Activities and Rubrics Service"
Cohesion: 0.12
Nodes (31): ActualizarActividadInput, ActualizarRubricaInput, CorregirEntregaInput, CrearActividadInput, CrearRubricaInput, criterioRubricaSchema, criteriosSchema, EnviarEntregaInput (+23 more)

### Community 12 - "UI Components and Buttons"
Cohesion: 0.12
Nodes (21): DIFICULTAD_TAG, DIFICULTADES, ButtonProps, Size, SIZE_CLASSES, Variant, VARIANT_CLASSES, Card() (+13 more)

### Community 13 - "App Bootstrap and Env Config"
Cohesion: 0.09
Nodes (25): env, envSchema, parsed, logger, app, server, router, upload (+17 more)

### Community 14 - "Pinecone Test Doubles"
Cohesion: 0.10
Nodes (13): fake_pinecone(), FakeIndex, FakeMatch, FakePinecone, FakeQueryResponse, make_service(), test_close_closes_client(), test_creates_serverless_index_when_missing() (+5 more)

### Community 15 - "Analytics Module"
Cohesion: 0.12
Nodes (27): actualizarPregunta(), comprension(), crearPregunta(), dudas(), eliminarPregunta(), listarPreguntas(), progreso(), requireUser() (+19 more)

### Community 16 - "Content and File Upload"
Cohesion: 0.12
Nodes (26): asegurarDirectorioUploads(), eliminarArchivo(), guardarArchivo(), sanitizarBase(), UPLOADS_DIR, actualizar(), crear(), crearArchivo() (+18 more)

### Community 17 - "Retrieval and Material Generation"
Cohesion: 0.10
Nodes (5): _init_connection(), RetrievalService, test_generar_material_returns_material_and_sources(), use_case(), GenerarMaterialUseCase

### Community 18 - "Backend Package Manifest"
Cohesion: 0.07
Nodes (28): author, description, keywords, license, main, name, prisma, seed (+20 more)

### Community 19 - "Auth Middleware and Validation"
Cohesion: 0.21
Nodes (14): AccessTokenPayload, requireAuth(), requireRole(), validateBody(), router, router, router, router (+6 more)

### Community 20 - "Rubric and Assignment Modals"
Cohesion: 0.15
Nodes (22): AssignmentSubmitModal(), esVencida(), PLACEHOLDER, TITULO, Criterio, criterioVacio(), errorDeFormulario(), Props (+14 more)

### Community 21 - "Embeddings Service and App Factory"
Cohesion: 0.14
Nodes (7): create_app(), healthz(), lifespan(), EmbeddingsService, DepurarPromptUseCase, GenerarExamenUseCase, IndexMaterialUseCase

### Community 22 - "Router Tests and Auto-correction"
Cohesion: 0.12
Nodes (12): _build_app(), test_chat_endpoint(), test_chat_endpoint_validates_empty_question(), test_corregir_entrega_endpoint(), test_depurar_endpoint(), test_healthz(), test_index_material_file_empty_raises(), test_index_material_file_endpoint() (+4 more)

### Community 23 - "LLM Retry Tests"
Cohesion: 0.12
Nodes (12): es_error_transitorio(), _ClienteFalso, _Permanente, _Respuesta, _service_con(), _sin_espera(), test_es_error_transitorio_detecta_fallos_del_proveedor(), test_es_error_transitorio_ignora_errores_permanentes() (+4 more)

### Community 24 - "Pinecone Retrieval Service"
Cohesion: 0.13
Nodes (6): Settings, PineconeRetrievalService, build_retrieval_service(), test_build_pinecone_requires_api_key(), test_build_retrieval_service(), test_build_unknown_vector_store_raises()

### Community 25 - "Teacher Course Services"
Cohesion: 0.17
Nodes (18): usePlanning(), useSavePlanning(), useTeacherAssistant(), ask(), useTeacherCourseGrades(), useTeacherCourses(), useTeacherCourseStudents(), QUICK_ACTIONS (+10 more)

### Community 26 - "LLM Service and Gemini Client"
Cohesion: 0.12
Nodes (4): get_genai_client(), LLMService, llamada(), abrir()

### Community 27 - "Corrections and Rubrics Frontend"
Cohesion: 0.19
Nodes (21): useCorrectionQueue(), useCorrectWithAi(), useCreateRubric(), useDeleteRubric(), useInvalidateRubrics(), usePublishCorrection(), useRubrics(), useUpdateRubric() (+13 more)

### Community 28 - "AI Service Documentation"
Cohesion: 0.17
Nodes (16): Tutor Query End-to-End Flow, Tutor Prompt Modes (normal/socratic/hints/exam/summary), AI Service (Tutor IA) README, AI Service Production Dependencies, AI Service Dev Dependencies (pytest/ruff), AI Service Resource Encapsulation Layer, Tutor IA Chat Service (subject-contextualized), AI Service Use Case Orchestration (+8 more)

### Community 29 - "Activities Controller"
Cohesion: 0.17
Nodes (19): AppError, actualizar(), actualizarRubrica(), corregir(), corregirConIA(), crear(), crearRubrica(), eliminar() (+11 more)

### Community 30 - "Frontend TS Config App"
Cohesion: 0.09
Nodes (21): compilerOptions, allowImportingTsExtensions, composite, isolatedModules, jsx, lib, module, moduleDetection (+13 more)

### Community 31 - "Frontend Domain Types"
Cohesion: 0.12
Nodes (18): getPlanning(), PlanningItemApi, toPlanningClass(), AsistenciaApi, NotaApi, CorrectionQueueItem, PlanningAttachment, PlanningClass (+10 more)

### Community 32 - "Subjects and Enrollment Keys"
Cohesion: 0.17
Nodes (17): crear(), crearClave(), detalle(), mias(), unirse(), CrearClaveInput, crearClaveSchema, CreateMateriaInput (+9 more)

### Community 33 - "Admin Users Frontend"
Cohesion: 0.19
Nodes (18): invalidateUsers(), useAdminProfessors(), useAdminUsers(), useChangeAdminUserRole(), useCreateAdminUser(), useSetAdminUserActive(), AdminProfessor, AdminRolInput (+10 more)

### Community 34 - "Root Package Manifest"
Cohesion: 0.10
Nodes (19): description, devDependencies, concurrently, name, private, scripts, ai:setup, ai:test (+11 more)

### Community 35 - "Document Summary Use Case"
Cohesion: 0.16
Nodes (7): build_summary_prompt(), ChunkingService, test_chunk_text_empty_input(), test_chunk_text_preserves_whitespace_normalization(), test_chunk_text_short_document_returns_single_chunk(), test_chunk_text_splits_long_document(), ResumirDocumentoUseCase

### Community 36 - "Backend Dev Dependencies"
Cohesion: 0.11
Nodes (19): devDependencies, eslint, jest, supertest, @swc/core, @swc/jest, tsx, @types/bcryptjs (+11 more)

### Community 37 - "Notifications and Messaging Service"
Cohesion: 0.16
Nodes (12): assertUuid(), enviarMensaje(), obtenerMensajes(), CrearNotificacionInput, crearNotificacionSchema, tipoNotificacionSchema, crearNoLeidas(), listarMias() (+4 more)

### Community 38 - "Attendance Module"
Cohesion: 0.18
Nodes (15): actualizar(), listarPorMateria(), mías(), registrarDia(), ActualizarAsistenciaInput, actualizarAsistenciaSchema, estadosAsistencia, RegistraAsistenciaInput (+7 more)

### Community 39 - "Frontend Package Manifest"
Cohesion: 0.11
Nodes (17): description, typescript, name, private, type, version, autoprefixer, eslint (+9 more)

### Community 40 - "Frontend Dev Dependencies"
Cohesion: 0.11
Nodes (18): devDependencies, autoprefixer, eslint, eslint-plugin-react-hooks, jsdom, postcss, tailwindcss, @testing-library/jest-dom (+10 more)

### Community 41 - "Prompt Sanitizer and Chunking"
Cohesion: 0.21
Nodes (8): estimate_tokens(), sanitize_prompt(), _strip_leading_greeting(), test_collapses_repeated_punctuation(), test_empty_prompt_returns_empty(), test_pure_question_kept_intact(), test_removes_filler_words(), test_removes_leading_greeting()

### Community 42 - "Sections and Enrollment Guards"
Cohesion: 0.28
Nodes (15): verificarLecturaMateria(), assertUuid(), obtenerInscripcion(), obtenerProfesorAsignado(), assertUuid(), listarPlanning(), upsertPlanning(), validarFecha() (+7 more)

### Community 43 - "Grades Module"
Cohesion: 0.19
Nodes (14): actualizar(), crear(), listarPorMateria(), mías(), ActualizarNotaInput, actualizarNotaSchema, CrearNotaInput, crearNotaSchema (+6 more)

### Community 44 - "Frontend Routing and Pages"
Cohesion: 0.15
Nodes (16): App(), Shell(), AppShell(), AdminClavesPage(), AdminDashboardPage(), AdminMateriasPage(), AdminUsuariosPage(), messageFromError() (+8 more)

### Community 45 - "Frontend Auth Service"
Cohesion: 0.20
Nodes (15): AuthProvider(), readStoredUser(), refreshAccessToken(), AuthUser, loginRequest(), LoginResponse, logoutRequest(), mapUsuario() (+7 more)

### Community 46 - "Analytics Frontend"
Cohesion: 0.20
Nodes (15): useAnalytics(), AlertaApi, ComprensionApi, DudaApi, getFrequentErrors(), getFrequentQuestions(), getRiskAlerts(), getTopicUnderstanding() (+7 more)

### Community 47 - "Student Progress Service"
Cohesion: 0.21
Nodes (15): useProgress(), ESTADO_LABEL, getAttendanceLog(), getCourseGradeSummary(), getGradeDetail(), getProgreso(), getProgressOverview(), gradeColor() (+7 more)

### Community 48 - "Backend TS Config"
Cohesion: 0.12
Nodes (15): compilerOptions, declaration, esModuleInterop, forceConsistentCasingInFileNames, module, moduleResolution, outDir, resolveJsonModule (+7 more)

### Community 49 - "Admin Branding Frontend"
Cohesion: 0.22
Nodes (13): DEFAULT_INSTITUTION_NAME, MOCK_COLOR_PRESETS, useAdminSettings(), useSaveBranding(), AdminSettingsPage(), BrandingApi, getBranding(), getColorPresets() (+5 more)

### Community 50 - "Frontend TS Config Node"
Cohesion: 0.12
Nodes (15): compilerOptions, allowImportingTsExtensions, composite, isolatedModules, lib, module, moduleDetection, moduleResolution (+7 more)

### Community 51 - "Venv Bootstrap Scripts"
Cohesion: 0.15
Nodes (9): [binario, ...args], ejecutable, raiz, resultado, aiDir, pip, raiz, venvDir (+1 more)

### Community 52 - "Backend Runtime Dependencies"
Cohesion: 0.13
Nodes (15): dependencies, bcryptjs, cookie-parser, cors, dotenv, express, jsonwebtoken, multer (+7 more)

### Community 53 - "Messages Frontend"
Cohesion: 0.25
Nodes (13): useContacts(), useInbox(), useSendBroadcast(), useSendMessage(), TeacherMessagesPage(), ConversacionItem, formatWhen(), getAlumnosContactos() (+5 more)

### Community 54 - "Project Handoff Docs"
Cohesion: 0.16
Nodes (13): CU-A03 - Entregas del alumno, CU-A07 - Correccion de entregas con IA, CU-P03 - Gestion de actividades del docente, CU-P04 - Configuracion de rubricas por el docente, Desvincular rubrica (rubrica_id null), Deuda: cobertura de tests del frontend, esperado (criterio de rubrica), Pendiente: notificaciones en el frontend (+5 more)

### Community 55 - "Messages Controller"
Cohesion: 0.24
Nodes (11): rolSchema, enviarBroadcast(), enviarMensaje(), listarConversaciones(), obtenerMensajes(), requireUser(), router, BroadcastInput (+3 more)

### Community 56 - "Dashboard Module"
Cohesion: 0.21
Nodes (11): dashboard(), dashboardAlumno(), dashboardProfesor(), requireUser(), dashboard(), dashboardAdmin(), dashboardAlumno(), dashboardProfesor() (+3 more)

### Community 57 - "Student Course Detail Page"
Cohesion: 0.19
Nodes (11): ResumenPanel(), Pregunta(), SimulacroPanel(), useCourse(), useCourses(), MODO_BANNER, MODO_LABEL, MODO_NOMBRE (+3 more)

### Community 58 - "Cache Test Doubles"
Cohesion: 0.18
Nodes (4): FakeCache, stack(), subject_and_material(), test_index_chat_and_delete_pinecone()

### Community 59 - "Admin Reports and CSV Export"
Cohesion: 0.26
Nodes (10): useAdminReports(), useExportReport(), AdminReportsPage(), downloadCsv(), EXPORT_LABELS, exportReport(), ExportResult, getAdminReports() (+2 more)

### Community 60 - "Cloud Deploy Decision"
Cohesion: 0.17
Nodes (11): Indice HNSW nunca se crea (3072 > 2000), pgvector, Checklist antes de deployar, Opcion A: Fly.io (recomendacion tecnica), DB y ai-service en la misma region, Postgres con pgvector (sin definir), Opcion B: Railway, Opcion C: Render + Vercel (no recomendada) (+3 more)

### Community 61 - "Backend npm Scripts"
Cohesion: 0.17
Nodes (12): scripts, build, db:deploy, db:generate, db:migrate, db:seed, db:studio, dev (+4 more)

### Community 62 - "Branding Config Module"
Cohesion: 0.24
Nodes (9): getBranding(), updateBranding(), BrandingInput, brandingSchema, colorSchema, PRESETS_COLOR, getBranding(), obtenerOSingleton() (+1 more)

### Community 63 - "Enrollment Keys Frontend"
Cohesion: 0.30
Nodes (10): useAdminKeys(), useGenerateAdminKey(), useRevokeAdminKey(), EnrollmentKeyApi, generateAdminKey(), getAdminKeys(), NewKeyInput, revokeAdminKey() (+2 more)

### Community 64 - "Admin Subjects Frontend"
Cohesion: 0.29
Nodes (10): useAdminSubjects(), useAssignAdminProfessor(), useSaveAdminSubject(), assignAdminProfessor(), getAdminSubjects(), MateriaApi, saveAdminSubject(), SubjectSaveInput (+2 more)

### Community 65 - "Courses Frontend Service"
Cohesion: 0.23
Nodes (11): COLOR_PALETTE, colorDeMateria(), ContenidoDto, estadoUnidad(), getCourseById(), getCourses(), MateriaDto, SeccionDto (+3 more)

### Community 66 - "CI Pipeline and OCR Docs"
Cohesion: 0.20
Nodes (10): pytesseract + pdf2image + Pillow (CU-P02), CU-P02 - OCR de imagenes y PDF escaneado, OCR con tesseract + poppler, ai-service job (ruff + pytest), backend job (lint + typecheck + tests), frontend job (lint + typecheck + tests + build), pytest, ruff check src (+2 more)

### Community 67 - "Sections Module Schema"
Cohesion: 0.22
Nodes (9): actualizar(), crear(), eliminar(), listarPorMateria(), ActualizarSeccionInput, actualizarSeccionSchema, CrearSeccionInput, crearSeccionSchema (+1 more)

### Community 68 - "Dashboard Frontend Service"
Cohesion: 0.35
Nodes (9): useDashboard(), api(), DashboardAdmin, DashboardAlumno, DashboardProfesor, DashboardResumenComun, getDashboardAdmin(), getDashboardAlumno() (+1 more)

### Community 69 - "Assignments Frontend Service"
Cohesion: 0.25
Nodes (10): ArchivoSubido, EntregaApi, EntregaPayload, formatDue(), getAssignments(), toFormatos(), toStatus(), toSubmitted() (+2 more)

### Community 70 - "AI Models and Prompts Doc"
Cohesion: 0.20
Nodes (5): google-genai, gemini-3.5-flash-lite (modelo por defecto), Redis Dev Instance, Cache Redis con degradacion silenciosa, Gemini (Google AI Studio) como unico proveedor

### Community 71 - "Enrollment Frontend"
Cohesion: 0.29
Nodes (7): useEnrollment(), StudentEnrollPage(), ApiError, EnrollResult, enrollWithCode(), messageFromError(), sanitizeCode()

### Community 72 - "Admin Licensing Frontend"
Cohesion: 0.42
Nodes (7): useAdminLicensing(), AdminLicenciasPage(), EstadoLicenciaApi, getEstadoLicencia(), getLicensePlans(), getLicenseUsage(), LicensePlan

### Community 73 - "Planning Module"
Cohesion: 0.36
Nodes (6): listarPlanning(), requireUser(), upsertPlanning(), estadoPlanningSchema, UpsertPlanningInput, upsertPlanningSchema

### Community 74 - "Teacher AI Assistant Module"
Cohesion: 0.48
Nodes (4): generarMaterial(), router, GenerarMaterialInput, generarMaterialSchema

### Community 75 - "Frontend npm Scripts"
Cohesion: 0.29
Nodes (7): scripts, build, dev, lint, preview, test, typecheck

### Community 76 - "Docker Compose Services"
Cohesion: 0.33
Nodes (5): fastapi, RAG, 3 servicios = 3 cold starts, ai-service (Python/FastAPI), Patron central RAG con fuentes

### Community 77 - "Frontend Runtime Dependencies"
Cohesion: 0.40
Nodes (5): dependencies, react, react-dom, react-router-dom, @tanstack/react-query

### Community 78 - "Frontend Build Tooling"
Cohesion: 0.40
Nodes (3): vite, @vitejs/plugin-react, vitest

### Community 79 - "Project README"
Cohesion: 0.40
Nodes (3): Analytics Engine (interactions, grades, attendance), Auto-correction Engine (rubric + explanatory feedback), EduAI Project Plan (Práctica Profesionalizante 2)

## Knowledge Gaps
- **396 isolated node(s):** `Reporte`, `StatItem`, `AuthResult`, `PublicUsuario`, `ButtonProps` (+391 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 577 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **22 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `App Shell and Navigation` to `Content and Activity Services`, `Frontend Package Manifest`, `Tutor Frontend Services`, `Shared UI Primitives`, `UI Components and Buttons`, `Frontend Routing and Pages`, `Rubric and Assignment Modals`, `Teacher Course Services`, `Admin Reports and CSV Export`, `Student Course Detail Page`?**
  _High betweenness centrality (0.119) - this node is a cross-community bridge._
- **Are the 8 inferred relationships involving `LLMService` (e.g. with `lifespan()` and `stack()`) actually correct?**
  _`LLMService` has 8 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Reporte`, `StatItem`, `AuthResult` to the rest of the system?**
  _396 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `RAG Schemas and Indexing` be split into smaller, more focused modules?**
  _Cohesion score 0.06442307692307692 - nodes in this community are weakly interconnected._
- **Why does `express` connect `Auth Middleware and Validation` to `Backend AI Client`, `Admin Module`, `Backend Integration Tests`, `Auth Service and Seed Data`, `App Bootstrap and Env Config`, `Analytics Module`, `Content and File Upload`, `Backend Package Manifest`, `Activities Controller`, `Subjects and Enrollment Keys`, `Attendance Module`, `Grades Module`, `Messages Controller`, `Dashboard Module`, `Branding Config Module`, `Sections Module Schema`, `Planning Module`, `Teacher AI Assistant Module`, `Correction Controller`?**
  _High betweenness centrality (0.100) - this node is a cross-community bridge._
- **Should `Backend AI Client` be split into smaller, more focused modules?**
  _Cohesion score 0.06240084611316764 - nodes in this community are weakly interconnected._
- **Why does `@tanstack/react-query` connect `Content and Activity Services` to `Admin Subjects Frontend`, `Admin Users Frontend`, `Dashboard Frontend Service`, `Frontend Package Manifest`, `Admin Licensing Frontend`, `Corrections and Rubrics Frontend`, `Enrollment Frontend`, `App Shell and Navigation`, `Analytics Frontend`, `Student Progress Service`, `Admin Branding Frontend`, `Rubric and Assignment Modals`, `Messages Frontend`, `Student Course Detail Page`, `Admin Reports and CSV Export`, `Teacher Course Services`, `Enrollment Keys Frontend`?**
  _High betweenness centrality (0.095) - this node is a cross-community bridge._