# Graph Report - eduai-platform  (2026-09-13)

> **Leé primero [`README.md`](./README.md)** de esta carpeta. Ahí está la guía
> de orientación para el equipo: qué es graphify, cómo leer este reporte, la
> arquitectura real, los god nodes y por qué no hay que tocarlos a la ligera, y
> el inventario de lo que falta (verificado contra el código, no contra la doc).
>
> Este archivo es **auto-generado** y se pisa en cada corrida de graphify. La
> fecha de arriba es la del snapshot: 2026-09-13. Si tocaste mucho código desde
> entonces, el reporte está desactualizado (por ejemplo todavía lista el file
> upload y el RAG de archivos como pendientes, y ya estaban hechos el 2026-09-25).

## Corpus Check
- 28 files · ~62,959 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1437 nodes · 3542 edges · 95 communities (76 shown, 5 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 164 edges (avg confidence: 0.89)
- Token cost: 1,200 input · 1,100 output

## Community Hubs (Navigation)
- Community 0
- Community 1
- Community 2
- Community 3
- Community 4
- Community 5
- Community 6
- Community 7
- Community 8
- Community 9
- Community 10
- Community 11
- Community 12
- Community 13
- Community 14
- Community 15
- Community 16
- Community 17
- Community 18
- Community 19
- Community 20
- Community 21
- Community 22
- Community 23
- Community 24
- Community 25
- Community 26
- Community 27
- Community 28
- Community 29
- Community 30
- Community 31
- Community 32
- Community 33
- Community 34
- Community 35
- Community 36
- Community 37
- Community 38
- Community 39
- Community 40
- Community 41
- Community 42
- Community 43
- Community 44
- Community 45
- Community 46
- Community 47
- Community 48
- Community 49
- Community 50
- Community 51
- Community 52
- Community 53
- Community 54
- Community 55
- Community 56
- Community 57
- Community 58
- Community 59
- Community 60
- Community 61
- Community 62
- Community 63
- Community 64
- Community 65
- Community 66
- Community 67
- Community 68
- Community 69
- Community 70
- Community 71
- Community 72
- Community 73
- Community 74
- Community 75
- Community 76
- Community 77
- Community 78
- Community 79
- Community 80

## God Nodes (most connected - your core abstractions)
1. `AppError` - 153 edges
2. `react` - 48 edges
3. `api()` - 42 edges
4. `express` - 41 edges
5. `obtenerProfesorAsignado()` - 35 edges
6. `RetrievalService` - 28 edges
7. `LLMService` - 25 edges
8. `EmbeddingsService` - 24 edges
9. `_build_app()` - 21 edges
10. `Card()` - 21 edges

## Surprising Connections (you probably didn't know these)
- `Centralized error abstraction (star topology, load-bearing seam)` --rationale_for--> `AppError`  [EXTRACTED]
  graphify-out/memory/query_20260913_211720_0e476545_why_does_apperror_bridge_21_communities.md → backend/src/middlewares/error.ts
- `errorHandler()` --conceptually_related_to--> `Centralized error abstraction (star topology, load-bearing seam)`  [INFERRED]
  backend/src/middlewares/error.ts → graphify-out/memory/query_20260913_211720_0e476545_why_does_apperror_bridge_21_communities.md
- `Query: Why does AppError bridge 21 communities?` --references--> `AppError`  [EXTRACTED]
  graphify-out/memory/query_20260913_211720_0e476545_why_does_apperror_bridge_21_communities.md → backend/src/middlewares/error.ts
- `Prompts Kept Out of Code` --semantically_similar_to--> `Tutor Prompt Modes (normal/socratic/hints/exam/summary)`  [INFERRED] [semantically similar]
  IMPLEMENTATION.md → ai-services/README.md
- `Contextual AI Tutor per Subject` --semantically_similar_to--> `Tutor IA Chat Service (subject-contextualized)`  [INFERRED] [semantically similar]
  README.md → ai-services/README.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Centralized error-handling pattern (AppError star topology)** — backend_src_middlewares_error_apperror, backend_src_middlewares_error_errorhandler, backend_src_middlewares_error_notfound, backend_src_middlewares_error, graphify_out_memory_query_20260913_211720_0e476545_why_does_apperror_bridge_21_communities_centralized_error_abstraction [EXTRACTED 1.00]
- **Layered Decoupled Architecture (adjacent-layer rule)** — implementation_backend_layers, implementation_ai_service_architecture, implementation_adjacent_layer_rule, ai_services_contracts [INFERRED 0.85]
- **Pending file-upload + RAG-for-files pipeline** — file_upload_feature, cloudflare_r2, document_service, rag_pipeline [INFERRED 0.85]
- **RAG Pipeline (index material and retrieve context)** — readme_rag_pipeline, ai_services_vector_store, ai_services_use_cases, docker_compose_db [INFERRED 0.85]
- **Tutor IA Chat Query Pipeline** — ai_services_tutor_ia, ai_services_prompt_modes, ai_services_use_cases, ai_services_e2e_flow, ai_services_vector_store [INFERRED 0.85]

## Communities (95 total, 5 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.07
Nodes (52): actualizarEstado(), actualizarMateria(), asignarProfesor(), cambiarRol(), crearMateria(), crearUsuario(), estadoLicencia(), exportarReporte() (+44 more)

### Community 1 - "Community 1"
Cohesion: 0.09
Nodes (42): delete_material(), index_material(), post, Router RAG: indexación y eliminación de materiales (alimenta el tutor IA)., chat(), chat_stream(), corregir_entrega(), depurar() (+34 more)

### Community 2 - "Community 2"
Cohesion: 0.08
Nodes (35): App(), AppShell(), Header(), PROFILE_PATH_BY_ROLE, BADGE_CLASSES, ROLE_LABEL, Sidebar(), Icon() (+27 more)

### Community 3 - "Community 3"
Cohesion: 0.14
Nodes (30): Button(), ButtonProps, Size, SIZE_CLASSES, Variant, VARIANT_CLASSES, CourseFilter(), Modal() (+22 more)

### Community 4 - "Community 4"
Cohesion: 0.10
Nodes (26): create_app(), healthz(), lifespan(), build_summary_prompt(), System prompt para el resumen de documentos (CU-A05)., Devuelve el system prompt parametrizado con idioma y extensión., ChunkingService, Divide textos largos en fragmentos aptos para embedding y contexto. (+18 more)

### Community 5 - "Community 5"
Cohesion: 0.08
Nodes (18): PineconeRetrievalService, Acceso a la base vectorial de material educativo indexado en Pinecone., fake_pinecone(), FakeIndex, FakeMatch, FakePinecone, FakeQueryResponse, make_service() (+10 more)

### Community 6 - "Community 6"
Cohesion: 0.08
Nodes (22): get_genai_client(), Settings, System prompt del Auto-correction Engine (CU-A13): corrección de entregas con…, System prompt para la generación de simulacros de examen (CU-A08)., System prompt del modo pistas sin revelar respuesta (CU-A06)., System prompt del asistente docente (CU-A09): generación de material didáctico., System prompt del modo estudio con metodología socrática (CU-A09)., System prompt del tutor IA en modo normal (CU-A04). (+14 more)

### Community 7 - "Community 7"
Cohesion: 0.13
Nodes (30): CI Pipeline (GitHub Actions), Graceful Redis Cache Degradation, Pydantic Schemas as Backend-Service Contracts, Tutor Query End-to-End Flow, Tutor Prompt Modes (normal/socratic/hints/exam/summary), AI Service (Tutor IA) README, AI Service Production Dependencies, AI Service Dev Dependencies (pytest/ruff) (+22 more)

### Community 8 - "Community 8"
Cohesion: 0.17
Nodes (22): AppError, actualizar(), listarPorMateria(), mías(), registrarDia(), ActualizarAsistenciaInput, RegistraAsistenciaInput, actualizar() (+14 more)

### Community 9 - "Community 9"
Cohesion: 0.19
Nodes (15): Card(), CardHeader(), ProgressBar(), StatCard(), useSaveBranding(), useCourse(), useCourses(), AdminSettingsPage() (+7 more)

### Community 10 - "Community 10"
Cohesion: 0.12
Nodes (14): Búsqueda vectorial en Pinecone (serverless). Misma interfaz que…, _init_connection(), Búsqueda vectorial en PostgreSQL con pgvector., Acceso a la base vectorial de material educativo indexado., RetrievalService, build_retrieval_service(), Factory del vector store según la variable VECTOR_STORE (pgvector | pinecone)., Tests de la factory del vector store. (+6 more)

### Community 11 - "Community 11"
Cohesion: 0.08
Nodes (25): author, description, typescript, keywords, license, main, name, type (+17 more)

### Community 12 - "Community 12"
Cohesion: 0.14
Nodes (13): FakeCorreccionLLM, FakeEmbeddings, FakeLLM, FakeRetrieval, Fakes de los servicios externos para los tests del tutor IA., fixture, use_case(), fixture (+5 more)

### Community 13 - "Community 13"
Cohesion: 0.15
Nodes (22): actualizar(), corregir(), crear(), crearRubrica(), enviar(), listarEntregas(), listarPendientes(), listarPorMateria() (+14 more)

### Community 14 - "Community 14"
Cohesion: 0.16
Nodes (21): registrarConsultaTutor(), crearSesion(), enviarMensaje(), extraerTextoSse(), listarMensajes(), listarSesiones(), stream(), CrearSesionInput (+13 more)

### Community 15 - "Community 15"
Cohesion: 0.15
Nodes (16): health(), validateBody(), router, registerSchema, router, actualizarContenidoSchema, crearContenidoSchema, router (+8 more)

### Community 16 - "Community 16"
Cohesion: 0.16
Nodes (21): signAccessToken(), login(), logout(), me(), refresh(), register(), LoginInput, loginSchema (+13 more)

### Community 17 - "Community 17"
Cohesion: 0.11
Nodes (20): useAssignments(), ActividadApi, formatDue(), getAssignments(), toStatus(), EntregaPendiente, RubricaApi, TYPE_LABEL (+12 more)

### Community 18 - "Community 18"
Cohesion: 0.14
Nodes (14): TutorRequest, FakeCache, asyncio, test_ask_tutor_returns_answer_and_sources(), test_ask_tutor_second_call_is_cached(), test_ask_tutor_stream_yields_tokens_and_done(), asyncio, fixture (+6 more)

### Community 19 - "Community 19"
Cohesion: 0.18
Nodes (20): actualizarPregunta(), comprension(), crearPregunta(), dudas(), eliminarPregunta(), listarPreguntas(), progreso(), requireUser() (+12 more)

### Community 20 - "Community 20"
Cohesion: 0.18
Nodes (20): invalidateUsers(), useAdminProfessors(), useAdminUsers(), useChangeAdminUserRole(), useCreateAdminUser(), useSetAdminUserActive(), AdminUsuariosPage(), messageFromError() (+12 more)

### Community 21 - "Community 21"
Cohesion: 0.09
Nodes (21): compilerOptions, allowImportingTsExtensions, composite, isolatedModules, jsx, lib, module, moduleDetection (+13 more)

### Community 22 - "Community 22"
Cohesion: 0.14
Nodes (13): adapter, prisma, dashboard(), dashboardAdmin(), dashboardAlumno(), dashboardProfesor(), assertUuid(), enviarMensaje() (+5 more)

### Community 23 - "Community 23"
Cohesion: 0.17
Nodes (16): useDashboard(), api(), ApiError, getHealth(), refreshAccessToken(), DashboardAdmin, DashboardAlumno, DashboardProfesor (+8 more)

### Community 24 - "Community 24"
Cohesion: 0.10
Nodes (19): description, typescript, name, private, type, version, autoprefixer, eslint (+11 more)

### Community 25 - "Community 25"
Cohesion: 0.10
Nodes (19): description, devDependencies, concurrently, name, private, scripts, ai:setup, ai:test (+11 more)

### Community 26 - "Community 26"
Cohesion: 0.19
Nodes (16): aiDisponible(), baseUrl(), ChatMessageInput, chatTutor(), CorreccionIARequest, CorreccionIAResult, corregirEntregaIA(), generarMaterialDocente() (+8 more)

### Community 27 - "Community 27"
Cohesion: 0.22
Nodes (16): indexMaterial(), actualizar(), crear(), eliminar(), listarPorSeccion(), ActualizarContenidoInput, CrearContenidoInput, tipoContenidoSchema (+8 more)

### Community 28 - "Community 28"
Cohesion: 0.20
Nodes (4): EmbeddingsService, LLMService, CorreccionEntregaUseCase, GenerarMaterialUseCase

### Community 29 - "Community 29"
Cohesion: 0.19
Nodes (16): generarClaveAdmin(), crear(), crearClave(), detalle(), mias(), unirse(), CreateMateriaInput, UnirseInput (+8 more)

### Community 30 - "Community 30"
Cohesion: 0.11
Nodes (18): devDependencies, autoprefixer, eslint, eslint-plugin-react-hooks, jsdom, postcss, tailwindcss, @testing-library/jest-dom (+10 more)

### Community 31 - "Community 31"
Cohesion: 0.21
Nodes (13): estimate_tokens(), Estimación aproximada de tokens (código independiente del modelo)., Depuración de prompts de usuario (CU-SYS01)., Elimina saludos, muletillas y contenido irrelevante. Devuelve (prompt_depurado,…, sanitize_prompt(), _strip_leading_greeting(), test_collapses_repeated_punctuation(), test_empty_prompt_returns_empty() (+5 more)

### Community 32 - "Community 32"
Cohesion: 0.12
Nodes (17): devDependencies, jest, prisma, supertest, @swc/core, @swc/jest, tsx, @types/bcryptjs (+9 more)

### Community 33 - "Community 33"
Cohesion: 0.25
Nodes (15): assertUuid(), obtenerInscripcion(), actualizar(), crear(), listarMias(), listarPorMateria(), NotaConAlumno, toNotaDto() (+7 more)

### Community 34 - "Community 34"
Cohesion: 0.20
Nodes (15): useAnalytics(), AlertaApi, ComprensionApi, DudaApi, getFrequentErrors(), getFrequentQuestions(), getRiskAlerts(), getTopicUnderstanding() (+7 more)

### Community 35 - "Community 35"
Cohesion: 0.21
Nodes (15): useProgress(), ESTADO_LABEL, getAttendanceLog(), getCourseGradeSummary(), getGradeDetail(), getProgreso(), getProgressOverview(), gradeColor() (+7 more)

### Community 36 - "Community 36"
Cohesion: 0.30
Nodes (15): actualizar(), corregir(), crear(), crearRubrica(), EntregaBase, enviar(), listarEntregas(), listarPendientes() (+7 more)

### Community 37 - "Community 37"
Cohesion: 0.12
Nodes (15): compilerOptions, declaration, esModuleInterop, forceConsistentCasingInFileNames, module, moduleResolution, outDir, resolveJsonModule (+7 more)

### Community 38 - "Community 38"
Cohesion: 0.27
Nodes (13): useContacts(), useInbox(), useSendBroadcast(), useSendMessage(), TeacherMessagesPage(), ConversacionItem, formatWhen(), getAlumnosContactos() (+5 more)

### Community 39 - "Community 39"
Cohesion: 0.17
Nodes (12): useTutorChat(), ask(), obtenerSesion(), API_URL, AskTutorResult, askTutorStream(), createTutorSession(), ModoTutor (+4 more)

### Community 40 - "Community 40"
Cohesion: 0.12
Nodes (15): compilerOptions, allowImportingTsExtensions, composite, isolatedModules, lib, module, moduleDetection, moduleResolution (+7 more)

### Community 41 - "Community 41"
Cohesion: 0.20
Nodes (10): AccessTokenPayload, requireAuth(), requireRole(), router, router, router, ActualizarNotaInput, actualizarNotaSchema (+2 more)

### Community 42 - "Community 42"
Cohesion: 0.18
Nodes (11): FormField(), FormFieldProps, InfoBox(), Variant, VARIANT_CLASSES, NOTIFICATIONS, StudentProfilePage(), SUMMARY (+3 more)

### Community 43 - "Community 43"
Cohesion: 0.26
Nodes (10): usePlanning(), useSavePlanning(), useTeacherAssistant(), ask(), QUICK_ACTIONS, TeacherAIPage(), shortDate(), TeacherPlanningPage() (+2 more)

### Community 44 - "Community 44"
Cohesion: 0.29
Nodes (11): rolSchema, enviarBroadcast(), enviarMensaje(), listarConversaciones(), obtenerMensajes(), requireUser(), router, BroadcastInput (+3 more)

### Community 45 - "Community 45"
Cohesion: 0.24
Nodes (10): getBranding(), updateBranding(), router, BrandingInput, brandingSchema, colorSchema, PRESETS_COLOR, getBranding() (+2 more)

### Community 46 - "Community 46"
Cohesion: 0.24
Nodes (11): DEFAULT_INSTITUTION_NAME, MOCK_COLOR_PRESETS, useAdminSettings(), BrandingApi, getBranding(), getColorPresets(), InstitutionBranding, saveBranding() (+3 more)

### Community 47 - "Community 47"
Cohesion: 0.15
Nodes (13): dependencies, bcryptjs, cookie-parser, cors, dotenv, express, jsonwebtoken, pg (+5 more)

### Community 48 - "Community 48"
Cohesion: 0.24
Nodes (9): contarNoLeidas(), listar(), marcarLeida(), marcarTodasLeidas(), listarMias(), marcarLeida(), Notificacion, obtenerNotificacionUsuario() (+1 more)

### Community 49 - "Community 49"
Cohesion: 0.27
Nodes (10): actualizar(), crear(), eliminar(), listarPorMateria(), router, ActualizarSeccionInput, actualizarSeccionSchema, CrearSeccionInput (+2 more)

### Community 50 - "Community 50"
Cohesion: 0.26
Nodes (11): AuthProvider(), readStoredUser(), AuthUser, loginRequest(), LoginResponse, logoutRequest(), mapUsuario(), meRequest() (+3 more)

### Community 51 - "Community 51"
Cohesion: 0.26
Nodes (10): useAdminReports(), useExportReport(), AdminReportsPage(), downloadCsv(), EXPORT_LABELS, exportReport(), ExportResult, getAdminReports() (+2 more)

### Community 52 - "Community 52"
Cohesion: 0.30
Nodes (10): useAdminKeys(), useGenerateAdminKey(), useRevokeAdminKey(), EnrollmentKeyApi, generateAdminKey(), getAdminKeys(), NewKeyInput, revokeAdminKey() (+2 more)

### Community 53 - "Community 53"
Cohesion: 0.32
Nodes (10): useAdminSubjects(), useAssignAdminProfessor(), useSaveAdminSubject(), AdminMateriasPage(), assignAdminProfessor(), getAdminSubjects(), MateriaApi, saveAdminSubject() (+2 more)

### Community 54 - "Community 54"
Cohesion: 0.22
Nodes (7): env, envSchema, parsed, logger, app, server, pino

### Community 55 - "Community 55"
Cohesion: 0.22
Nodes (8): router, actualizarAsistenciaSchema, estadosAsistencia, registraAsistenciaSchema, CrearNotificacionInput, crearNotificacionSchema, tipoNotificacionSchema, zod

### Community 56 - "Community 56"
Cohesion: 0.25
Nodes (10): COLOR_PALETTE, colorDeMateria(), ContenidoDto, estadoUnidad(), getCourseById(), getCourses(), MateriaDto, SeccionDto (+2 more)

### Community 57 - "Community 57"
Cohesion: 0.25
Nodes (10): AsistenciaApi, fmtNum(), getDatosMateria(), getTeacherCourseGrades(), getTeacherCourseStudents(), NotaApi, StudentStanding, TeacherCourse (+2 more)

### Community 58 - "Community 58"
Cohesion: 0.29
Nodes (10): ai-services (Python/FastAPI, RAG + Gemini), AVANCE.md — Project Progress Snapshot, Cloudflare R2 storage (candidate binary destination), DocumentService (extracts text from PDF/DOCX/PPTX/TXT), EduAI Platform, File upload feature (multipart, pending), pgvector (ai_materials index), Pinecone (vector store) (+2 more)

### Community 59 - "Community 59"
Cohesion: 0.20
Nodes (3): CacheService, Servicio de cacheo en Redis para consultas y respuestas del tutor IA., Caché clave/valor con TTL. Degrada de forma silenciosa si Redis no está…

### Community 60 - "Community 60"
Cohesion: 0.20
Nodes (10): scripts, build, db:generate, db:migrate, db:seed, db:studio, dev, start (+2 more)

### Community 61 - "Community 61"
Cohesion: 0.24
Nodes (8): router, ActualizarPreguntaFrecuenteInput, actualizarPreguntaFrecuenteSchema, CrearPreguntaFrecuenteInput, crearPreguntaFrecuenteSchema, nivelSeveridadSchema, tipoAlertaSchema, tipoErrorDudaSchema

### Community 62 - "Community 62"
Cohesion: 0.36
Nodes (7): listarPlanning(), requireUser(), upsertPlanning(), router, estadoPlanningSchema, UpsertPlanningInput, upsertPlanningSchema

### Community 63 - "Community 63"
Cohesion: 0.31
Nodes (8): useAttendanceState(), useSaveAttendance(), AsistenciaApi, FRONT_TO_BACK, getAttendanceState(), saveAttendance(), DailyAttendanceStatus, StudentAttendanceState

### Community 64 - "Community 64"
Cohesion: 0.36
Nodes (8): useCourseSections(), useUploadedMaterials(), useUploadMaterial(), FILE_ICON, RAG_COLOR, RAG_LABEL, TeacherContentPage(), getCourseSections()

### Community 65 - "Community 65"
Cohesion: 0.28
Nodes (8): adapter, estadoAsistencia, fechaClase(), limpiar(), main(), prisma, bcryptjs, @prisma/adapter-pg

### Community 66 - "Community 66"
Cohesion: 0.47
Nodes (7): useCorrectionQueue(), usePublishCorrection(), useRubrics(), TeacherCorrectionsPage(), getCorrectionQueue(), getRubrics(), publishCorrection()

### Community 67 - "Community 67"
Cohesion: 0.33
Nodes (8): ContenidoApi, ContentSection, formatDate(), getUploadedMaterials(), sizeLabel(), tipoToFileType(), uploadMaterial(), UploadedMaterial

### Community 68 - "Community 68"
Cohesion: 0.43
Nodes (6): createApp(), errorHandler(), notFound(), generarCorreccionIA(), Query: Why does AppError bridge 21 communities?, Centralized error abstraction (star topology, load-bearing seam)

### Community 69 - "Community 69"
Cohesion: 0.50
Nodes (6): useAdminLicensing(), EstadoLicenciaApi, getEstadoLicencia(), getLicensePlans(), getLicenseUsage(), LicensePlan

### Community 71 - "Community 71"
Cohesion: 0.52
Nodes (4): generarMaterial(), router, GenerarMaterialInput, generarMaterialSchema

### Community 72 - "Community 72"
Cohesion: 0.43
Nodes (5): router, CrearClaveInput, crearClaveSchema, createMateriaSchema, unirseSchema

### Community 73 - "Community 73"
Cohesion: 0.29
Nodes (7): scripts, build, dev, lint, preview, test, typecheck

### Community 74 - "Community 74"
Cohesion: 0.48
Nodes (5): useEnrollment(), EnrollResult, enrollWithCode(), messageFromError(), sanitizeCode()

### Community 75 - "Community 75"
Cohesion: 1.00
Nodes (4): dashboard(), dashboardAlumno(), dashboardProfesor(), requireUser()

### Community 76 - "Community 76"
Cohesion: 0.40
Nodes (5): dependencies, react, react-dom, react-router-dom, @tanstack/react-query

## Knowledge Gaps
- **316 isolated node(s):** `Reporte`, `StatItem`, `AdminRolInput`, `AdminProfessor`, `AdminRolInput` (+311 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 441 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `AppError` connect `Community 8` to `Community 0`, `Community 13`, `Community 14`, `Community 15`, `Community 16`, `Community 19`, `Community 22`, `Community 26`, `Community 27`, `Community 29`, `Community 33`, `Community 36`, `Community 41`, `Community 44`, `Community 48`, `Community 49`, `Community 62`, `Community 68`, `Community 71`, `Community 75`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **Why does `@tanstack/react-query` connect `Community 2` to `Community 3`, `Community 9`, `Community 17`, `Community 20`, `Community 23`, `Community 24`, `Community 34`, `Community 35`, `Community 38`, `Community 43`, `Community 46`, `Community 51`, `Community 52`, `Community 53`, `Community 63`, `Community 64`, `Community 66`, `Community 69`, `Community 74`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Why does `express` connect `Community 15` to `Community 0`, `Community 8`, `Community 11`, `Community 13`, `Community 14`, `Community 16`, `Community 19`, `Community 27`, `Community 29`, `Community 41`, `Community 44`, `Community 45`, `Community 48`, `Community 49`, `Community 55`, `Community 61`, `Community 62`, `Community 68`, `Community 71`, `Community 72`, `Community 75`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **What connects `Reporte`, `StatItem`, `AdminRolInput` to the rest of the system?**
  _316 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.07441016333938294 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.08673469387755102 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.07955596669750231 - nodes in this community are weakly interconnected._