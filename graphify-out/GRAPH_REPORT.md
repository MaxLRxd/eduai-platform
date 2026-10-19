# Graph Report - eduai-platform  (2026-10-18)

## Corpus Check
- 296 files · ~96,224 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1940 nodes · 4707 edges · 141 communities (83 shown, 43 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 196 edges (avg confidence: 0.89)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Admin Backend Controllers
- AI Services Core Config
- Pinecone Vector Retrieval
- Document OCR Processing
- Messaging Broadcast Backend
- Backend Core Auth Middleware
- Teacher Activity Editor UI
- AI Services Test Fakes
- Backend Dependencies
- AI Tutor Backend Module
- Frontend App Shell Layout
- Tutor Router Exam Prompts
- UI Table Filter Components
- Backend Package Manifest
- Activity Rubric Schemas
- Backend Bootstrap Health
- AI Client Contracts
- Student Dashboard Panels
- AI Prompts Cache Service
- Branding Admin Settings
- Analytics Backend Controller
- AI Correction Test Suite
- Student Tutor Chat UI
- Admin Users Management UI
- Auth Login JWT Flow
- LLM Retry Logic
- Admin Keys Subjects UI
- Teacher Content Upload UI
- Server Config Branding Backend
- Activities Grading Controller
- Course Enrollment Services
- Teacher Corrections Workflow UI
- Teacher Course Services
- Frontend App TSConfig
- Retrieval Service HNSW
- Subjects Backend Module
- Assignment Submission UI
- Chunking Service Tests
- Frontend Package Manifest
- Frontend Auth Context
- Root Workspace Scripts
- Retrieval Service Tests
- Attendance Backend Module
- Class Planning Backend
- Frontend Dev Dependencies
- Prompt Sanitization Layer
- Admin Reports UI
- Analytics Frontend Hooks
- Progress Tracking Frontend
- Error Handling Dashboards
- Backend TSConfig
- Teacher Planning UI
- Node TSConfig
- S3 Storage Config
- Grades Backend Module
- Form UI Primitives
- API Client Core
- Messages Frontend UI
- Notifications Frontend UI
- Courses Frontend Hooks
- Vector Store Migration Notes
- Backend Build Scripts
- Course Content Backend
- Course Sections Backend
- RAG Indexing Router
- Dashboard Frontend Hooks
- RAG Study Mode Design Docs
- Implementation Conventions Docs
- CI Pipeline Workflows
- Grading Correction Prompts
- Database Seed Script
- Teaching Material Generator
- Teacher AI Assistant UI
- Rubric Editor UI
- Admin Licensing UI
- Frontend Package Scripts
- Enrollment Code UI
- Venv Helper Script
- Venv Setup Script
- Frontend Core Dependencies
- Vite Vitest Config
- Redis Cache Degradation
- Gemini Model Selection
- OCR Use Case Docs
- Frontend TSConfig Root
- LLM Abstraction Layer Docs
- FastAPI Microservice Docs
- Prompt Sanitizer Docs
- SSE Streaming Docs
- AI Test Fakes Docs
- Venv Volume Pitfall
- Graceful Degradation Docs
- Email Notifications Docs
- Tutor Proxy Contracts
- Enrollment Listing Bugs
- Seed Data UI Bugs
- Cloud Deployment Docs
- Deploy Secrets Checklist
- ESLint React Config
- Anti Hallucination Prompting
- Mock First Strategy
- Session Logging Docs
- Material Generation Prompt
- Chunking Service Docs
- Embeddings Service Docs
- Asyncpg Dependency
- Fastapi Dependency
- Google Genai Dependency
- Pgvector Dependency
- Pinecone Dependency
- Archive Activity Note
- Branding Runtime Theming
- AI Message Mode Persistence
- R2 S3 Storage Note
- Response Envelope Bug
- Logo URL Bug
- Preset Persistence Bug
- Rubric Delivery Binding Bug
- Fly IO Deploy Recommendation
- Hints Prompt
- Socratic Prompt
- Summary Prompt
- RAG Pipeline Docs
- Scrum Methodology Docs
- Stack Selection Docs
- Success Metrics Docs

## God Nodes (most connected - your core abstractions)
1. `AppError` - 182 edges
2. `api()` - 59 edges
3. `react` - 56 edges
4. `express` - 41 edges
5. `obtenerProfesorAsignado()` - 40 edges
6. `RetrievalService` - 36 edges
7. `LLMService` - 30 edges
8. `prisma` - 27 edges
9. `Button()` - 27 edges
10. `useAuth()` - 27 edges

## Surprising Connections (you probably didn't know these)
- `Centralized error abstraction (star topology, load-bearing seam)` --rationale_for--> `AppError`  [EXTRACTED]
  graphify-out/memory/query_20260913_211720_0e476545_why_does_apperror_bridge_21_communities.md → backend/src/middlewares/error.ts
- `errorHandler()` --conceptually_related_to--> `Centralized error abstraction (star topology, load-bearing seam)`  [INFERRED]
  backend/src/middlewares/error.ts → graphify-out/memory/query_20260913_211720_0e476545_why_does_apperror_bridge_21_communities.md
- `Auto-correction Engine (planned)` --semantically_similar_to--> `Auto-correction Engine System Prompt`  [INFERRED] [semantically similar]
  README.md → IA_MODELOS_Y_PROMPTS.md
- `Query: Why does AppError bridge 21 communities?` --references--> `AppError`  [EXTRACTED]
  graphify-out/memory/query_20260913_211720_0e476545_why_does_apperror_bridge_21_communities.md → backend/src/middlewares/error.ts
- `HNSW Index Fix via 1536 Embedding Dimensions` --semantically_similar_to--> `Embedding Dimension Migration and Reindex`  [INFERRED] [semantically similar]
  AVANCE.md → ai-services/README.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **RAG Pipeline (index material and retrieve context)** — readme_rag_pipeline [INFERRED 0.85]
- **Layered Decoupled Architecture (adjacent-layer rule)** — implementation_backend_layers, implementation_ai_service_architecture, implementation_adjacent_layer_rule [INFERRED 0.85]
- **Centralized error-handling pattern (AppError star topology)** — backend_src_middlewares_error_apperror, backend_src_middlewares_error_errorhandler, backend_src_middlewares_error_notfound, backend_src_middlewares_error, graphify_out_memory_query_20260913_211720_0e476545_why_does_apperror_bridge_21_communities_centralized_error_abstraction [EXTRACTED 1.00]
- **Tutor Chat Query Pipeline (Cache → Prompt → Embed → Retrieve → LLM)** — ai_services_readme_ask_tutor_flow, ai_services_readme_llm_service, ai_services_readme_embeddings_service, ai_services_readme_retrieval_service_pgvector, ai_services_readme_cache_service [EXTRACTED 1.00]
- **Per-Use-Case System Prompt Suite** — ia_modelos_y_prompts_prompt_files, ia_modelos_y_prompts_prompt_tutor_normal, ia_modelos_y_prompts_prompt_socratic, ia_modelos_y_prompts_prompt_hints, ia_modelos_y_prompts_prompt_summary, ia_modelos_y_prompts_prompt_exam, ia_modelos_y_prompts_prompt_material, ia_modelos_y_prompts_prompt_correccion [EXTRACTED 1.00]
- **Common Root Cause Cluster for Teacher Module Bugs 3-9** — bugs_missing_creation_uis, bugs_seed_data_dependency, bugs_rubric_tied_to_selected_delivery, bugs_students_from_grades_not_enrollments [EXTRACTED 1.00]

## Communities (141 total, 43 thin omitted)

### Community 0 - "Admin Backend Controllers"
Cohesion: 0.06
Nodes (61): actualizarEstado(), actualizarMateria(), asignarProfesor(), cambiarRol(), crearMateria(), crearUsuario(), estadoLicencia(), exportarReporte() (+53 more)

### Community 1 - "AI Services Core Config"
Cohesion: 0.06
Nodes (26): get_genai_client(), Devuelve el cliente compartido de Gemini, creado de forma perezosa. Si la clave…, Settings, create_app(), healthz(), lifespan(), System prompt del asistente docente (CU-A09): generación de material didáctico., build_summary_prompt() (+18 more)

### Community 2 - "Pinecone Vector Retrieval"
Cohesion: 0.06
Nodes (29): PineconeRetrievalService, Búsqueda vectorial en Pinecone (serverless). Misma interfaz que…, Acceso a la base vectorial de material educativo indexado en Pinecone., build_retrieval_service(), _Embedder, Factory del vector store según la variable VECTOR_STORE (pgvector | pinecone)., Interfaz mínima que necesita el retrieval para reindexar., fake_pinecone() (+21 more)

### Community 3 - "Document OCR Processing"
Cohesion: 0.06
Nodes (19): DocumentService, Extracción de texto de documentos (PDF, DOCX, PPTX, TXT, imágenes)., Ultimo recurso: solo acepta algo que parezca texto de verdad. Sin este filtro,…, OcrService, Servicio de OCR para CU-P02: imagenes y PDF escaneado. Usa tesseract via…, Quita el ruido tipico de tesseract: lineas en blanco repetidas y espacios…, True si el binario de tesseract esta instalado. Se cachea el resultado., Transcribe una imagen a texto. Devuelve "" si no se puede. (+11 more)

### Community 4 - "Messaging Broadcast Backend"
Cohesion: 0.08
Nodes (37): rolSchema, enviarBroadcast(), enviarMensaje(), listarConversaciones(), obtenerMensajes(), requireUser(), BroadcastInput, broadcastSchema (+29 more)

### Community 5 - "Backend Core Auth Middleware"
Cohesion: 0.15
Nodes (28): env, envSchema, parsed, AccessTokenPayload, requireAuth(), requireRole(), validateBody(), router (+20 more)

### Community 6 - "Teacher Activity Editor UI"
Cohesion: 0.09
Nodes (37): ActivityFormModal(), AYUDA, errorDeApi(), TIPOS, toInputDate(), key(), useCreateActivity(), useDeleteActivity() (+29 more)

### Community 7 - "AI Services Test Fakes"
Cohesion: 0.09
Nodes (24): FakeCache, FakeCorreccionLLM, FakeEmbeddings, FakeLLM, FakeRetrieval, Fakes de los servicios externos para los tests del tutor IA., fixture, use_case() (+16 more)

### Community 8 - "Backend Dependencies"
Cohesion: 0.05
Nodes (40): dependencies, @aws-sdk/client-s3, @aws-sdk/lib-storage, bcryptjs, cookie-parser, cors, dotenv, express (+32 more)

### Community 9 - "AI Tutor Backend Module"
Cohesion: 0.10
Nodes (36): chatTutor(), registrarConsultaTutor(), crearSesion(), enviarMensaje(), examen(), extraerTextoSse(), listarMensajes(), listarSesiones() (+28 more)

### Community 10 - "Frontend App Shell Layout"
Cohesion: 0.09
Nodes (31): App(), AppShell(), Header(), BADGE_CLASSES, ROLE_LABEL, Sidebar(), IconKey, Role (+23 more)

### Community 11 - "Tutor Router Exam Prompts"
Cohesion: 0.12
Nodes (31): System prompt para la generación de simulacros de examen (CU-A08)., chat(), chat_stream(), corregir_entrega(), depurar(), examen(), generar_material(), post (+23 more)

### Community 12 - "UI Table Filter Components"
Cohesion: 0.18
Nodes (24): Button(), CourseFilter(), Table(), TableWrap(), Td(), Th(), Thead(), Tr() (+16 more)

### Community 13 - "Backend Package Manifest"
Cohesion: 0.05
Nodes (36): author, description, eslint, typescript, typescript-eslint, keywords, license, main (+28 more)

### Community 14 - "Activity Rubric Schemas"
Cohesion: 0.10
Nodes (35): ActualizarActividadInput, actualizarActividadSchema, ActualizarRubricaInput, actualizarRubricaSchema, CorregirEntregaInput, corregirEntregaSchema, CrearActividadInput, crearActividadSchema (+27 more)

### Community 15 - "Backend Bootstrap Health"
Cohesion: 0.09
Nodes (22): createApp(), adapter, prisma, asegurarDirectorioUploads(), health(), router, prismaMock, eliminarArchivoMock (+14 more)

### Community 16 - "AI Client Contracts"
Cohesion: 0.11
Nodes (32): aiDisponible(), baseUrl(), ChatMessageInput, CorreccionIARequest, CorreccionIAResult, corregirEntregaIA(), DificultadExamen, ExamenIAResult (+24 more)

### Community 17 - "Student Dashboard Panels"
Cohesion: 0.15
Nodes (19): PROFILE_PATH_BY_ROLE, ResumenPanel(), DIFICULTAD_TAG, DIFICULTADES, SimulacroPanel(), Card(), CardHeader(), Icon() (+11 more)

### Community 18 - "AI Prompts Cache Service"
Cohesion: 0.10
Nodes (18): System prompt del modo pistas sin revelar respuesta (CU-A06)., System prompt del modo estudio con metodología socrática (CU-A09)., System prompt del tutor IA en modo normal (CU-A04)., TutorRequest, CacheService, Servicio de cacheo en Redis para consultas y respuestas del tutor IA., Caché clave/valor con TTL. Degrada de forma silenciosa si Redis no está…, asyncio (+10 more)

### Community 19 - "Branding Admin Settings"
Cohesion: 0.13
Nodes (24): BrandingContext, BrandingContextValue, BrandingProvider(), useAdminSettings(), useSaveBranding(), queryClient, AdminSettingsPage(), getBranding() (+16 more)

### Community 20 - "Analytics Backend Controller"
Cohesion: 0.13
Nodes (27): actualizarPregunta(), comprension(), crearPregunta(), dudas(), eliminarPregunta(), listarPreguntas(), progreso(), requireUser() (+19 more)

### Community 21 - "AI Correction Test Suite"
Cohesion: 0.13
Nodes (19): System prompt del Auto-correction Engine (CU-A13): corrección de entregas con…, CorrectSubmissionRequest, CriterioRubrica, FakeLLMFueraDeRango, FakeLLMQueCapturaElPrompt, asyncio, Guarda el prompt para poder verificar qué recibe el modelo., test_correccion_devuelve_feedback_y_calificacion() (+11 more)

### Community 22 - "Student Tutor Chat UI"
Cohesion: 0.11
Nodes (22): enviar(), useTutorChat(), ask(), obtenerSesion(), messageFromError(), useResumen(), resumir(), limpiar() (+14 more)

### Community 23 - "Admin Users Management UI"
Cohesion: 0.15
Nodes (25): TagColor, invalidateUsers(), useAdminProfessors(), useAdminUsers(), useChangeAdminUserRole(), useCreateAdminUser(), useSetAdminUserActive(), AdminRolInput (+17 more)

### Community 24 - "Auth Login JWT Flow"
Cohesion: 0.15
Nodes (23): signAccessToken(), login(), logout(), me(), refresh(), register(), router, LoginInput (+15 more)

### Community 25 - "LLM Retry Logic"
Cohesion: 0.12
Nodes (21): es_error_transitorio(), True si el error del proveedor es transitorio y vale la pena reintentar., _ClienteFalso, _Permanente, asyncio, fixture, parametrize, Tests del reintento con backoff ante errores transitorios de Gemini. (+13 more)

### Community 26 - "Admin Keys Subjects UI"
Cohesion: 0.14
Nodes (22): useAdminKeys(), useGenerateAdminKey(), useRevokeAdminKey(), useAdminSubjects(), useAssignAdminProfessor(), useSaveAdminSubject(), AdminClavesPage(), AdminMateriasPage() (+14 more)

### Community 27 - "Teacher Content Upload UI"
Cohesion: 0.17
Nodes (23): useCourseSections(), useCreateSection(), useDeleteSection(), useUploadedMaterials(), useUploadMaterial(), useUploadMaterialFile(), FILE_ICON, RAG_COLOR (+15 more)

### Community 28 - "Server Config Branding Backend"
Cohesion: 0.13
Nodes (18): logger, app, server, getBranding(), getBrandingPublico(), subirLogo(), updateBranding(), BrandingInput (+10 more)

### Community 29 - "Activities Grading Controller"
Cohesion: 0.20
Nodes (21): AppError, actualizar(), actualizarRubrica(), corregir(), corregirConIA(), crear(), crearRubrica(), eliminar() (+13 more)

### Community 30 - "Course Enrollment Services"
Cohesion: 0.18
Nodes (22): listarPorMateria(), assertUuid(), listarInscriptos(), obtenerInscripcion(), obtenerProfesorAsignado(), actualizar(), crear(), listarMias() (+14 more)

### Community 31 - "Teacher Corrections Workflow UI"
Cohesion: 0.20
Nodes (22): errorDeFormulario(), useCorrectionQueue(), useCorrectWithAi(), useCreateRubric(), useDeleteRubric(), useInvalidateRubrics(), usePublishCorrection(), useRubrics() (+14 more)

### Community 32 - "Teacher Course Services"
Cohesion: 0.13
Nodes (20): AsistenciaApi, EnrolledStudent, fmtNum(), getCourseEnrolledStudents(), getDatosMateria(), getTeacherCourseGrades(), getTeacherCourseStudents(), NotaApi (+12 more)

### Community 33 - "Frontend App TSConfig"
Cohesion: 0.09
Nodes (21): compilerOptions, allowImportingTsExtensions, composite, isolatedModules, jsx, lib, module, moduleDetection (+13 more)

### Community 34 - "Retrieval Service HNSW"
Cohesion: 0.16
Nodes (8): _init_connection(), Búsqueda vectorial en PostgreSQL con pgvector., Acceso a la base vectorial de material educativo indexado., Si la tabla existente usa otra dimension, la recrea y devuelve las filas (id,…, RetrievalService, Connection, EmbedDocuments, Pool

### Community 35 - "Subjects Backend Module"
Cohesion: 0.17
Nodes (18): crear(), crearClave(), detalle(), inscriptos(), mias(), unirse(), CrearClaveInput, crearClaveSchema (+10 more)

### Community 36 - "Assignment Submission UI"
Cohesion: 0.16
Nodes (16): AssignmentSubmitModal(), esVencida(), PLACEHOLDER, TITULO, InfoBox(), Variant, VARIANT_CLASSES, Modal() (+8 more)

### Community 37 - "Chunking Service Tests"
Cohesion: 0.16
Nodes (14): ChunkingService, Divide textos largos en fragmentos aptos para embedding y contexto., test_chunk_text_empty_input(), test_chunk_text_preserves_whitespace_normalization(), test_chunk_text_short_document_returns_single_chunk(), test_chunk_text_splits_long_document(), asyncio, fixture (+6 more)

### Community 38 - "Frontend Package Manifest"
Cohesion: 0.10
Nodes (19): description, eslint, typescript, typescript-eslint, name, private, type, version (+11 more)

### Community 39 - "Frontend Auth Context"
Cohesion: 0.20
Nodes (15): AuthContext, AuthContextValue, AuthProvider(), readStoredUser(), User, AuthUser, loginRequest(), LoginResponse (+7 more)

### Community 40 - "Root Workspace Scripts"
Cohesion: 0.10
Nodes (19): description, devDependencies, concurrently, name, private, scripts, ai:setup, ai:test (+11 more)

### Community 41 - "Retrieval Service Tests"
Cohesion: 0.18
Nodes (7): FakeConn, FakePool, Tests del esquema/índice de pgvector y de la migración por dimensiones., _sql(), test_crea_tabla_con_dimension_configurada_e_indice_hnsw(), test_migra_y_reindexa_si_cambia_la_dimension(), test_no_migra_si_la_dimension_coincide()

### Community 42 - "Attendance Backend Module"
Cohesion: 0.20
Nodes (15): actualizar(), listarPorMateria(), mías(), registrarDia(), ActualizarAsistenciaInput, actualizarAsistenciaSchema, estadosAsistencia, RegistraAsistenciaInput (+7 more)

### Community 43 - "Class Planning Backend"
Cohesion: 0.24
Nodes (15): eliminarMaterial(), listarPlanning(), requireUser(), subirMaterial(), upsertPlanning(), estadoPlanningSchema, UpsertPlanningInput, upsertPlanningSchema (+7 more)

### Community 44 - "Frontend Dev Dependencies"
Cohesion: 0.11
Nodes (18): devDependencies, autoprefixer, eslint, eslint-plugin-react-hooks, jsdom, postcss, tailwindcss, @testing-library/jest-dom (+10 more)

### Community 45 - "Prompt Sanitization Layer"
Cohesion: 0.21
Nodes (12): estimate_tokens(), Estimación aproximada de tokens (código independiente del modelo)., Depuración de prompts de usuario (CU-SYS01)., Elimina saludos, muletillas y contenido irrelevante. Devuelve (prompt_depurado,…, sanitize_prompt(), _strip_leading_greeting(), test_collapses_repeated_punctuation(), test_empty_prompt_returns_empty() (+4 more)

### Community 46 - "Admin Reports UI"
Cohesion: 0.24
Nodes (14): useAdminReports(), useExportReport(), useExportReportPdf(), AdminReportsPage(), downloadCsv(), downloadPdf(), EXPORT_LABELS, ExportPdfResult (+6 more)

### Community 47 - "Analytics Frontend Hooks"
Cohesion: 0.20
Nodes (15): useAnalytics(), AlertaApi, ComprensionApi, DudaApi, getFrequentErrors(), getFrequentQuestions(), getRiskAlerts(), getTopicUnderstanding() (+7 more)

### Community 48 - "Progress Tracking Frontend"
Cohesion: 0.21
Nodes (15): useProgress(), ESTADO_LABEL, getAttendanceLog(), getCourseGradeSummary(), getGradeDetail(), getProgreso(), getProgressOverview(), gradeColor() (+7 more)

### Community 49 - "Error Handling Dashboards"
Cohesion: 0.24
Nodes (13): errorHandler(), notFound(), resolverError(), dashboard(), dashboardAlumno(), dashboardProfesor(), requireUser(), dashboard() (+5 more)

### Community 50 - "Backend TSConfig"
Cohesion: 0.12
Nodes (15): compilerOptions, declaration, esModuleInterop, forceConsistentCasingInFileNames, module, moduleResolution, outDir, resolveJsonModule (+7 more)

### Community 51 - "Teacher Planning UI"
Cohesion: 0.22
Nodes (14): useDeletePlanningMaterial(), useSavePlanning(), useUploadPlanningMaterial(), shortDate(), TeacherPlanningPage(), API_URL, deletePlanningMaterial(), getPlanning() (+6 more)

### Community 52 - "Node TSConfig"
Cohesion: 0.12
Nodes (15): compilerOptions, allowImportingTsExtensions, composite, isolatedModules, lib, module, moduleDetection, moduleResolution (+7 more)

### Community 53 - "S3 Storage Config"
Cohesion: 0.18
Nodes (13): clienteS3(), formatoDe(), guardarArchivo(), normalizarEndpoint(), prefijoPublico(), sanitizarBase(), StorageProvider, StoredFile (+5 more)

### Community 54 - "Grades Backend Module"
Cohesion: 0.18
Nodes (12): actualizar(), crear(), listarPorMateria(), mías(), ActualizarNotaInput, actualizarNotaSchema, CrearNotaInput, crearNotaSchema (+4 more)

### Community 55 - "Form UI Primitives"
Cohesion: 0.16
Nodes (11): ButtonProps, Size, SIZE_CLASSES, Variant, VARIANT_CLASSES, FormField(), FormFieldProps, NOTIFICATIONS (+3 more)

### Community 56 - "API Client Core"
Cohesion: 0.24
Nodes (11): useSaveAttendance(), api(), ApiError, getHealth(), refreshAccessToken(), AsistenciaApi, FRONT_TO_BACK, getAttendanceState() (+3 more)

### Community 57 - "Messages Frontend UI"
Cohesion: 0.25
Nodes (13): useContacts(), useInbox(), useSendBroadcast(), useSendMessage(), TeacherMessagesPage(), ConversacionItem, formatWhen(), getAlumnosContactos() (+5 more)

### Community 58 - "Notifications Frontend UI"
Cohesion: 0.27
Nodes (12): useMarcarLeida(), useMarcarTodasLeidas(), useNotificaciones(), NotificacionesPage(), getNoLeidasCount(), getNotificaciones(), marcarLeida(), marcarTodasLeidas() (+4 more)

### Community 59 - "Courses Frontend Hooks"
Cohesion: 0.22
Nodes (12): useCourse(), COLOR_PALETTE, colorDeMateria(), ContenidoDto, estadoUnidad(), getCourseById(), getCourses(), MateriaDto (+4 more)

### Community 60 - "Vector Store Migration Notes"
Cohesion: 0.15
Nodes (13): Embedding Dimension Migration and Reindex, pinecone_service.py Pinecone Access, retrieval_service.py pgvector Access, vector_store.py build_retrieval_service Factory, Cloud Deploy Decision Blocking Delivery, Three-Service Cold Start Trap, HNSW Index Fix via 1536 Embedding Dimensions, Vector Store Switch Requires Manual Reindex (+5 more)

### Community 61 - "Backend Build Scripts"
Cohesion: 0.17
Nodes (12): scripts, build, db:deploy, db:generate, db:migrate, db:seed, db:studio, dev (+4 more)

### Community 62 - "Course Content Backend"
Cohesion: 0.27
Nodes (10): actualizar(), crear(), crearArchivo(), eliminar(), listarPorSeccion(), ActualizarContenidoInput, actualizarContenidoSchema, CrearContenidoInput (+2 more)

### Community 63 - "Course Sections Backend"
Cohesion: 0.29
Nodes (9): actualizar(), crear(), eliminar(), listarPorMateria(), ActualizarSeccionInput, actualizarSeccionSchema, CrearSeccionInput, crearSeccionSchema (+1 more)

### Community 64 - "RAG Indexing Router"
Cohesion: 0.29
Nodes (9): delete_material(), index_material(), index_material_file(), post, Router RAG: indexación y eliminación de materiales (alimenta el tutor IA)., IndexMaterialRequest, IndexMaterialResponse, delete (+1 more)

### Community 65 - "Dashboard Frontend Hooks"
Cohesion: 0.33
Nodes (8): useDashboard(), DashboardAdmin, DashboardAlumno, DashboardProfesor, DashboardResumenComun, getDashboardAdmin(), getDashboardAlumno(), getDashboardProfesor()

### Community 66 - "RAG Study Mode Design Docs"
Cohesion: 0.22
Nodes (9): AskTutorUseCase Chat Flow, Routers/UseCases/Services Layer Architecture, D2: RAG-Based Tutor Instead of Bare LLM, D3: Prompts Separated from Code per Use Case, D8: Study Modes as One Endpoint with Mode Prompts, Per-Use-Case Prompt Files (src/prompts/*.py), RAG Pattern over Official Subject Material, Tutor Study Modes (normal/socratic/hints) (+1 more)

### Community 67 - "Implementation Conventions Docs"
Cohesion: 0.25
Nodes (9): AI Service Dev Dependencies (pytest/ruff), Frontend SPA Entry (index.html), Adjacent-Layer Communication Rule, AI Service (Python/FastAPI) Architecture, Backend Layered Architecture (routes/controllers/services/base), No Hardcoded Configuration, EduAI Implementation Document v1.1, Prompts Kept Out of Code (+1 more)

### Community 68 - "CI Pipeline Workflows"
Cohesion: 0.25
Nodes (9): pytesseract + pdf2image + Pillow (CU-P02), ai-service job (ruff + pytest), backend job (lint + typecheck + tests), CI Pipeline (3 jobs), frontend job (lint + typecheck + tests + build), pytest, ruff check src, actions/setup-node@v4 (Node 22) (+1 more)

### Community 69 - "Grading Correction Prompts"
Cohesion: 0.22
Nodes (9): Rubric 'esperado' Criterion Injected into Correction Prompt, D10: Argentine 0-10 Scale and Default Rubric, D4: Strict JSON Contracts for Structured Output, Auto-correction Engine System Prompt, Exam Mock System Prompt (Strict JSON), Contract Before Implementation Lesson, CorreccionEntregaUseCase (correct_submission), Reuse Existing Patterns Lesson (+1 more)

### Community 70 - "Database Seed Script"
Cohesion: 0.28
Nodes (8): adapter, estadoAsistencia, fechaClase(), limpiar(), main(), prisma, bcryptjs, @prisma/adapter-pg

### Community 71 - "Teaching Material Generator"
Cohesion: 0.42
Nodes (6): generarMaterialDocente(), generarMaterial(), GenerarMaterialInput, generarMaterialSchema, assertUuid(), generarMaterial()

### Community 72 - "Teacher AI Assistant UI"
Cohesion: 0.39
Nodes (6): usePlanning(), useTeacherAssistant(), ask(), QUICK_ACTIONS, TeacherAIPage(), askTeacherAssistant()

### Community 73 - "Rubric Editor UI"
Cohesion: 0.36
Nodes (7): Criterio, criterioVacio(), Props, RubricFormModal(), RubricCriterionInput, RubricInput, Rubric

### Community 74 - "Admin Licensing UI"
Cohesion: 0.50
Nodes (6): useAdminLicensing(), EstadoLicenciaApi, getEstadoLicencia(), getLicensePlans(), getLicenseUsage(), LicensePlan

### Community 75 - "Frontend Package Scripts"
Cohesion: 0.29
Nodes (7): scripts, build, dev, lint, preview, test, typecheck

### Community 76 - "Enrollment Code UI"
Cohesion: 0.48
Nodes (5): useEnrollment(), EnrollResult, enrollWithCode(), messageFromError(), sanitizeCode()

### Community 77 - "Venv Helper Script"
Cohesion: 0.33
Nodes (5): [binario, ...args], ejecutable, raiz, resultado, venvDir

### Community 78 - "Venv Setup Script"
Cohesion: 0.33
Nodes (4): aiDir, pip, raiz, venvDir

### Community 79 - "Frontend Core Dependencies"
Cohesion: 0.40
Nodes (5): dependencies, react, react-dom, react-router-dom, @tanstack/react-query

### Community 81 - "Redis Cache Degradation"
Cohesion: 0.67
Nodes (3): cache_service.py Redis TTL Cache, Redis Optional via Silent Cache Degradation, D6: Redis Cache with Silent Degradation

### Community 82 - "Gemini Model Selection"
Cohesion: 0.67
Nodes (3): Gemini 503 Retries with Exponential Backoff, Gemini Flash Model Selection Rationale, Planned LLM Providers (OpenAI GPT-4o / Claude)

### Community 83 - "OCR Use Case Docs"
Cohesion: 0.67
Nodes (3): OCR for Images and Scanned PDFs (CU-P02), EduAI Platform Project README, Use Case Catalog (Anexo B)

## Ambiguous Edges - Review These
- `Tutor Resumen/Examen Proxied from Node` → `Contracts Table with Node Backend`  [AMBIGUOUS]
  AVANCE.md · relation: conceptually_related_to
- `Gemini Flash Model Selection Rationale` → `Planned LLM Providers (OpenAI GPT-4o / Claude)`  [AMBIGUOUS]
  README.md · relation: conceptually_related_to

## Knowledge Gaps
- **468 isolated node(s):** `name`, `version`, `description`, `main`, `dev` (+463 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 673 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **43 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Tutor Resumen/Examen Proxied from Node` and `Contracts Table with Node Backend`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Gemini Flash Model Selection Rationale` and `Planned LLM Providers (OpenAI GPT-4o / Claude)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `AppError` connect `Activities Grading Controller` to `Admin Backend Controllers`, `Messaging Broadcast Backend`, `Backend Core Auth Middleware`, `AI Tutor Backend Module`, `Activity Rubric Schemas`, `AI Client Contracts`, `Analytics Backend Controller`, `Auth Login JWT Flow`, `Server Config Branding Backend`, `Course Enrollment Services`, `Subjects Backend Module`, `Attendance Backend Module`, `Class Planning Backend`, `Error Handling Dashboards`, `S3 Storage Config`, `Grades Backend Module`, `Course Content Backend`, `Course Sections Backend`, `Teaching Material Generator`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Why does `react` connect `Student Dashboard Panels` to `Assignment Submission UI`, `Frontend Package Manifest`, `Teacher Activity Editor UI`, `Frontend Auth Context`, `Rubric Editor UI`, `Frontend App Shell Layout`, `Teacher AI Assistant UI`, `UI Table Filter Components`, `Admin Reports UI`, `Branding Admin Settings`, `Admin Users Management UI`, `Student Tutor Chat UI`, `Form UI Primitives`, `Teacher Content Upload UI`, `Teacher Corrections Workflow UI`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Why does `express` connect `Backend Core Auth Middleware` to `Admin Backend Controllers`, `Subjects Backend Module`, `Messaging Broadcast Backend`, `Teaching Material Generator`, `AI Tutor Backend Module`, `Attendance Backend Module`, `Class Planning Backend`, `Backend Package Manifest`, `Backend Bootstrap Health`, `Error Handling Dashboards`, `Analytics Backend Controller`, `Grades Backend Module`, `Auth Login JWT Flow`, `Server Config Branding Backend`, `Activities Grading Controller`, `Course Content Backend`, `Course Sections Backend`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `api()` (e.g. with `adminSettings.service.test.ts` and `config.service.test.ts`) actually correct?**
  _`api()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `version`, `description` to the rest of the system?**
  _468 weakly-connected nodes found - possible documentation gaps or missing edges._