# Graph Report - eduai-platform  (2026-10-30)

## Corpus Check
- 347 files · ~134,921 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2494 nodes · 6505 edges · 129 communities (101 shown, 28 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 285 edges (avg confidence: 0.89)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Núcleo del servicio de IA
- Base del backend y pruebas HTTP
- Módulo tutor (backend)
- Pruebas del ai-service (fakes)
- App Express y rutas
- Extracción de documentos y OCR
- Aplicación React y paneles
- Depuración de prompts
- Pantallas de administración
- Componentes UI y cliente API
- Actividades y correcciones (UI)
- Actividades y entregas (backend)
- Esquemas y router del tutor
- Servicio Pinecone y pruebas
- Corrección de simulacros
- Cliente de IA y corrección
- Servicio de administración
- Dependencias del backend
- Autenticación
- Entregas y actividades (cliente)
- Documentación técnica y avance
- Arquitectura y stack
- Analytics (backend)
- Manual y endpoints
- Chunking y resumen
- Materias (backend)
- Controladores y asistente
- Contenidos (backend)
- Scripts de entorno
- Reintentos del LLM
- Almacenamiento y planificación
- Herramientas del tutor (UI)
- Indexado RAG y logger
- Dependencias del frontend
- Recuperación pgvector (pruebas)
- Sesión y login (frontend)
- Scripts del monorepo
- Indexado y vector stores
- Datos del docente (cliente)
- Config TypeScript (app)
- Casos de uso del tutor
- Secciones (backend)
- Correcciones y rúbricas (cliente)
- Corrección con IA y rúbricas
- Dependencias de producción
- Dependencias de desarrollo
- Notas e inscripciones
- Controlador de administración
- Asistencia y dashboard (cliente)
- Contenido y secciones (cliente)
- Implementación y configuración
- Mensajería (backend)
- Dashboard (backend)
- Herramientas de desarrollo UI
- Notificaciones (UI)
- Usuarios administrados (cliente)
- Embeddings (pruebas)
- Helpers de contexto
- Asistencias (backend)
- Configuración y branding (backend)
- Notificaciones y email
- Simulacro y curso (UI)
- Reportes de administración
- Ajustes de administración
- Chat del tutor (hook)
- Analytics (cliente)
- Progreso del alumno
- OCR y CI del ai-service
- Esquemas y rutas de admin
- Config TypeScript (backend)
- Config TypeScript (node)
- Decisiones de arquitectura
- Planificación y notificaciones
- Pruebas de corrección
- Pool y esquema pgvector
- Cursos y materiales (UI)
- Branding (frontend)
- Planificación (cliente)
- Scripts de base de datos
- Asistente docente IA
- Claves de matriculación (cliente)
- Mensajes (cliente)
- Caché Redis
- Asistente docente (backend)
- Benchmark del tutor
- Materias admin (cliente)
- Reintentos y backoff del LLM
- RAG y Tutor IA
- Suite E2E
- Embeddings con límite de tasa
- Seed de datos
- Desmatriculación (UI)
- Asistente docente (cliente)
- Entrega de actividades
- Seguridad y límite de intentos
- Pruebas de herramientas del tutor
- Licencias (cliente)
- Perfil del alumno (docente)
- Cliente Gemini
- Notificaciones y capas
- Scripts del frontend
- Inscripción (cliente)
- Reportes en PDF
- Dependencias React
- Otros: _Embedder
- Otros: frontend/eslint.config.mjs
- Otros: Resumir documento
- Otros: frontend/tsconfig.json
- Otros: actions/setup-node@v4 (Node 22)
- Otros: asyncpg
- Otros: fastapi
- Otros: google-genai
- Otros: pgvector
- Otros: Baja de materia
- Otros: CU-A02 Navegar contenido
- Otros: CU-P03 Gestionar actividades
- Otros: nginx.conf

## God Nodes (most connected - your core abstractions)
1. `AppError` - 210 edges
2. `api()` - 73 edges
3. `react` - 63 edges
4. `Card()` - 61 edges
5. `CardHeader()` - 57 edges
6. `Button()` - 55 edges
7. `prisma` - 46 edges
8. `obtenerProfesorAsignado()` - 46 edges
9. `Tag()` - 44 edges
10. `express` - 43 edges

## Surprising Connections (you probably didn't know these)
- `errorHandler()` --conceptually_related_to--> `Centralized error abstraction (star topology, load-bearing seam)`  [INFERRED]
  backend/src/middlewares/error.ts → graphify-out/memory/query_20260913_211720_0e476545_why_does_apperror_bridge_21_communities.md
- `Arquitectura: frontend -> backend -> (db, redis, ai-service)` --semantically_similar_to--> `Cada capa solo habla con la adyacente (intercambiabilidad)`  [INFERRED] [semantically similar]
  docs/DOCUMENTACION_TECNICA.md → IMPLEMENTATION.md
- `Query: Why does AppError bridge 21 communities?` --references--> `AppError`  [EXTRACTED]
  graphify-out/memory/query_20260913_211720_0e476545_why_does_apperror_bridge_21_communities.md → backend/src/middlewares/error.ts
- `Centralized error abstraction (star topology, load-bearing seam)` --rationale_for--> `AppError`  [EXTRACTED]
  graphify-out/memory/query_20260913_211720_0e476545_why_does_apperror_bridge_21_communities.md → backend/src/middlewares/error.ts
- `Cacheo con Redis (TTL)` --semantically_similar_to--> `Redis cache`  [INFERRED] [semantically similar]
  IMPLEMENTATION.md → docs/DOCUMENTACION_TECNICA.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Centralized error-handling pattern (AppError star topology)** — backend_src_middlewares_error_apperror, backend_src_middlewares_error_errorhandler, backend_src_middlewares_error_notfound, backend_src_middlewares_error, graphify_out_memory_query_20260913_211720_0e476545_why_does_apperror_bridge_21_communities_centralized_error_abstraction [EXTRACTED 1.00]
- **EduAI runtime stack** — c_frontend, c_backend, c_aiservice, c_postgres, c_redis [EXTRACTED 1.00]
- **RAG pipeline** — c_rag, c_emb, c_llm, c_pgvector, c_tutor [INFERRED 0.85]
- **Flujo de indexacion RAG (archivo -> texto -> chunks -> embeddings -> vector store)** — ai_services_src_routers_rag_router, ai_services_src_services_document_service, index_material_usecase, ai_services_src_services_chunking_service, ai_services_src_services_embeddings_service, retrieval_service [EXTRACTED 0.95]
- **Flujo de consulta al tutor (sanitizar, cache, embedding, retrieval, LLM)** — ask_tutor_usecase, ai_services_src_services_prompt_sanitizer, ai_services_src_services_cache_service, ai_services_src_services_embeddings_service, retrieval_service, ai_services_src_services_llm_service [EXTRACTED 0.95]
- **Correccion IA como borrador que el docente publica** — avance_corregir_ia_borrador, avance_rubricas_esperado, correct_submission_usecase, c_ia_sug, docs_manual_usuario_docente_rubricas_correccion [INFERRED 0.85]

## Communities (129 total, 28 thin omitted)

### Community 0 - "Núcleo del servicio de IA"
Cohesion: 0.05
Nodes (21): config/genai.py (cliente Gemini singleton), main(), Settings, create_app(), healthz(), lifespan(), verificar_token_interno(), EmbeddingsService (+13 more)

### Community 1 - "Base del backend y pruebas HTTP"
Cohesion: 0.06
Nodes (40): createApp(), protegerArchivoSubido(), adapter, prisma, UPLOADS_DIR, errorHandler(), notFound(), resolverError() (+32 more)

### Community 2 - "Módulo tutor (backend)"
Cohesion: 0.05
Nodes (65): registrarConsultaTutor(), MaterialPdf, renderMaterialPdf(), sinEmojis(), sinMarcasInline(), corregirSimulacro(), crearSesion(), enviarMensaje() (+57 more)

### Community 3 - "Pruebas del ai-service (fakes)"
Cohesion: 0.06
Nodes (27): FakeCache, FakeCorreccionLLM, FakeEmbeddings, FakeLLM, FakeRetrieval, test_ask_tutor_returns_answer_and_sources(), test_ask_tutor_second_call_is_cached(), test_ask_tutor_stream_yields_tokens_and_done() (+19 more)

### Community 4 - "App Express y rutas"
Cohesion: 0.10
Nodes (38): env, envSchema, parsed, health(), AccessTokenPayload, requireAuth(), requireRole(), validateBody() (+30 more)

### Community 5 - "Extracción de documentos y OCR"
Cohesion: 0.06
Nodes (8): DocumentService, OcrService, _pdf_con_texto(), _png_1px(), TestDisponibilidad, TestFormatosSoportados, TestIntegracionConDocumentService, TestLimpieza

### Community 6 - "Aplicación React y paneles"
Cohesion: 0.12
Nodes (37): App(), Shell(), AppShell(), Header(), PROFILE_PATH_BY_ROLE, BADGE_CLASSES, ROLE_LABEL, Sidebar() (+29 more)

### Community 7 - "Depuración de prompts"
Cohesion: 0.07
Nodes (31): TutorRequest, estimate_tokens(), depurar(), _matches_greeting(), _normalize_whitespace(), PromptDepurado, sanitize_prompt(), _starts_with_greeting() (+23 more)

### Community 8 - "Pantallas de administración"
Cohesion: 0.16
Nodes (38): Button(), CourseFilter(), Table(), TableWrap(), Td(), Th(), Thead(), COLOR_CLASSES (+30 more)

### Community 9 - "Componentes UI y cliente API"
Cohesion: 0.13
Nodes (34): FILAS, Metrica, MetricasExito, SuccessMetricsCard(), ResumenPanel(), AccesosMateria, ContentAccessCard(), fecha() (+26 more)

### Community 10 - "Actividades y correcciones (UI)"
Cohesion: 0.10
Nodes (37): AssignmentSubmitModal(), esVencida(), PLACEHOLDER, TITULO, ActivityFormModal(), AYUDA, errorDeApi(), TIPOS (+29 more)

### Community 11 - "Actividades y entregas (backend)"
Cohesion: 0.09
Nodes (40): ActualizarActividadInput, actualizarActividadSchema, ActualizarRubricaInput, actualizarRubricaSchema, CorregirEntregaInput, corregirEntregaSchema, CrearActividadInput, crearActividadSchema (+32 more)

### Community 12 - "Esquemas y router del tutor"
Cohesion: 0.12
Nodes (26): schemas/tutor.py (contratos Pydantic), chat(), chat_stream(), corregir_entrega(), corregir_examen(), depurar(), examen(), generar_material() (+18 more)

### Community 13 - "Servicio Pinecone y pruebas"
Cohesion: 0.08
Nodes (14): PineconeRetrievalService, fake_pinecone(), FakeIndex, FakeMatch, FakePinecone, FakeQueryResponse, make_service(), test_close_closes_client() (+6 more)

### Community 14 - "Corrección de simulacros"
Cohesion: 0.13
Nodes (19): ExamAnswerItem, ExamItemResult, FakeExamenCorreccionLLM, corregir(), desarrollo(), mc(), test_desarrollo_se_corrige_con_un_unico_llamado_al_llm(), test_multiple_choice_correcta_acepta_texto_o_letra() (+11 more)

### Community 15 - "Cliente de IA y corrección"
Cohesion: 0.10
Nodes (31): aiDisponible(), aiHeaders(), baseUrl(), ChatMessageInput, chatTutor(), CorreccionExamenItemInput, CorreccionExamenItemResult, CorreccionIARequest (+23 more)

### Community 16 - "Servicio de administración"
Cohesion: 0.10
Nodes (35): CrearMateriaAdminInput, CrearUsuarioInput, actualizarEstado(), actualizarMateria(), asignarProfesor(), assertUuid(), avisar(), cambiarRol() (+27 more)

### Community 17 - "Dependencias del backend"
Cohesion: 0.06
Nodes (34): author, description, keywords, license, main, name, prisma, seed (+26 more)

### Community 18 - "Autenticación"
Cohesion: 0.10
Nodes (31): signAccessToken(), cambiarPassword(), login(), logout(), me(), refresh(), register(), limiteCredenciales (+23 more)

### Community 19 - "Entregas y actividades (cliente)"
Cohesion: 0.11
Nodes (29): key(), useCreateActivity(), useDeleteActivity(), useTeacherActivities(), useSubmitAssignment(), useUploadAssignmentFile(), ActivityInput, createActivity() (+21 more)

### Community 20 - "Documentación técnica y avance"
Cohesion: 0.08
Nodes (32): Avance del proyecto, Admin conectado al backend real, Branding: presets, logo a storage, theming en runtime, Como correr (Docker / local / verificacion), Export PDF de reportes (pdfkit), MensajeIA persiste el modo de sesion, storage.ts: LocalStorage / S3Storage (R2), Stack: React, Express/Prisma, FastAPI, Docker Compose (+24 more)

### Community 21 - "Arquitectura y stack"
Cohesion: 0.08
Nodes (30): Rol Administrador, ai-service FastAPI, Rol Alumno, Asistente docente IA, Backend Node.js + Express, Rol Docente, Docker Compose, Servicio de email (+22 more)

### Community 22 - "Analytics (backend)"
Cohesion: 0.13
Nodes (27): actualizarPregunta(), comprension(), crearPregunta(), dudas(), eliminarPregunta(), listarPreguntas(), progreso(), requireUser() (+19 more)

### Community 23 - "Manual y endpoints"
Cohesion: 0.08
Nodes (29): Subida y almacenamiento de archivos (multer), RAG para archivos (POST /rag/material/archivo), CU-P03 Gestion de actividades, Endpoints de la API, Modelo de acceso: Publico/Autenticado/Rol, Zod, limitador, API: Analytics y preguntas frecuentes, API: Autenticacion (/api/auth), API: Correccion IA (GET correccion-ia) (+21 more)

### Community 24 - "Chunking y resumen"
Cohesion: 0.11
Nodes (10): build_summary_prompt(), ChunkingService, test_chunk_text_empty_input(), test_chunk_text_preserves_whitespace_normalization(), test_chunk_text_short_document_returns_single_chunk(), test_chunk_text_splits_long_document(), _EmbedderAgregado, _RetrievalEspia (+2 more)

### Community 25 - "Materias (backend)"
Cohesion: 0.12
Nodes (25): crear(), crearClave(), detalle(), inscriptos(), mias(), perfilAlumno(), unirse(), router (+17 more)

### Community 26 - "Controladores y asistente"
Cohesion: 0.13
Nodes (24): AppError, actualizar(), actualizarRubrica(), corregir(), corregirConIA(), crear(), crearRubrica(), eliminar() (+16 more)

### Community 27 - "Contenidos (backend)"
Cohesion: 0.12
Nodes (25): actualizar(), crear(), crearArchivo(), eliminar(), estadisticasDeAcceso(), listarPorSeccion(), registrarAcceso(), ActualizarContenidoInput (+17 more)

### Community 28 - "Scripts de entorno"
Cohesion: 0.09
Nodes (19): app, destino, filas, importaciones, lineas, montajes, NOMBRES, porModulo (+11 more)

### Community 29 - "Reintentos del LLM"
Cohesion: 0.12
Nodes (12): es_error_transitorio(), _ClienteFalso, _Permanente, _Respuesta, _service_con(), _sin_espera(), test_es_error_transitorio_detecta_fallos_del_proveedor(), test_es_error_transitorio_ignora_errores_permanentes() (+4 more)

### Community 30 - "Almacenamiento y planificación"
Cohesion: 0.17
Nodes (23): asegurarDirectorioUploads(), clienteS3(), eliminarArchivo(), formatoDe(), guardarArchivo(), leerArchivo(), normalizarEndpoint(), prefijoPublico() (+15 more)

### Community 31 - "Herramientas del tutor (UI)"
Cohesion: 0.11
Nodes (21): enviar(), messageFromError(), useResumen(), resumir(), useSimulacro(), generar(), limpiar(), AskTutorResult (+13 more)

### Community 32 - "Indexado RAG y logger"
Cohesion: 0.13
Nodes (19): indexArchivo(), indexMaterial(), postIndexado(), logger, app, server, ejecutar(), enCurso (+11 more)

### Community 33 - "Dependencias del frontend"
Cohesion: 0.09
Nodes (20): eslint, @types/node, typescript, typescript-eslint, description, name, private, type (+12 more)

### Community 34 - "Recuperación pgvector (pruebas)"
Cohesion: 0.14
Nodes (8): FakeConn, FakePool, _sql(), test_crea_tabla_con_dimension_configurada_e_indice_hnsw(), test_migra_y_reindexa_si_cambia_la_dimension(), embed_documents(), test_no_migra_si_la_dimension_coincide(), test_si_el_reindexado_falla_la_migracion_se_revierte()

### Community 35 - "Sesión y login (frontend)"
Cohesion: 0.18
Nodes (18): AuthContext, AuthContextValue, AuthProvider(), readStoredUser(), User, LoginPage(), refreshAccessToken(), AuthUser (+10 more)

### Community 36 - "Scripts del monorepo"
Cohesion: 0.09
Nodes (22): description, devDependencies, concurrently, name, private, scripts, ai:setup, ai:test (+14 more)

### Community 37 - "Indexado y vector stores"
Cohesion: 0.13
Nodes (11): Migracion de dimension de embeddings y reindexado, main.py (create_app, lifespan, app.state), pinecone, delete_material(), index_material(), index_material_file(), IndexMaterialRequest, IndexMaterialResponse (+3 more)

### Community 38 - "Datos del docente (cliente)"
Cohesion: 0.13
Nodes (20): AsistenciaApi, EnrolledStudent, fmtNum(), getCourseEnrolledStudents(), getDatosMateria(), getTeacherCourseGrades(), getTeacherCourseStudents(), NotaApi (+12 more)

### Community 39 - "Config TypeScript (app)"
Cohesion: 0.09
Nodes (21): compilerOptions, allowImportingTsExtensions, composite, isolatedModules, jsx, lib, module, moduleDetection (+13 more)

### Community 40 - "Casos de uso del tutor"
Cohesion: 0.15
Nodes (21): prompts/ (tutor, socratic, hints, exam, summary), ask_tutor.py (AskTutorUseCase), Tabla de endpoints y casos de uso del ai-service, Cableado de resumen y simulacro (ResumenPanel, SimulacroPanel), Depuracion de prompts, Preguntas frecuentes del tutor, CU-A04 Consultar Tutor IA, CU-A05 Resumen de documento (+13 more)

### Community 41 - "Secciones (backend)"
Cohesion: 0.17
Nodes (18): assertUuid(), actualizar(), crear(), eliminar(), listarPorMateria(), ActualizarSeccionInput, actualizarSeccionSchema, CrearSeccionInput (+10 more)

### Community 42 - "Correcciones y rúbricas (cliente)"
Cohesion: 0.19
Nodes (19): useCorrectionQueue(), useCorrectWithAi(), useCreateRubric(), useDeleteRubric(), useInvalidateRubrics(), usePublishCorrection(), useUpdateRubric(), correctWithAi() (+11 more)

### Community 43 - "Corrección con IA y rúbricas"
Cohesion: 0.13
Nodes (17): backend aiClient.ts (8 rutas al ai-service), POST /api/entregas/:id/corregir-ia (borrador IA), Rubricas con campo esperado (pesos suman 100), Correccion IA con rubricas, CU-A07 Feedback automatico de entrega, CU-P04 Rubricas y correccion IA, CorreccionEntregaUseCase (correct_submission.py), CU-A07 Correccion de entregas con IA (+9 more)

### Community 44 - "Dependencias de producción"
Cohesion: 0.10
Nodes (20): dependencies, @aws-sdk/client-s3, @aws-sdk/lib-storage, bcryptjs, cookie-parser, cors, dotenv, express (+12 more)

### Community 45 - "Dependencias de desarrollo"
Cohesion: 0.10
Nodes (20): devDependencies, eslint, jest, supertest, @swc/core, @swc/jest, tsx, @types/bcryptjs (+12 more)

### Community 46 - "Notas e inscripciones"
Cohesion: 0.16
Nodes (17): listarPorMateria(), registrarAcceso(), obtenerInscripcion(), actualizar(), crear(), listarPorMateria(), mías(), ActualizarNotaInput (+9 more)

### Community 47 - "Controlador de administración"
Cohesion: 0.20
Nodes (19): actualizarEstado(), actualizarMateria(), asignarProfesor(), cambiarRol(), crearMateria(), crearUsuario(), desmatricular(), desmatricularTodos() (+11 more)

### Community 48 - "Asistencia y dashboard (cliente)"
Cohesion: 0.15
Nodes (17): useAttendanceState(), useSaveAttendance(), api(), getHealth(), AsistenciaApi, FRONT_TO_BACK, getAttendanceState(), saveAttendance() (+9 more)

### Community 49 - "Contenido y secciones (cliente)"
Cohesion: 0.18
Nodes (18): useCreateSection(), useDeleteSection(), useUploadedMaterials(), useUploadMaterialFile(), ContenidoApi, ContentSection, createSection(), CreateSectionInput (+10 more)

### Community 50 - "Implementación y configuración"
Cohesion: 0.12
Nodes (17): Variables de entorno del ai-service, RETRIEVAL_MIN_SCORE (umbral de similitud), config/settings.py (Settings), RAG troubleshooting, pytest / pytest-asyncio / httpx / ruff (dev deps), Variables de entorno imprescindibles, frontend/index.html (entrada SPA Vite), src/main.tsx (punto de montaje #root) (+9 more)

### Community 51 - "Mensajería (backend)"
Cohesion: 0.18
Nodes (14): rolSchema, enviarBroadcast(), enviarMensaje(), listarConversaciones(), obtenerMensajes(), requireUser(), BroadcastInput, broadcastSchema (+6 more)

### Community 52 - "Dashboard (backend)"
Cohesion: 0.15
Nodes (14): dashboard(), dashboardAlumno(), dashboardProfesor(), requireUser(), dashboard(), dashboardAdmin(), dashboardAlumno(), dashboardProfesor() (+6 more)

### Community 53 - "Herramientas de desarrollo UI"
Cohesion: 0.11
Nodes (19): devDependencies, autoprefixer, eslint, eslint-plugin-react-hooks, jsdom, postcss, tailwindcss, @testing-library/jest-dom (+11 more)

### Community 54 - "Notificaciones (UI)"
Cohesion: 0.24
Nodes (14): Tr(), useMarcarLeida(), useMarcarTodasLeidas(), useNotificaciones(), NotificacionesPage(), getNoLeidasCount(), getNotificaciones(), marcarLeida() (+6 more)

### Community 55 - "Usuarios administrados (cliente)"
Cohesion: 0.20
Nodes (17): invalidateUsers(), useAdminUsers(), useChangeAdminUserRole(), useCreateAdminUser(), useSetAdminUserActive(), AdminProfessor, AdminRolInput, AdminUserApi (+9 more)

### Community 56 - "Embeddings (pruebas)"
Cohesion: 0.19
Nodes (10): _ClienteFalso, _Embedding, _Respuesta, _service(), _sin_espera(), test_falla_si_el_modelo_no_devuelve_un_vector(), test_no_reintenta_errores_permanentes(), test_reintenta_ante_429() (+2 more)

### Community 57 - "Helpers de contexto"
Cohesion: 0.16
Nodes (8): test_las_fuentes_incluyen_el_titulo(), test_rotula_con_el_titulo_y_sin_uuid(), test_sin_titulo_no_expone_el_uuid(), _formatear_rubrica(), _peso_legible(), build_sources(), cache_key(), format_context()

### Community 58 - "Asistencias (backend)"
Cohesion: 0.18
Nodes (15): actualizar(), listarPorMateria(), mías(), registrarDia(), ActualizarAsistenciaInput, actualizarAsistenciaSchema, estadosAsistencia, RegistraAsistenciaInput (+7 more)

### Community 59 - "Configuración y branding (backend)"
Cohesion: 0.17
Nodes (14): getBranding(), getBrandingPublico(), subirLogo(), updateBranding(), BrandingInput, brandingSchema, COLOR_PRESETS, ColorPreset (+6 more)

### Community 60 - "Notificaciones y email"
Cohesion: 0.16
Nodes (12): listarMias(), marcarLeida(), Notificacion, notificarPorEmail(), obtenerNotificacionUsuario(), toNotificacionDto(), isEmailEnabled(), sendEmailSeguro() (+4 more)

### Community 61 - "Simulacro y curso (UI)"
Cohesion: 0.17
Nodes (16): DIFICULTAD_TAG, DIFICULTADES, formatearFecha(), PreguntaRespondible(), ResultadoCorreccion(), SimulacroPanel(), VEREDICTO, useCourse() (+8 more)

### Community 62 - "Reportes de administración"
Cohesion: 0.22
Nodes (15): useAdminReports(), useExportReport(), useExportReportPdf(), AdminReportsPage(), downloadCsv(), downloadPdf(), EXPORT_LABELS, ExportPdfResult (+7 more)

### Community 63 - "Ajustes de administración"
Cohesion: 0.21
Nodes (13): useAdminSettings(), getBranding(), getColorPresets(), saveBranding(), SaveBrandingInput, BrandingApi, toBranding(), brandingApi (+5 more)

### Community 64 - "Chat del tutor (hook)"
Cohesion: 0.17
Nodes (15): TUTOR_LENTO_MS, useTutorChat(), actualizarRespuesta(), ask(), obtenerSesion(), getAccessToken(), askTutorStream(), createTutorSession() (+7 more)

### Community 65 - "Analytics (cliente)"
Cohesion: 0.20
Nodes (15): useAnalytics(), AlertaApi, ComprensionApi, DudaApi, getFrequentErrors(), getFrequentQuestions(), getRiskAlerts(), getTopicUnderstanding() (+7 more)

### Community 66 - "Progreso del alumno"
Cohesion: 0.21
Nodes (15): useProgress(), ESTADO_LABEL, getAttendanceLog(), getCourseGradeSummary(), getGradeDetail(), getProgreso(), getProgressOverview(), gradeColor() (+7 more)

### Community 67 - "OCR y CI del ai-service"
Cohesion: 0.13
Nodes (15): google-genai, structlog, redis, asyncpg, pgvector, pinecone, pypdf, python-docx, python-pptx, pytesseract + pdf2image + Pillow (CU-P02), fastapi, uvicorn, pydantic-settings, python-multipart, Volumen aipy_venv pisa el venv (python-multipart), Docker verificado (3 bugs corregidos), E2E de OCR de PDF escaneado sin ejecutar, OcrService (tesseract + poppler) (+7 more)

### Community 68 - "Esquemas y rutas de admin"
Cohesion: 0.18
Nodes (14): router, ActualizarEstadoInput, actualizarEstadoSchema, ActualizarMateriaAdminInput, actualizarMateriaAdminSchema, AsignarProfesorInput, asignarProfesorSchema, CambiarRolInput (+6 more)

### Community 69 - "Config TypeScript (backend)"
Cohesion: 0.12
Nodes (15): compilerOptions, declaration, esModuleInterop, forceConsistentCasingInFileNames, module, moduleResolution, outDir, resolveJsonModule (+7 more)

### Community 70 - "Config TypeScript (node)"
Cohesion: 0.12
Nodes (15): compilerOptions, allowImportingTsExtensions, composite, isolatedModules, lib, module, moduleDetection, moduleResolution (+7 more)

### Community 71 - "Decisiones de arquitectura"
Cohesion: 0.19
Nodes (13): ai-service (Python/FastAPI), AI service README, CHROMA_URL eliminada, Deploy a cloud (bloqueo de entrega), Gemini intermitente (503 high demand), DEPLOY.md, Google Gemini (LLM y embeddings), IA modelos y prompts (+5 more)

### Community 72 - "Planificación y notificaciones"
Cohesion: 0.18
Nodes (12): CrearNotificacionInput, crearNotificacionSchema, tipoNotificacionSchema, eliminarMaterial(), listarPlanning(), requireUser(), subirMaterial(), upsertPlanning() (+4 more)

### Community 73 - "Pruebas de corrección"
Cohesion: 0.27
Nodes (8): CorrectSubmissionRequest, FakeLLMFueraDeRango, FakeLLMQueCapturaElPrompt, test_correccion_devuelve_feedback_y_calificacion(), test_correccion_recorta_calificacion_fuera_de_rango(), test_correccion_sin_rubrica_usa_por_defecto(), test_el_prompt_incluye_el_esperado_de_cada_criterio(), test_el_prompt_no_inventa_esperado_si_no_viene()

### Community 75 - "Cursos y materiales (UI)"
Cohesion: 0.20
Nodes (12): MaterialItem(), COLOR_PALETTE, colorDeMateria(), ContenidoDto, estadoUnidad(), getCourseById(), getCourses(), MateriaDto (+4 more)

### Community 76 - "Branding (frontend)"
Cohesion: 0.23
Nodes (10): BrandingContext, BrandingContextValue, BrandingProvider(), useBranding(), queryClient, getConfigBranding(), Consumidor(), mockGetBranding (+2 more)

### Community 77 - "Planificación (cliente)"
Cohesion: 0.24
Nodes (12): useDeletePlanningMaterial(), useSavePlanning(), useUploadPlanningMaterial(), API_URL, deletePlanningMaterial(), getPlanning(), PlanningItemApi, savePlanning() (+4 more)

### Community 78 - "Scripts de base de datos"
Cohesion: 0.15
Nodes (13): scripts, build, db:deploy, db:generate, db:migrate, db:seed, db:studio, dev (+5 more)

### Community 79 - "Asistente docente IA"
Cohesion: 0.21
Nodes (10): Tests del ai-service con fakes, CU-P10 Generar material docente, Docente: Asistente IA (generar, PDF, publicar), Docente: planificacion y mensajes, IA_MODELOS_Y_PROMPTS.md, Prompts de desarrollo, Prompt 1: auditoria de estado y prioridades, Prompt 2: Asistente docente IA (+2 more)

### Community 80 - "Claves de matriculación (cliente)"
Cohesion: 0.30
Nodes (10): useAdminKeys(), useGenerateAdminKey(), useRevokeAdminKey(), EnrollmentKeyApi, generateAdminKey(), getAdminKeys(), NewKeyInput, revokeAdminKey() (+2 more)

### Community 81 - "Mensajes (cliente)"
Cohesion: 0.27
Nodes (10): useSendBroadcast(), useSendMessage(), ConversacionItem, formatWhen(), getAlumnosContactos(), getInbox(), MessageContact, sendBroadcast() (+2 more)

### Community 83 - "Asistente docente (backend)"
Cohesion: 0.35
Nodes (7): generarMaterial(), generarMaterialPdf(), router, GenerarMaterialInput, generarMaterialSchema, MaterialPdfInput, materialPdfSchema

### Community 84 - "Benchmark del tutor"
Cohesion: 0.18
Nodes (6): BASE, filas, N, PREGUNTAS, primeras, totales

### Community 85 - "Materias admin (cliente)"
Cohesion: 0.31
Nodes (9): useAssignAdminProfessor(), useSaveAdminSubject(), assignAdminProfessor(), getAdminSubjects(), MateriaApi, saveAdminSubject(), SubjectSaveInput, toAdminSubject() (+1 more)

### Community 87 - "RAG y Tutor IA"
Cohesion: 0.20
Nodes (10): Benchmark del tutor, CU-P02 Cargar contenido (OCR), IES Santa Fe Practica Profesionalizante 2, OCR de imagenes y PDF escaneado, Pinecone vector store, pinecone_service bloquea event loop, RAG Retrieval-Augmented Generation, SSE streaming del tutor (+2 more)

### Community 88 - "Suite E2E"
Cohesion: 0.22
Nodes (6): ahora, BASE, ctx, llamar(), login(), SUFIJO

### Community 90 - "Seed de datos"
Cohesion: 0.28
Nodes (8): adapter, estadoAsistencia, fechaClase(), limpiar(), main(), prisma, bcryptjs, @prisma/adapter-pg

### Community 91 - "Desmatriculación (UI)"
Cohesion: 0.44
Nodes (7): EnrolledStudentsPanel(), Props, EnrolledStudent, useEnrolledStudents(), useRefreshEnrollment(), useUnenrollAll(), useUnenrollStudent()

### Community 92 - "Asistente docente (cliente)"
Cohesion: 0.47
Nodes (7): useTeacherAssistant(), ask(), downloadPdf(), askTeacherAssistant(), downloadMaterialPdf(), exportMaterialPdf(), MaterialPdfResult

### Community 93 - "Entrega de actividades"
Cohesion: 0.29
Nodes (8): Entregas del alumno (4 variantes de modal), Clave de acceso a materia, CU-A01 Inscribirse a materia, 26 casos de uso: 22 completos, 4 parciales, Prueba E2E flujo-completo, Plazo de entrega, CU-A03 Entregar actividad, Entregar una actividad (plazo, reemplazo, MC autocorregida)

### Community 94 - "Seguridad y límite de intentos"
Cohesion: 0.29
Nodes (4): rateLimit(), securityHeaders(), Ventana, Opciones

### Community 95 - "Pruebas de herramientas del tutor"
Cohesion: 0.25
Nodes (6): chatTutorMock, generarExamenMock, prismaMock, resumirDocumentoMock, streamTutorMock, TEXTO_LARGO

### Community 96 - "Licencias (cliente)"
Cohesion: 0.50
Nodes (6): useAdminLicensing(), EstadoLicenciaApi, getEstadoLicencia(), getLicensePlans(), getLicenseUsage(), LicensePlan

### Community 97 - "Perfil del alumno (docente)"
Cohesion: 0.36
Nodes (7): Dato(), fecha(), MODO_LABEL, num(), PerfilAlumno, SEVERIDAD_COLOR, TeacherStudentProfilePage()

### Community 99 - "Notificaciones y capas"
Cohesion: 0.29
Nodes (7): email.service.ts (proveedores none/resend/brevo/smtp), Notificaciones (frontend implementado), API: Notificaciones, Modulos del backend (rutas -> controlador -> servicio), Notificaciones (campana), Backend en capas: rutas, controladores, servicios, middlewares, Notificaciones in-app y email de recuperacion

### Community 100 - "Scripts del frontend"
Cohesion: 0.29
Nodes (7): scripts, build, dev, lint, preview, test, typecheck

### Community 101 - "Inscripción (cliente)"
Cohesion: 0.48
Nodes (5): useEnrollment(), EnrollResult, enrollWithCode(), messageFromError(), sanitizeCode()

### Community 102 - "Reportes en PDF"
Cohesion: 0.47
Nodes (4): renderReportePdf(), ReportePdf, sinEmojis(), pdfkit

### Community 103 - "Dependencias React"
Cohesion: 0.40
Nodes (5): dependencies, react, react-dom, react-router-dom, @tanstack/react-query

### Community 106 - "Otros: Resumir documento"
Cohesion: 0.67
Nodes (3): CU-A05 Resumir documento, Resumir documento, Simulacro

### Community 108 - "Otros: actions/setup-node@v4 (Node 22)"
Cohesion: 0.67
Nodes (3): backend job (lint + typecheck + tests), frontend job (lint + typecheck + tests + build), actions/setup-node@v4 (Node 22)

## Knowledge Gaps
- **536 isolated node(s):** `asyncpg`, `fastapi`, `google-genai`, `pgvector`, `backend job (lint + typecheck + tests)` (+531 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 795 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **28 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `Aplicación React y paneles` to `Chat del tutor (hook)`, `Dependencias del frontend`, `Perfil del alumno (docente)`, `Sesión y login (frontend)`, `Pantallas de administración`, `Componentes UI y cliente API`, `Actividades y correcciones (UI)`, `Cursos y materiales (UI)`, `Branding (frontend)`, `Desmatriculación (UI)`, `Asistente docente (cliente)`, `Simulacro y curso (UI)`, `Reportes de administración`, `Herramientas del tutor (UI)`?**
  _High betweenness centrality (0.089) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `api()` (e.g. with `adminSettings.service.test.ts` and `config.service.test.ts`) actually correct?**
  _`api()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `asyncpg`, `fastapi`, `google-genai` to the rest of the system?**
  _536 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Núcleo del servicio de IA` be split into smaller, more focused modules?**
  _Cohesion score 0.05207835642618251 - nodes in this community are weakly interconnected._
- **Why does `@tanstack/react-query` connect `Reportes de administración` to `Aplicación React y paneles`, `Pantallas de administración`, `Componentes UI y cliente API`, `Entregas y actividades (cliente)`, `Dependencias del frontend`, `Correcciones y rúbricas (cliente)`, `Asistencia y dashboard (cliente)`, `Contenido y secciones (cliente)`, `Notificaciones (UI)`, `Usuarios administrados (cliente)`, `Simulacro y curso (UI)`, `Ajustes de administración`, `Analytics (cliente)`, `Progreso del alumno`, `Branding (frontend)`, `Planificación (cliente)`, `Claves de matriculación (cliente)`, `Mensajes (cliente)`, `Materias admin (cliente)`, `Desmatriculación (UI)`, `Licencias (cliente)`, `Perfil del alumno (docente)`, `Inscripción (cliente)`?**
  _High betweenness centrality (0.069) - this node is a cross-community bridge._
- **Should `Base del backend y pruebas HTTP` be split into smaller, more focused modules?**
  _Cohesion score 0.0563165905631659 - nodes in this community are weakly interconnected._
- **Why does `express` connect `App Express y rutas` to `Base del backend y pruebas HTTP`, `Módulo tutor (backend)`, `Dependencias del backend`, `Autenticación`, `Analytics (backend)`, `Materias (backend)`, `Controladores y asistente`, `Contenidos (backend)`, `Secciones (backend)`, `Notas e inscripciones`, `Controlador de administración`, `Mensajería (backend)`, `Dashboard (backend)`, `Asistencias (backend)`, `Configuración y branding (backend)`, `Esquemas y rutas de admin`, `Planificación y notificaciones`, `Asistente docente (backend)`, `Seguridad y límite de intentos`?**
  _High betweenness centrality (0.063) - this node is a cross-community bridge._