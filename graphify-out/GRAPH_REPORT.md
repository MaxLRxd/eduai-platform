# Graph Report - eduai-platform  (2026-09-13)

## Corpus Check
- 264 files · ~63,921 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1465 nodes · 3621 edges · 95 communities (75 shown, 6 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 164 edges (avg confidence: 0.9)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Admin User & Role Management
- Pinecone Vector Store
- App Shell & Routing UI
- Frontend AI API Client
- Test Fakes & Mocks
- Tutor AI & RAG Routers
- Core UI Components
- AI App Bootstrap & Settings
- Card & Stat UI Components
- Project Docs & CI Pipeline
- Backend Package Metadata
- Admin Users & Modals
- Auth & Validation Middleware
- Analytics & Questions API
- Frontend Mock Data
- Tutor Prompts & Chunking
- Activities Routes & Schemas
- Auth Controller & Signing
- Cache Service Layer
- Analytics Dashboard Hooks
- App TSConfig
- Material Generation & Prisma
- Chunking Service & Tests
- Frontend Package Metadata
- Form & Correction UI
- Root Workspace Package
- Academic CRUD Services
- Sections Controller & Schemas
- Frontend Dev Tooling
- Backend Dev Tooling
- Materias Controller & Schemas
- Student Progress Service
- Auto-correction Engine
- App Entry & Env Config
- Backend TSConfig
- Auth Context & API Layer
- Courses Mock & Service
- Node TSConfig
- Exam Generation Engine
- PGVector Retrieval Service
- Messaging & Inbox UI
- Teacher AI Assistant
- Student Tutor Chat
- System & Dashboard Controllers
- Branding Config API
- Notifications Service
- Admin Settings Hooks
- Teacher Courses Hooks
- Admin Keys & Subjects
- Content Upload Hooks
- Backend Runtime Dependencies
- Messaging Controllers
- Attendance CRUD
- Contenidos Controller
- Attendance Hooks
- Admin Reports & CSV Export
- Activities & Error Handling
- Grades Controller & Schemas
- Doc Summary Prompts & UseCase
- Attendance Routes & Schemas
- Assignments Hooks
- Admin Subjects Hooks
- Backend npm Scripts
- Contenidos Service & Indexing
- Planning API
- Corrections Queue Hooks
- Database Seed Script
- Dashboard Aggregation Service
- Enrollment Hooks
- Frontend API Core
- Admin Licensing Hooks
- Document Text Extraction
- Assistant Material API
- Frontend npm Scripts
- Planning Hooks
- Core Frontend Dependencies
- ESLint Configs
- Enrollment Mock Data
- Frontend TSConfig
- Vite Config
- Prisma Seed Utilities

## God Nodes (most connected - your core abstractions)
1. `AppError` - 150 edges
2. `react` - 48 edges
3. `api()` - 43 edges
4. `express` - 41 edges
5. `obtenerProfesorAsignado()` - 35 edges
6. `RetrievalService` - 28 edges
7. `LLMService` - 25 edges
8. `useAuth()` - 25 edges
9. `EmbeddingsService` - 24 edges
10. `_build_app()` - 21 edges

## Surprising Connections (you probably didn't know these)
- `Contextual AI Tutor per Subject` --semantically_similar_to--> `Tutor IA Chat Service (subject-contextualized)`  [INFERRED] [semantically similar]
  README.md → ai-services/README.md
- `Auto-correction Engine (rubric + explanatory feedback)` --semantically_similar_to--> `AI Service Use Case Orchestration`  [AMBIGUOUS] [semantically similar]
  README.md → ai-services/README.md
- `Backend Layered Architecture (routes/controllers/services/base)` --semantically_similar_to--> `AI Service Use Case Orchestration`  [INFERRED] [semantically similar]
  IMPLEMENTATION.md → ai-services/README.md
- `Prompts Kept Out of Code` --semantically_similar_to--> `Tutor Prompt Modes (normal/socratic/hints/exam/summary)`  [INFERRED] [semantically similar]
  IMPLEMENTATION.md → ai-services/README.md
- `RAG Pipeline for Study Material` --semantically_similar_to--> `Vector Store Abstraction (pgvector/Pinecone)`  [INFERRED] [semantically similar]
  README.md → ai-services/README.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **RAG Pipeline (index material and retrieve context)** — readme_rag_pipeline, ai_services_vector_store, ai_services_use_cases, docker_compose_db [INFERRED 0.85]
- **Layered Decoupled Architecture (adjacent-layer rule)** — implementation_backend_layers, implementation_ai_service_architecture, implementation_adjacent_layer_rule, ai_services_contracts [INFERRED 0.85]
- **Tutor IA Chat Query Pipeline** — ai_services_tutor_ia, ai_services_prompt_modes, ai_services_use_cases, ai_services_e2e_flow, ai_services_vector_store [INFERRED 0.85]

## Communities (95 total, 6 thin omitted)

### Community 0 - "Admin User & Role Management"
Cohesion: 0.07
Nodes (55): actualizarEstado(), actualizarMateria(), asignarProfesor(), cambiarRol(), crearMateria(), crearUsuario(), estadoLicencia(), exportarReporte() (+47 more)

### Community 1 - "Pinecone Vector Store"
Cohesion: 0.06
Nodes (26): PineconeRetrievalService, Búsqueda vectorial en Pinecone (serverless). Misma interfaz que…, Acceso a la base vectorial de material educativo indexado en Pinecone., build_retrieval_service(), Factory del vector store según la variable VECTOR_STORE (pgvector | pinecone)., fake_pinecone(), FakeIndex, FakeMatch (+18 more)

### Community 2 - "App Shell & Routing UI"
Cohesion: 0.09
Nodes (33): App(), AppShell(), Header(), PROFILE_PATH_BY_ROLE, BADGE_CLASSES, ROLE_LABEL, Sidebar(), Icon() (+25 more)

### Community 3 - "Frontend AI API Client"
Cohesion: 0.10
Nodes (34): aiDisponible(), baseUrl(), ChatMessageInput, chatTutor(), CorreccionIARequest, CorreccionIAResult, IndexMaterialResult, MaterialDocenteResult (+26 more)

### Community 4 - "Test Fakes & Mocks"
Cohesion: 0.09
Nodes (21): FakeCache, FakeCorreccionLLM, FakeEmbeddings, FakeLLM, FakeRetrieval, Fakes de los servicios externos para los tests del tutor IA., fixture, use_case() (+13 more)

### Community 5 - "Tutor AI & RAG Routers"
Cohesion: 0.11
Nodes (34): delete_material(), index_material(), post, Router RAG: indexación y eliminación de materiales (alimenta el tutor IA)., chat(), chat_stream(), corregir_entrega(), depurar() (+26 more)

### Community 6 - "Core UI Components"
Cohesion: 0.17
Nodes (25): Button(), ButtonProps, Size, SIZE_CLASSES, Variant, VARIANT_CLASSES, CourseFilter(), Table() (+17 more)

### Community 7 - "AI App Bootstrap & Settings"
Cohesion: 0.11
Nodes (16): get_genai_client(), Settings, create_app(), healthz(), lifespan(), System prompt del asistente docente (CU-A09): generación de material didáctico., EmbeddingsService, Servicio de embeddings sobre la API de Gemini. (+8 more)

### Community 8 - "Card & Stat UI Components"
Cohesion: 0.17
Nodes (19): Card(), CardHeader(), ProgressBar(), StatCard(), COLOR_CLASSES, Tag(), TagColor, useSaveBranding() (+11 more)

### Community 9 - "Project Docs & CI Pipeline"
Cohesion: 0.12
Nodes (33): CI Pipeline (GitHub Actions), Graceful Redis Cache Degradation, Pydantic Schemas as Backend-Service Contracts, Tutor Query End-to-End Flow, Tutor Prompt Modes (normal/socratic/hints/exam/summary), AI Service (Tutor IA) README, AI Service Production Dependencies, AI Service Dev Dependencies (pytest/ruff) (+25 more)

### Community 10 - "Backend Package Metadata"
Cohesion: 0.07
Nodes (28): author, description, typescript, keywords, license, main, name, type (+20 more)

### Community 11 - "Admin Users & Modals"
Cohesion: 0.14
Nodes (25): Modal(), invalidateUsers(), useAdminProfessors(), useAdminUsers(), useChangeAdminUserRole(), useCreateAdminUser(), useSetAdminUserActive(), AdminRolInput (+17 more)

### Community 12 - "Auth & Validation Middleware"
Cohesion: 0.12
Nodes (20): AccessTokenPayload, requireAuth(), requireRole(), validateBody(), router, actualizarPreguntaFrecuenteSchema, crearPreguntaFrecuenteSchema, router (+12 more)

### Community 13 - "Analytics & Questions API"
Cohesion: 0.14
Nodes (24): actualizarPregunta(), comprension(), crearPregunta(), dudas(), eliminarPregunta(), listarPreguntas(), progreso(), requireUser() (+16 more)

### Community 14 - "Frontend Mock Data"
Cohesion: 0.09
Nodes (22): ADMIN_PROFESSORS, MOCK_ADMIN_SUBJECTS, CONTENT_SECTIONS, MOCK_UPLOADED_MATERIALS, MOCK_CORRECTION_QUEUE, MOCK_RUBRIC_CRITERIA, MOCK_RUBRICS, MOCK_INBOX (+14 more)

### Community 15 - "Tutor Prompts & Chunking"
Cohesion: 0.12
Nodes (17): System prompt del modo pistas sin revelar respuesta (CU-A06)., System prompt del modo estudio con metodología socrática (CU-A09)., System prompt del tutor IA en modo normal (CU-A04)., estimate_tokens(), Estimación aproximada de tokens (código independiente del modelo)., Depuración de prompts de usuario (CU-SYS01)., Elimina saludos, muletillas y contenido irrelevante. Devuelve (prompt_depurado,…, sanitize_prompt() (+9 more)

### Community 16 - "Activities Routes & Schemas"
Cohesion: 0.15
Nodes (23): router, ActualizarActividadInput, actualizarActividadSchema, CorregirEntregaInput, corregirEntregaSchema, CrearActividadInput, crearActividadSchema, CrearRubricaInput (+15 more)

### Community 17 - "Auth Controller & Signing"
Cohesion: 0.17
Nodes (20): signAccessToken(), login(), logout(), me(), refresh(), register(), LoginInput, RegisterInput (+12 more)

### Community 18 - "Cache Service Layer"
Cohesion: 0.13
Nodes (12): TutorRequest, CacheService, Servicio de cacheo en Redis para consultas y respuestas del tutor IA., Caché clave/valor con TTL. Degrada de forma silenciosa si Redis no está…, asyncio, test_ask_tutor_returns_answer_and_sources(), test_ask_tutor_second_call_is_cached(), test_ask_tutor_stream_yields_tokens_and_done() (+4 more)

### Community 19 - "Analytics Dashboard Hooks"
Cohesion: 0.15
Nodes (19): MOCK_FREQUENT_ERRORS, MOCK_FREQUENT_QUESTIONS, MOCK_RISK_ALERTS, MOCK_TOPIC_UNDERSTANDING, useAnalytics(), AlertaApi, ComprensionApi, DudaApi (+11 more)

### Community 20 - "App TSConfig"
Cohesion: 0.09
Nodes (21): compilerOptions, allowImportingTsExtensions, composite, isolatedModules, jsx, lib, module, moduleDetection (+13 more)

### Community 21 - "Material Generation & Prisma"
Cohesion: 0.14
Nodes (13): corregirEntregaIA(), generarMaterialDocente(), adapter, prisma, assertUuid(), generarMaterial(), assertUuid(), generarCorreccionIA() (+5 more)

### Community 22 - "Chunking Service & Tests"
Cohesion: 0.16
Nodes (14): ChunkingService, Divide textos largos en fragmentos aptos para embedding y contexto., test_chunk_text_empty_input(), test_chunk_text_preserves_whitespace_normalization(), test_chunk_text_short_document_returns_single_chunk(), test_chunk_text_splits_long_document(), asyncio, fixture (+6 more)

### Community 23 - "Frontend Package Metadata"
Cohesion: 0.10
Nodes (19): description, typescript, name, private, type, version, autoprefixer, eslint (+11 more)

### Community 24 - "Form & Correction UI"
Cohesion: 0.14
Nodes (15): FormField(), FormFieldProps, InfoBox(), Variant, VARIANT_CLASSES, usePublishCorrection(), useRubricCriteria(), NOTIFICATIONS (+7 more)

### Community 25 - "Root Workspace Package"
Cohesion: 0.10
Nodes (19): description, devDependencies, concurrently, name, private, scripts, ai:setup, ai:test (+11 more)

### Community 26 - "Academic CRUD Services"
Cohesion: 0.21
Nodes (17): crear(), crearRubrica(), listarPorMateria(), listarRubricas(), verificarLecturaMateria(), obtenerInscripcion(), obtenerProfesorAsignado(), actualizar() (+9 more)

### Community 27 - "Sections Controller & Schemas"
Cohesion: 0.22
Nodes (15): assertUuid(), actualizar(), crear(), eliminar(), listarPorMateria(), ActualizarSeccionInput, CrearSeccionInput, tipoSeccionSchema (+7 more)

### Community 28 - "Frontend Dev Tooling"
Cohesion: 0.11
Nodes (18): devDependencies, autoprefixer, eslint, eslint-plugin-react-hooks, jsdom, postcss, tailwindcss, @testing-library/jest-dom (+10 more)

### Community 29 - "Backend Dev Tooling"
Cohesion: 0.12
Nodes (17): devDependencies, jest, prisma, supertest, @swc/core, @swc/jest, tsx, @types/bcryptjs (+9 more)

### Community 30 - "Materias Controller & Schemas"
Cohesion: 0.24
Nodes (14): crear(), crearClave(), detalle(), mias(), unirse(), CrearClaveInput, CreateMateriaInput, UnirseInput (+6 more)

### Community 31 - "Student Progress Service"
Cohesion: 0.21
Nodes (15): useProgress(), ESTADO_LABEL, getAttendanceLog(), getCourseGradeSummary(), getGradeDetail(), getProgreso(), getProgressOverview(), gradeColor() (+7 more)

### Community 32 - "Auto-correction Engine"
Cohesion: 0.22
Nodes (9): System prompt del Auto-correction Engine (CU-A13): corrección de entregas con…, CorrectSubmissionRequest, FakeLLMFueraDeRango, asyncio, test_correccion_devuelve_feedback_y_calificacion(), test_correccion_recorta_calificacion_fuera_de_rango(), test_correccion_sin_rubrica_usa_por_defecto(), CorreccionEntregaUseCase (+1 more)

### Community 33 - "App Entry & Env Config"
Cohesion: 0.22
Nodes (10): createApp(), env, envSchema, parsed, logger, app, server, errorHandler() (+2 more)

### Community 34 - "Backend TSConfig"
Cohesion: 0.12
Nodes (15): compilerOptions, declaration, esModuleInterop, forceConsistentCasingInFileNames, module, moduleResolution, outDir, resolveJsonModule (+7 more)

### Community 35 - "Auth Context & API Layer"
Cohesion: 0.23
Nodes (13): AuthProvider(), readStoredUser(), getHealth(), refreshAccessToken(), AuthUser, loginRequest(), LoginResponse, logoutRequest() (+5 more)

### Community 36 - "Courses Mock & Service"
Cohesion: 0.18
Nodes (13): MOCK_COURSES, useCourse(), COLOR_PALETTE, colorDeMateria(), ContenidoDto, estadoUnidad(), getCourseById(), getCourses() (+5 more)

### Community 37 - "Node TSConfig"
Cohesion: 0.12
Nodes (15): compilerOptions, allowImportingTsExtensions, composite, isolatedModules, lib, module, moduleDetection, moduleResolution (+7 more)

### Community 38 - "Exam Generation Engine"
Cohesion: 0.23
Nodes (9): System prompt para la generación de simulacros de examen (CU-A08)., ExamRequest, ExamResponse, GenerarExamenUseCase, Caso de uso CU-A08: generación de simulacros de examen basados en el material., build_sources(), format_context(), Helpers compartidos por los casos de uso. (+1 more)

### Community 39 - "PGVector Retrieval Service"
Cohesion: 0.19
Nodes (6): _init_connection(), Búsqueda vectorial en PostgreSQL con pgvector., Acceso a la base vectorial de material educativo indexado., RetrievalService, Connection, Pool

### Community 40 - "Messaging & Inbox UI"
Cohesion: 0.30
Nodes (12): useContacts(), useInbox(), useSendBroadcast(), useSendMessage(), TeacherMessagesPage(), ConversacionItem, formatWhen(), getAlumnosContactos() (+4 more)

### Community 41 - "Teacher AI Assistant"
Cohesion: 0.26
Nodes (10): usePlanning(), useSavePlanning(), useTeacherAssistant(), ask(), QUICK_ACTIONS, TeacherAIPage(), shortDate(), TeacherPlanningPage() (+2 more)

### Community 42 - "Student Tutor Chat"
Cohesion: 0.20
Nodes (11): useTutorChat(), ask(), obtenerSesion(), StudentCourseDetailPage(), AskTutorResult, askTutorStream(), createTutorSession(), ModoTutor (+3 more)

### Community 43 - "System & Dashboard Controllers"
Cohesion: 0.25
Nodes (9): health(), generarCorreccionIA(), dashboard(), dashboardAlumno(), dashboardProfesor(), requireUser(), router, router (+1 more)

### Community 44 - "Branding Config API"
Cohesion: 0.24
Nodes (10): getBranding(), updateBranding(), router, BrandingInput, brandingSchema, colorSchema, PRESETS_COLOR, getBranding() (+2 more)

### Community 45 - "Notifications Service"
Cohesion: 0.22
Nodes (10): contarNoLeidas(), listar(), marcarLeida(), marcarTodasLeidas(), CrearNotificacionInput, listarMias(), marcarLeida(), Notificacion (+2 more)

### Community 46 - "Admin Settings Hooks"
Cohesion: 0.24
Nodes (11): DEFAULT_INSTITUTION_NAME, MOCK_COLOR_PRESETS, useAdminSettings(), BrandingApi, getBranding(), getColorPresets(), InstitutionBranding, saveBranding() (+3 more)

### Community 47 - "Teacher Courses Hooks"
Cohesion: 0.19
Nodes (11): MOCK_TEACHER_COURSES, MOCK_TEACHER_STUDENTS, AsistenciaApi, fmtNum(), getDatosMateria(), getTeacherCourseGrades(), getTeacherCourseStudents(), NotaApi (+3 more)

### Community 48 - "Admin Keys & Subjects"
Cohesion: 0.26
Nodes (12): useAdminKeys(), useGenerateAdminKey(), useRevokeAdminKey(), useAdminSubjects(), AdminClavesPage(), EnrollmentKeyApi, generateAdminKey(), getAdminKeys() (+4 more)

### Community 49 - "Content Upload Hooks"
Cohesion: 0.27
Nodes (12): useCourseSections(), useUploadedMaterials(), useUploadMaterial(), TeacherContentPage(), ContenidoApi, ContentSection, formatDate(), getCourseSections() (+4 more)

### Community 50 - "Backend Runtime Dependencies"
Cohesion: 0.15
Nodes (13): dependencies, bcryptjs, cookie-parser, cors, dotenv, express, jsonwebtoken, pg (+5 more)

### Community 51 - "Messaging Controllers"
Cohesion: 0.31
Nodes (10): rolSchema, enviarBroadcast(), enviarMensaje(), listarConversaciones(), obtenerMensajes(), requireUser(), router, BroadcastInput (+2 more)

### Community 52 - "Attendance CRUD"
Cohesion: 0.28
Nodes (11): actualizar(), listarPorMateria(), mías(), registrarDia(), ActualizarAsistenciaInput, actualizar(), listarMias(), listarPorMateria() (+3 more)

### Community 53 - "Contenidos Controller"
Cohesion: 0.27
Nodes (10): actualizar(), crear(), eliminar(), listarPorSeccion(), router, ActualizarContenidoInput, actualizarContenidoSchema, CrearContenidoInput (+2 more)

### Community 54 - "Attendance Hooks"
Cohesion: 0.22
Nodes (10): ATTENDANCE_DATES, MOCK_ATTENDANCE_STATE, useAttendanceState(), useSaveAttendance(), AsistenciaApi, FRONT_TO_BACK, getAttendanceState(), saveAttendance() (+2 more)

### Community 55 - "Admin Reports & CSV Export"
Cohesion: 0.29
Nodes (10): useAdminReports(), useExportReport(), AdminReportsPage(), downloadCsv(), EXPORT_LABELS, exportReport(), ExportResult, getAdminReports() (+2 more)

### Community 56 - "Activities & Error Handling"
Cohesion: 0.44
Nodes (10): AppError, actualizar(), corregir(), crear(), crearRubrica(), enviar(), listarEntregas(), listarPendientes() (+2 more)

### Community 57 - "Grades Controller & Schemas"
Cohesion: 0.29
Nodes (9): actualizar(), crear(), listarPorMateria(), mías(), router, ActualizarNotaInput, actualizarNotaSchema, CrearNotaInput (+1 more)

### Community 58 - "Doc Summary Prompts & UseCase"
Cohesion: 0.25
Nodes (5): build_summary_prompt(), System prompt para el resumen de documentos (CU-A05)., Devuelve el system prompt parametrizado con idioma y extensión., Caso de uso CU-A05: resumen estructurado de un documento del alumno., ResumirDocumentoUseCase

### Community 59 - "Attendance Routes & Schemas"
Cohesion: 0.22
Nodes (8): router, actualizarAsistenciaSchema, estadosAsistencia, RegistraAsistenciaInput, registraAsistenciaSchema, crearNotificacionSchema, tipoNotificacionSchema, zod

### Community 60 - "Assignments Hooks"
Cohesion: 0.25
Nodes (8): MOCK_ASSIGNMENTS, useAssignments(), ActividadApi, formatDue(), getAssignments(), toStatus(), Assignment, AssignmentStatus

### Community 61 - "Admin Subjects Hooks"
Cohesion: 0.33
Nodes (9): useAssignAdminProfessor(), useSaveAdminSubject(), AdminMateriasPage(), assignAdminProfessor(), getAdminSubjects(), MateriaApi, saveAdminSubject(), SubjectSaveInput (+1 more)

### Community 62 - "Backend npm Scripts"
Cohesion: 0.20
Nodes (10): scripts, build, db:generate, db:migrate, db:seed, db:studio, dev, start (+2 more)

### Community 63 - "Contenidos Service & Indexing"
Cohesion: 0.42
Nodes (9): indexMaterial(), actualizar(), crear(), eliminar(), listarPorSeccion(), obtenerContenidoYVerificarEscritura(), obtenerSeccionYVerificarAccesoLectura(), obtenerSeccionYVerificarEscritura() (+1 more)

### Community 64 - "Planning API"
Cohesion: 0.36
Nodes (7): listarPlanning(), requireUser(), upsertPlanning(), router, estadoPlanningSchema, UpsertPlanningInput, upsertPlanningSchema

### Community 65 - "Corrections Queue Hooks"
Cohesion: 0.33
Nodes (8): useCorrectionQueue(), useRubrics(), EntregaPendiente, getCorrectionQueue(), getRubricCriteria(), getRubrics(), publishCorrection(), TYPE_LABEL

### Community 66 - "Database Seed Script"
Cohesion: 0.28
Nodes (8): adapter, estadoAsistencia, fechaClase(), limpiar(), main(), prisma, bcryptjs, @prisma/adapter-pg

### Community 67 - "Dashboard Aggregation Service"
Cohesion: 0.31
Nodes (7): dashboard(), dashboardAdmin(), dashboardAlumno(), dashboardProfesor(), Express, Request, @prisma/client

### Community 68 - "Enrollment Hooks"
Cohesion: 0.33
Nodes (6): useEnrollment(), ApiError, EnrollResult, enrollWithCode(), messageFromError(), sanitizeCode()

### Community 69 - "Frontend API Core"
Cohesion: 0.31
Nodes (8): api(), DashboardAdmin, DashboardAlumno, DashboardProfesor, DashboardResumenComun, getDashboardAdmin(), getDashboardAlumno(), getDashboardProfesor()

### Community 70 - "Admin Licensing Hooks"
Cohesion: 0.50
Nodes (6): useAdminLicensing(), EstadoLicenciaApi, getEstadoLicencia(), getLicensePlans(), getLicenseUsage(), LicensePlan

### Community 72 - "Assistant Material API"
Cohesion: 0.52
Nodes (4): generarMaterial(), router, GenerarMaterialInput, generarMaterialSchema

### Community 73 - "Frontend npm Scripts"
Cohesion: 0.29
Nodes (7): scripts, build, dev, lint, preview, test, typecheck

### Community 74 - "Planning Hooks"
Cohesion: 0.33
Nodes (5): MOCK_PLANNING, getPlanning(), PlanningItemApi, toPlanningClass(), PlanningClass

### Community 75 - "Core Frontend Dependencies"
Cohesion: 0.40
Nodes (5): dependencies, react, react-dom, react-router-dom, @tanstack/react-query

## Ambiguous Edges - Review These
- `Auto-correction Engine (rubric + explanatory feedback)` → `AI Service Use Case Orchestration`  [AMBIGUOUS]
  AVANCE.txt · relation: semantically_similar_to

## Knowledge Gaps
- **337 isolated node(s):** `name`, `version`, `description`, `main`, `dev` (+332 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 462 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Auto-correction Engine (rubric + explanatory feedback)` and `AI Service Use Case Orchestration`?**
  _Edge tagged AMBIGUOUS (relation: semantically_similar_to) - confidence is low._
- **Why does `AppError` connect `Activities & Error Handling` to `Admin User & Role Management`, `Frontend AI API Client`, `Auth & Validation Middleware`, `Analytics & Questions API`, `Activities Routes & Schemas`, `Auth Controller & Signing`, `Material Generation & Prisma`, `Academic CRUD Services`, `Sections Controller & Schemas`, `Materias Controller & Schemas`, `App Entry & Env Config`, `System & Dashboard Controllers`, `Notifications Service`, `Messaging Controllers`, `Attendance CRUD`, `Contenidos Controller`, `Grades Controller & Schemas`, `Contenidos Service & Indexing`, `Planning API`, `Dashboard Aggregation Service`, `Assistant Material API`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **Why does `react` connect `Card & Stat UI Components` to `App Shell & Routing UI`, `Core UI Components`, `Messaging & Inbox UI`, `Teacher AI Assistant`, `Student Tutor Chat`, `Admin Users & Modals`, `Admin Reports & CSV Export`, `Frontend Package Metadata`, `Form & Correction UI`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **Why does `express` connect `System & Dashboard Controllers` to `Admin User & Role Management`, `Frontend AI API Client`, `Backend Package Metadata`, `Auth & Validation Middleware`, `Analytics & Questions API`, `Activities Routes & Schemas`, `Auth Controller & Signing`, `Sections Controller & Schemas`, `Materias Controller & Schemas`, `App Entry & Env Config`, `Branding Config API`, `Notifications Service`, `Messaging Controllers`, `Attendance CRUD`, `Contenidos Controller`, `Activities & Error Handling`, `Grades Controller & Schemas`, `Attendance Routes & Schemas`, `Planning API`, `Assistant Material API`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **What connects `name`, `version`, `description` to the rest of the system?**
  _337 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Admin User & Role Management` be split into smaller, more focused modules?**
  _Cohesion score 0.07049180327868852 - nodes in this community are weakly interconnected._
- **Should `Pinecone Vector Store` be split into smaller, more focused modules?**
  _Cohesion score 0.06431372549019608 - nodes in this community are weakly interconnected._