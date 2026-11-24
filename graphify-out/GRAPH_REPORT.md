# Graph Report - eduai-platform  (2026-11-24)

## Corpus Check
- 329 files · ~207,633 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 3174 nodes · 7896 edges · 145 communities (119 shown, 12 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 313 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Auth Service / Authcontext
- Button / Activityformmodal
- Asistente Chat Docente Test /
- Rag Router / Requirements
- Actividades Controller / Tutor Controller
- Tutor Service / Simulacropanel
- Ask Tutor / Helpers
- Test Llm Retry / Test
- Test Correccion Niveles / Fakes
- Email Service / Notificaciones Service
- Test Correccion Externa / Test
- Test Ocr Service / Ocr
- Tutor / Tutor Router
- Actividades Service / Actividades Schemas
- Planning Service / Useplanning
- Cache / Env
- Storage / Config Service
- Llm Service / Embeddings Service
- Test Correct Submission / Correct
- Retrieval Service / Vector Store
- Asistente Service / Asistente Schemas
- Domain / Teachercourses Service
- Corrections Service / Usecorrections
- Auth Schemas / Auth Controller
- Tutor Schemas / Tutor Service
- Paginas Humo Test / Successmetricscard
- Test Depuracion Prompts / Prompt
- Corregir Simulacro / Test Corregir
- Package 28
- Analytics Service / Analytics Controller
- Notificaciones Service / Api
- Adminusers Service / Useadminusers
- Notas Service / Notas Schemas
- Ia Modelos Y Prompts
- Assignments Service / Activities Service
- Aiclient
- Content Service / Usecontent
- Admin Service / Admin Schemas
- Guia Defensa / Escaneado
- Usetutorchat / Tutor Service
- Materias Service / Materias Controller
- Contenidos Service / Contenidos Schemas
- Auth Service / Reglas Casos
- Calificaciones Service / Usecalificaciones
- Package 44
- Rag Indexer / Aiclient
- Test Retrieval Service
- Secciones Service / Asistencias Service
- Messages Service / Usemessages
- Adminkeys Service / Adminsubjects Service
- Admin Licencias Test / Claves
- Generar Docs Api / Venv
- Package / Vite Config
- Dashboard Controller / Dashboard Service
- Teacherstudentprofilepage / Authlayout
- Teacherai Service / Useteacherassistant
- Planning Service / Planning Material
- Analytics Service / Domain
- Pinecone Service
- Tsconfig App
- Admin Controller
- Messages Service / Messages Controller
- Implementation / Requirements Dev
- Test Pinecone Service 63
- Package 64
- Package 65
- Adminsettings Service / Config Service
- Avance / Plan De Accion
- Package 68
- Limpieza De Sesion Test /
- Tutor Service / Tutor Controller
- Admin Schemas / Admin Routes
- Adminreports Service / Useadminreports
- Courses Service / Fase1 Enlaces
- Asistencias Schemas / Asistencias Controller
- Planning Controller / Planning Schemas
- Tsconfig 76
- Materialitem / Content Service
- Tsconfig Node
- Chunking Service / Test Chunking
- Readme / Avance
- Package 81
- Secciones Schemas / Secciones Controller
- Progress Service / Domain
- Readme / Manual Usuario
- Test Pinecone Service 85
- Avance 86
- Ia Modelos Y Prompts / 87
- Ci / Readme
- Seed / Material Demo
- Benchmark Tutor
- Plan De Accion
- Cache Service
- Test Pinecone Service 93
- Avance 94
- Prompts Desarrollo
- Flujo Completo E2e
- Test Index Material
- Dashboard Alumno Test / Health
- Avance 99
- Avance 100
- Documentacion Tecnica / Avance
- Useadminenrollments / Enrolledstudentspanel
- Ia Modelos Y Prompts / 103
- Test Pinecone Service 104
- Admin Service / Reports Csv
- Tutor Tools Test
- Api Endpoints / Prompts Desarrollo
- Avance 108
- Avance 109
- Notas Del Alumno Test /
- Package 111
- Reportspdf / Reports Pdf Test
- Docker Compose
- Avance 114
- Avance 115
- Genai
- Package 117
- Eslint Config / Package
- Guia Defensa 119
- Tsconfig 120
- Ci
- Test Pinecone Service 122
- Guia Defensa 123
- Requirements 125
- Requirements 126
- Requirements 127
- Requirements 128
- Implementation 140
- Implementation 141
- Ref Node Assert

## God Nodes (most connected - your core abstractions)
1. `AppError` - 255 edges
2. `react` - 82 edges
3. `prisma` - 60 edges
4. `obtenerProfesorAsignado()` - 57 edges
5. `api()` - 44 edges
6. `express` - 43 edges
7. `RetrievalService` - 42 edges
8. `@tanstack/react-query` - 42 edges
9. `Button()` - 38 edges
10. `createApp()` - 38 edges

## Surprising Connections (you probably didn't know these)
- `errorHandler()` --conceptually_related_to--> `Centralized error abstraction (star topology, load-bearing seam)`  [INFERRED]
  backend/src/middlewares/error.ts → graphify-out/memory/query_20260913_211720_0e476545_why_does_apperror_bridge_21_communities.md
- `Centralized error abstraction (star topology, load-bearing seam)` --rationale_for--> `AppError`  [EXTRACTED]
  graphify-out/memory/query_20260913_211720_0e476545_why_does_apperror_bridge_21_communities.md → backend/src/middlewares/error.ts
- `Layered Architecture Rule` --semantically_similar_to--> `Three-Tier Architecture`  [INFERRED] [semantically similar]
  PLAN_DE_ACCION.md → docs/DOCUMENTACION_TECNICA.md
- `Project Success Metrics` --semantically_similar_to--> `EduAI Platform`  [INFERRED] [semantically similar]
  docs/MATRIZ_CASOS_DE_USO.md → README.md
- `RAG Flow (material to tutor answer)` --semantically_similar_to--> `RAG Pipeline`  [INFERRED] [semantically similar]
  docs/DOCUMENTACION_TECNICA.md → README.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Centralized error-handling pattern (AppError star topology)** — backend_src_middlewares_error_apperror, backend_src_middlewares_error_errorhandler, backend_src_middlewares_error_notfound, backend_src_middlewares_error, graphify_out_memory_query_20260913_211720_0e476545_why_does_apperror_bridge_21_communities_centralized_error_abstraction [EXTRACTED 1.00]
- **EduAI Docker Compose Service Stack** — docker_compose_stack, docker_compose_db_service, docker_compose_redis_service, docker_compose_backend_service, docker_compose_ai_service, docker_compose_frontend_service [INFERRED 0.95]
- **CI Pipeline Three Jobs** — _github_workflows_ci_ci_workflow, _github_workflows_ci_backend_job, _github_workflows_ci_frontend_job, _github_workflows_ci_ai_service_job [EXTRACTED 1.00]
- **RAG Tutor Query Flow** — docs_documentacion_tecnica_rag, ai_services_readme_ask_tutor_usecase, ai_services_readme_embeddings_service, ai_services_readme_retrieval_service, docs_ia_modelos_y_prompts_pgvector, ai_services_readme_llm_service, ai_services_readme_cache_service [INFERRED 0.90]
- **Flujo completo de una consulta al tutor RAG** — docs_guia_defensa_tutor_ia, docs_guia_defensa_prompt_sanitizer, docs_guia_defensa_cache_respuestas_redis, docs_guia_defensa_embeddings_gemini, docs_guia_defensa_recuperacion_pgvector, docs_guia_defensa_gemini_llm, docs_guia_defensa_sse_streaming [EXTRACTED 1.00]
- **Seguridad de cuentas, sesiones y archivos** — docs_guia_defensa_jwt_sesion_refresh, docs_guia_defensa_lista_revocados, docs_guia_defensa_recuperacion_password, docs_guia_defensa_control_acceso, docs_guia_defensa_archivos_url_no_adivinable, docs_guia_defensa_inyeccion_prompt [INFERRED 0.85]
- **Fixture escaneado y su prueba de extracción OCR** — e2e_fixtures_escaneado, e2e_fixtures_escaneado_fotosintesis, e2e_fixtures_escaneado_extraccion_texto_ocr [EXTRACTED 1.00]

## Communities (145 total, 12 thin omitted)

### Community 0 - "Auth Service / Authcontext"
Cohesion: 0.06
Nodes (62): App(), AppShell(), Header(), PROFILE_PATH_BY_ROLE, BADGE_CLASSES, ROLE_LABEL, Sidebar(), ChangePasswordCard() (+54 more)

### Community 1 - "Button / Activityformmodal"
Cohesion: 0.08
Nodes (59): ActivityFormModal(), AYUDA, errorDeApi(), TIPOS, toInputDate(), MaterialRow(), SeccionEditForm(), Tipo (+51 more)

### Community 2 - "Asistente Chat Docente Test /"
Cohesion: 0.05
Nodes (49): createApp(), protegerArchivoSubido(), adapter, prisma, prismaMock, notificacionCreada, prismaMock, p (+41 more)

### Community 3 - "Rag Router / Requirements"
Cohesion: 0.05
Nodes (52): google-genai, structlog, redis, asyncpg, pgvector, pinecone, pypdf, python-docx, python-pptx, pinecone, pytesseract + pdf2image + Pillow (CU-P02), fastapi, uvicorn, pydantic-settings, python-multipart, Settings, create_app(), healthz() (+44 more)

### Community 4 - "Actividades Controller / Tutor Controller"
Cohesion: 0.06
Nodes (61): AppError, actualizar(), actualizarRubrica(), corregir(), corregirConIA(), crear(), crearRubrica(), eliminar() (+53 more)

### Community 5 - "Tutor Service / Simulacropanel"
Cohesion: 0.06
Nodes (51): CorreccionPropiaPanel(), Par, parVacio(), Paso, ResumenPanel(), elegirArchivo(), enviar(), quitarArchivo() (+43 more)

### Community 6 - "Ask Tutor / Helpers"
Cohesion: 0.06
Nodes (40): Reglas de estilo comunes para las respuestas del asistente IA., System prompt del modo pistas sin revelar respuesta (CU-A06)., System prompt del asistente docente (CU-A09): generación de material didáctico., System prompt del modo estudio con metodología socrática (CU-A09)., System prompt del tutor IA en modo normal (CU-A04)., TutorRequest, PromptDepurado, Respuesta sin consumir tokens del LLM cuando no hay nada que consultar… (+32 more)

### Community 7 - "Test Llm Retry / Test"
Cohesion: 0.07
Nodes (45): es_error_transitorio(), True si el error del proveedor es transitorio y vale la pena reintentar., _ClienteFalso, _Embedding, fixture, Tests del embedding por chunk (gemini-embedding-2 agrega los contents)., _Respuesta, _service() (+37 more)

### Community 8 - "Test Correccion Niveles / Fakes"
Cohesion: 0.07
Nodes (33): FakeEmbeddings, FakeLLM, FakeRetrieval, Fakes de los servicios externos para los tests del tutor IA., _caso(), _detalle(), LLMRegistrador, asyncio (+25 more)

### Community 9 - "Email Service / Notificaciones Service"
Cohesion: 0.06
Nodes (42): logger, app, server, crearTokenRecuperacion(), emitirTokenRecuperacionAdmin(), enlaceDeRecuperacion(), hashToken(), restablecerPassword() (+34 more)

### Community 10 - "Test Correccion Externa / Test"
Cohesion: 0.07
Nodes (45): System prompt para corregir las respuestas de desarrollo de un simulacro…, FakeCorreccionLLM, caso(), externa(), LLMRegistrador, pedido(), propia_del_simulacro(), asyncio (+37 more)

### Community 11 - "Test Ocr Service / Ocr"
Cohesion: 0.06
Nodes (24): DocumentService, Extracción de texto de documentos (PDF, DOCX, PPTX, TXT, imágenes)., Ultimo recurso: solo acepta algo que parezca texto de verdad. Sin este filtro,…, OcrService, Servicio de OCR para CU-P02: imagenes y PDF escaneado. Usa tesseract via…, Quita el ruido tipico de tesseract: lineas en blanco repetidas y espacios…, True si el binario de tesseract esta instalado. Se cachea el resultado., Transcribe una imagen a texto. Devuelve "" si no se puede. (+16 more)

### Community 12 - "Tutor / Tutor Router"
Cohesion: 0.09
Nodes (47): System prompt para la generación de simulacros de examen (CU-A08)., index_material(), index_material_file(), post, UploadFile, chat(), chat_stream(), corregir_entrega() (+39 more)

### Community 13 - "Actividades Service / Actividades Schemas"
Cohesion: 0.08
Nodes (49): ActualizarActividadInput, actualizarActividadSchema, ActualizarRubricaInput, actualizarRubricaSchema, CorregirEntregaInput, corregirEntregaSchema, CrearActividadInput, crearActividadSchema (+41 more)

### Community 14 - "Planning Service / Useplanning"
Cohesion: 0.09
Nodes (40): ClassFormModal(), ClassMaterialOption, CreatedClassInfo, ClassMaterialModal(), seg(), TutorLatencyCard(), Modal(), useCourseContentTree() (+32 more)

### Community 15 - "Cache / Env"
Cohesion: 0.12
Nodes (33): accesoRevocado(), permitirAcceso(), revocados, revocarAcceso(), env, envSchema, parsed, UPLOADS_DIR (+25 more)

### Community 16 - "Storage / Config Service"
Cohesion: 0.07
Nodes (33): asegurarDirectorioUploads(), clienteS3(), eliminarArchivo(), formatoDe(), guardarArchivo(), normalizarEndpoint(), prefijoPublico(), sanitizarBase() (+25 more)

### Community 17 - "Llm Service / Embeddings Service"
Cohesion: 0.07
Nodes (17): main(), EmbeddingsService, una(), Espacia las llamadas para no pasar EMBEDDING_REQUESTS_PER_MINUTE., Embebe un solo texto, reintentando ante fallos transitorios., LLMService, llamada(), abrir_y_leer_primero() (+9 more)

### Community 18 - "Test Correct Submission / Correct"
Cohesion: 0.09
Nodes (32): System prompt del Auto-correction Engine (CU-A13): corrección de entregas con…, CorrectSubmissionRequest, CriterioRubrica, NivelDesempeno, Un nivel de la rubrica (Excelente, Bueno...); `puntaje` es el % del peso que se…, limpiar_markdown(), Limpieza de marcas markdown que el chat muestra como texto plano., Quita negritas, cursivas, backticks y encabezados del texto del modelo. (+24 more)

### Community 19 - "Retrieval Service / Vector Store"
Cohesion: 0.08
Nodes (21): _init_connection(), Si la tabla existente usa otra dimension, la recrea y devuelve las filas (id,…, Materias que tienen fragmentos indexados, con cuantos, Acceso a la base vectorial de material educativo indexado., Borra TODO el material indexado de una materia., Fragmentos de material indexados para la materia (0 = nada para fundamentar)., RetrievalService, build_retrieval_service() (+13 more)

### Community 20 - "Asistente Service / Asistente Schemas"
Cohesion: 0.10
Nodes (33): crearSesionDocente(), enviarMensajeDocente(), generarMaterial(), generarMaterialPdf(), listarMensajesDocente(), listarSesionesDocente(), router, classDateSchema (+25 more)

### Community 21 - "Domain / Teachercourses Service"
Cohesion: 0.07
Nodes (33): AssignmentSubmitModal(), esVencida(), PLACEHOLDER, TITULO, useAttendanceState(), useSaveAttendance(), markFeedbackSeen(), AsistenciaApi (+25 more)

### Community 22 - "Corrections Service / Usecorrections"
Cohesion: 0.12
Nodes (33): Criterio, criterioVacio(), errorDeFormulario(), Props, RubricFormModal(), useCorrectionQueue(), useCorrectWithAi(), useCreateRubric() (+25 more)

### Community 23 - "Auth Schemas / Auth Controller"
Cohesion: 0.07
Nodes (28): rateLimit(), securityHeaders(), Ventana, cambiarPassword(), login(), me(), refresh(), limiteCredenciales (+20 more)

### Community 24 - "Tutor Schemas / Tutor Service"
Cohesion: 0.08
Nodes (35): latenciaGlobal(), router, upload, CorregirExamenInput, corregirExamenSchema, CrearSesionInput, crearSesionSchema, EnviarMensajeInput (+27 more)

### Community 25 - "Paginas Humo Test / Successmetricscard"
Cohesion: 0.08
Nodes (23): FILAS, Metrica, MetricasExito, SuccessMetricsCard(), AccesosMateria, ContentAccessCard(), fecha(), ProgressBar() (+15 more)

### Community 26 - "Test Depuracion Prompts / Prompt"
Cohesion: 0.10
Nodes (32): depurar(), _matches_greeting(), _normalize_whitespace(), Depuración de prompts de usuario (CU-SYS01)., Elimina saludos, muletillas y contenido irrelevante. Devuelve (prompt_depurado,…, Depura el prompt y clasifica el resultado para decidir si se llama al LLM. Ante…, Prefijo con limite de palabra: "hi" saluda, "historia" no., Quita saludos encadenados al comienzo ("hola, buenas tardes, ..."). (+24 more)

### Community 27 - "Corregir Simulacro / Test Corregir"
Cohesion: 0.14
Nodes (28): ExamAnswerItem, ExamItemResult, Una pregunta del simulacro con lo que respondió el alumno (CU-A11)., FakeExamenCorreccionLLM, Devuelve una correccion fija para las preguntas de desarrollo recibidas., corregir(), desarrollo(), mc() (+20 more)

### Community 28 - "Package 28"
Cohesion: 0.06
Nodes (35): author, description, keywords, license, main, name, prisma, seed (+27 more)

### Community 29 - "Analytics Service / Analytics Controller"
Cohesion: 0.11
Nodes (32): actualizarPregunta(), comprension(), crearPregunta(), dudas(), eliminarPregunta(), filtrosDe(), listarPreguntas(), progreso() (+24 more)

### Community 30 - "Notificaciones Service / Api"
Cohesion: 0.12
Nodes (27): Tr(), useEnrollment(), useMarcarLeida(), useMarcarTodasLeidas(), useNoLeidasCount(), useNotificaciones(), NotificacionesPage(), StudentEnrollPage() (+19 more)

### Community 31 - "Adminusers Service / Useadminusers"
Cohesion: 0.11
Nodes (32): invalidateUsers(), useAdminProfessors(), useAdminUsers(), useChangeAdminUserRole(), useCreateAdminUser(), useEmitirTokenRecuperacionAdmin(), useSetAdminUserActive(), AdminRolInput (+24 more)

### Community 32 - "Notas Service / Notas Schemas"
Cohesion: 0.11
Nodes (32): CategoriaPeso, media(), NotaParaPromedio, promedioPonderado(), promedioPorCategoria(), redondear(), ResultadoPromedio, ActualizarNotaInput (+24 more)

### Community 33 - "Ia Modelos Y Prompts"
Cohesion: 0.06
Nodes (34): 1. Resumen ejecutivo, 2. Modelos configurados, 3. Arquitectura RAG, 4. Principios que gobiernan todos los prompts, 5.1 Tutor IA · modo normal — `prompts/tutor.py` (CU-A04), 5.2 Tutor IA · modo estudio socrático — `prompts/socratic.py` (CU-A09), 5.3 Tutor IA · modo pistas — `prompts/hints.py` (CU-A06), 5.4 Resumen de documentos — `prompts/summary.py` (CU-A05) (+26 more)

### Community 34 - "Assignments Service / Activities Service"
Cohesion: 0.11
Nodes (31): key(), useCreateActivity(), useDeleteActivity(), useTeacherActivities(), useUpdateActivity(), useAssignments(), useSubmitAssignment(), useUploadAssignmentFile() (+23 more)

### Community 35 - "Aiclient"
Cohesion: 0.12
Nodes (33): aiDisponible(), aiHeaders(), baseUrl(), ChatMessageInput, chatTutor(), contarFragmentosIA(), CorreccionExamenItemInput, CorreccionExamenItemResult (+25 more)

### Community 36 - "Content Service / Usecontent"
Cohesion: 0.13
Nodes (29): useCreateSection(), useDeleteMaterial(), useDeleteSection(), useReorderSections(), useUpdateSection(), useUploadedMaterials(), useUploadMaterialFile(), TeacherContentPage() (+21 more)

### Community 37 - "Admin Service / Admin Schemas"
Cohesion: 0.11
Nodes (29): ActualizarMateriaAdminInput, CrearUsuarioInput, actualizarMateria(), asignarProfesor(), assertUuid(), avisar(), cambiarRol(), crearMateria() (+21 more)

### Community 38 - "Guia Defensa / Escaneado"
Cohesion: 0.08
Nodes (31): Guía de estudio para la defensa, Archivos servidos por URL no adivinable (128 bits), Asistente IA del docente, Caché de respuestas en Redis (1 hora), Pipeline de CI definido pero deshabilitado, Control de acceso por rol y pertenencia a la materia, Corrección asistida por IA con rúbrica (el docente publica), Corrección de opción múltiple sin IA (+23 more)

### Community 39 - "Usetutorchat / Tutor Service"
Cohesion: 0.11
Nodes (26): aMensajes(), guardarUltimaSesion(), leerUltimaSesion(), TUTOR_LENTO_MS, useTutorChat(), actualizarRespuesta(), ask(), nuevaConversacion() (+18 more)

### Community 40 - "Materias Service / Materias Controller"
Cohesion: 0.12
Nodes (25): crear(), crearClave(), detalle(), inscriptos(), mias(), perfilAlumno(), unirse(), router (+17 more)

### Community 41 - "Contenidos Service / Contenidos Schemas"
Cohesion: 0.13
Nodes (27): archivoDisponible(), StoredFile, ActualizarContenidoInput, actualizarContenidoSchema, CrearContenidoInput, crearContenidoSchema, reportarContenidoSchema, tipoContenidoSchema (+19 more)

### Community 42 - "Auth Service / Reglas Casos"
Cohesion: 0.11
Nodes (22): signAccessToken(), AuthResult, cambiarPassword(), generateRefreshToken(), hashToken(), login(), logout(), me() (+14 more)

### Community 43 - "Calificaciones Service / Usecalificaciones"
Cohesion: 0.15
Nodes (23): aFilas(), CategoriasNotaEditor(), Fila, ImportarNotasActividad(), clave(), useActualizarNota(), useCalificaciones(), useGuardarCategorias() (+15 more)

### Community 44 - "Package 44"
Cohesion: 0.07
Nodes (27): description, devDependencies, concurrently, name, overrides, effect, glob, test-exclude (+19 more)

### Community 45 - "Rag Indexer / Aiclient"
Cohesion: 0.14
Nodes (22): borrarMateriaIndexadaIA(), indexArchivo(), indexMaterial(), MateriaIndexada, postIndexado(), leerArchivo(), inferirTipo(), ejecutar() (+14 more)

### Community 46 - "Test Retrieval Service"
Cohesion: 0.14
Nodes (11): FakeConn, FakePool, Tests del esquema/índice de pgvector y de la migración por dimensiones., _sql(), test_crea_tabla_con_dimension_configurada_e_indice_hnsw(), test_delete_subject_borra_solo_los_fragmentos_de_esa_materia(), test_list_subjects_agrupa_los_fragmentos_por_materia(), test_migra_y_reindexa_si_cambia_la_dimension() (+3 more)

### Community 47 - "Secciones Service / Asistencias Service"
Cohesion: 0.19
Nodes (23): listarPorMateria(), actualizar(), listarMias(), listarPorMateria(), normalizarFecha(), registrarDia(), toAsistenciaDto(), registrarAcceso() (+15 more)

### Community 48 - "Messages Service / Usemessages"
Cohesion: 0.20
Nodes (20): hora(), MessageThread(), useContacts(), useConversation(), useInbox(), useSendBroadcast(), useSendMessage(), StudentMessagesPage() (+12 more)

### Community 49 - "Adminkeys Service / Adminsubjects Service"
Cohesion: 0.14
Nodes (21): useAdminKeys(), useGenerateAdminKey(), useRevokeAdminKey(), useAdminSubjects(), useAssignAdminProfessor(), useSaveAdminSubject(), AdminClavesPage(), EnrollmentKeyApi (+13 more)

### Community 50 - "Admin Licencias Test / Claves"
Cohesion: 0.10
Nodes (16): apiMock, saveMock, subject, mutationMocks, routerMocks, keys, mocks, subjects (+8 more)

### Community 51 - "Generar Docs Api / Venv"
Cohesion: 0.08
Nodes (21): ref_node_child_process, ref_node_url, app, destino, filas, importaciones, lineas, montajes (+13 more)

### Community 52 - "Package / Vite Config"
Cohesion: 0.09
Nodes (21): eslint, @types/node, typescript, typescript-eslint, description, name, private, type (+13 more)

### Community 53 - "Dashboard Controller / Dashboard Service"
Cohesion: 0.14
Nodes (19): errorHandler(), notFound(), resolverError(), rubricaParaIA(), generarCorreccionIA(), assertUuid(), generarCorreccionIA(), dashboard() (+11 more)

### Community 54 - "Teacherstudentprofilepage / Authlayout"
Cohesion: 0.14
Nodes (17): AuthLayout(), botonClase, inputClase, ForgotPasswordPage(), ResetPasswordPage(), fecha(), MODO_LABEL, num() (+9 more)

### Community 55 - "Teacherai Service / Useteacherassistant"
Cohesion: 0.18
Nodes (20): aMensajes(), MensajeAsistenteDocente, ultimaRespuesta(), useTeacherAssistant(), ask(), downloadPdf(), nuevaConversacion(), obtenerSesion() (+12 more)

### Community 56 - "Planning Service / Planning Material"
Cohesion: 0.18
Nodes (21): asignarMaterialDesdeContenido(), assertUuid(), contenidoDelMaterial(), eliminarMaterial(), listarPlanning(), PlanningRow, retirarMaterialAnterior(), seccionParaMaterial() (+13 more)

### Community 57 - "Analytics Service / Domain"
Cohesion: 0.17
Nodes (20): useAnalytics(), useTopicDetail(), AlertaApi, ComprensionApi, DudaApi, filtrosQuery(), getFrequentErrors(), getFrequentQuestions() (+12 more)

### Community 58 - "Pinecone Service"
Cohesion: 0.13
Nodes (5): PineconeRetrievalService, Materias (namespaces) con fragmentos indexados, con cuantos., Borra TODO el material indexado de una materia (su namespace)., Cuantos fragmentos hay indexados para la materia (cada materia es un namespace)., Acceso a la base vectorial de material educativo indexado en Pinecone.

### Community 59 - "Tsconfig App"
Cohesion: 0.09
Nodes (21): compilerOptions, allowImportingTsExtensions, composite, isolatedModules, jsx, lib, module, moduleDetection (+13 more)

### Community 60 - "Admin Controller"
Cohesion: 0.19
Nodes (20): actualizarEstado(), actualizarMateria(), asignarProfesor(), cambiarRol(), crearMateria(), crearUsuario(), desmatricular(), desmatricularTodos() (+12 more)

### Community 61 - "Messages Service / Messages Controller"
Cohesion: 0.17
Nodes (17): rolSchema, enviarBroadcast(), enviarMensaje(), listarContactos(), listarConversaciones(), obtenerMensajes(), requireUser(), BroadcastInput (+9 more)

### Community 62 - "Implementation / Requirements Dev"
Cohesion: 0.12
Nodes (19): pytest / pytest-asyncio / httpx / ruff (dev deps), frontend/index.html (entrada SPA Vite), src/main.tsx (punto de montaje #root), Documento de implementacion, Backend en capas: rutas, controladores, servicios, middlewares, ChromaDB (vector store planificado), CI/CD con GitHub Actions (ci.yml, deploy.yml), docker-compose.yml (servicios del entorno) (+11 more)

### Community 63 - "Test Pinecone Service 63"
Cohesion: 0.21
Nodes (16): FakeMatch, make_service(), asyncio, Tests del servicio de búsqueda vectorial en Pinecone., test_close_closes_client(), test_count_chunks_cuenta_los_vectores_del_namespace_de_la_materia(), test_count_chunks_tambien_acepta_una_respuesta_tipo_dict_y_un_indice_vacio(), test_creates_serverless_index_when_missing() (+8 more)

### Community 64 - "Package 64"
Cohesion: 0.10
Nodes (20): dependencies, @aws-sdk/client-s3, @aws-sdk/lib-storage, bcryptjs, cookie-parser, cors, dotenv, express (+12 more)

### Community 65 - "Package 65"
Cohesion: 0.10
Nodes (20): devDependencies, eslint, jest, supertest, @swc/core, @swc/jest, tsx, @types/bcryptjs (+12 more)

### Community 66 - "Adminsettings Service / Config Service"
Cohesion: 0.19
Nodes (15): useAdminSettings(), useSaveBranding(), getBranding(), getColorPresets(), saveBranding(), SaveBrandingInput, uploadBrandingLogo(), BrandingApi (+7 more)

### Community 67 - "Avance / Plan De Accion"
Cohesion: 0.16
Nodes (19): Cloud Deploy Decision (archived), CSV BOM + Semicolon Encoding, Filename Mojibake Fix (nombreArchivoUtf8), Bugs & Missing Features Plan (archived), Email Service, Weighted Grading Categories, Project Progress Log (bitácora), Password Recovery by Email (+11 more)

### Community 68 - "Package 68"
Cohesion: 0.11
Nodes (19): devDependencies, autoprefixer, eslint, eslint-plugin-react-hooks, jsdom, postcss, tailwindcss, @testing-library/jest-dom (+11 more)

### Community 69 - "Limpieza De Sesion Test /"
Cohesion: 0.16
Nodes (15): useAdminLicensing(), EstadoLicenciaApi, getEstadoLicencia(), getLicensePlans(), getLicenseUsage(), reiniciarCacheDeLicencias(), ana, apiMock (+7 more)

### Community 70 - "Tutor Service / Tutor Controller"
Cohesion: 0.17
Nodes (18): seccionDeFuentes(), extraerFuentesSse(), extraerTextoSse(), stream(), buscarPreguntaFrecuente(), contarConsulta(), enviarMensaje(), listarMensajes() (+10 more)

### Community 71 - "Admin Schemas / Admin Routes"
Cohesion: 0.17
Nodes (15): limiteRecuperacionAdmin, router, ActualizarEstadoInput, actualizarEstadoSchema, actualizarMateriaAdminSchema, AsignarProfesorInput, asignarProfesorSchema, CambiarRolInput (+7 more)

### Community 72 - "Adminreports Service / Useadminreports"
Cohesion: 0.24
Nodes (14): useAdminReports(), useExportReport(), useExportReportPdf(), AdminReportsPage(), downloadCsv(), downloadPdf(), EXPORT_LABELS, ExportPdfResult (+6 more)

### Community 73 - "Courses Service / Fase1 Enlaces"
Cohesion: 0.17
Nodes (14): ClaseArbolDto, COLOR_PALETTE, colorDeMateria(), ContenidoDto, estadoUnidad(), getCourseById(), MateriaDto, materialDePlanificacion() (+6 more)

### Community 74 - "Asistencias Schemas / Asistencias Controller"
Cohesion: 0.14
Nodes (13): actualizar(), listarPorMateria(), mías(), registrarDia(), ActualizarAsistenciaInput, actualizarAsistenciaSchema, estadosAsistencia, RegistraAsistenciaInput (+5 more)

### Community 75 - "Planning Controller / Planning Schemas"
Cohesion: 0.20
Nodes (13): crearArchivo(), asignarMaterialDesdeContenido(), eliminarMaterial(), listarPlanning(), requireUser(), subirMaterial(), upsertPlanning(), estadoPlanningSchema (+5 more)

### Community 76 - "Tsconfig 76"
Cohesion: 0.12
Nodes (15): compilerOptions, declaration, esModuleInterop, forceConsistentCasingInFileNames, module, moduleResolution, outDir, resolveJsonModule (+7 more)

### Community 77 - "Materialitem / Content Service"
Cohesion: 0.17
Nodes (12): EstadoReporte, MaterialItem(), fecha(), ReportesMaterialCard(), getReportesMaterial(), reportarProblemaMaterial(), resolverReportesMaterial(), registerContentAccess() (+4 more)

### Community 78 - "Tsconfig Node"
Cohesion: 0.12
Nodes (15): compilerOptions, allowImportingTsExtensions, composite, isolatedModules, lib, module, moduleDetection, moduleResolution (+7 more)

### Community 79 - "Chunking Service / Test Chunking"
Cohesion: 0.20
Nodes (10): ChunkingService, estimate_tokens(), Divide textos largos en fragmentos aptos para embedding y contexto., Estimación aproximada de tokens (código independiente del modelo)., test_chunk_text_empty_input(), test_chunk_text_preserves_whitespace_normalization(), test_chunk_text_short_document_returns_single_chunk(), test_chunk_text_splits_long_document() (+2 more)

### Community 80 - "Readme / Avance"
Cohesion: 0.15
Nodes (14): AskTutorUseCase, Cache Service (Redis TTL), HNSW Index (1536 dims), FastAPI main.py (DI lifespan), Pinecone Retrieval Service, Prompt Sanitizer, pgvector Retrieval Service, Vector Store Factory (build_retrieval_service) (+6 more)

### Community 81 - "Package 81"
Cohesion: 0.14
Nodes (14): scripts, build, db:deploy, db:generate, db:migrate, db:seed, db:studio, demo:reset (+6 more)

### Community 82 - "Secciones Schemas / Secciones Controller"
Cohesion: 0.18
Nodes (12): actualizar(), crear(), eliminar(), listarPorMateria(), reordenar(), ActualizarSeccionInput, actualizarSeccionSchema, CrearSeccionInput (+4 more)

### Community 83 - "Progress Service / Domain"
Cohesion: 0.21
Nodes (12): useProgress(), ESTADO_LABEL, getProgressData(), gradeColor(), ProgresoApi, ProgressData, ProgressOverview, ResumenProgresoApi (+4 more)

### Community 84 - "Readme / Manual Usuario"
Cohesion: 0.22
Nodes (13): Single-Endpoint Study Modes (normal/socratic/hints), Enrollment Key (clave de matriculación), User Manual, User Roles (Alumno/Docente/Administrador), Tutor Modes (Normal/Socrático/Pistas), Use Case Matrix (26 use cases), Project Success Metrics, AI Tutor Contextualized by Subject (+5 more)

### Community 85 - "Test Pinecone Service 85"
Cohesion: 0.17
Nodes (7): IndiceLento, _latidos_durante(), parametrize, Un índice cuya red tarda: cada operación bloquea el hilo que la ejecuta., Cuántas veces pudo correr otra corrutina mientras `operacion` esperaba la red., _servicio_lento(), test_ninguna_operacion_congela_el_event_loop()

### Community 86 - "Avance 86"
Cohesion: 0.17
Nodes (12): 10. ✅ Cambiar de vector store: procedimiento y limpieza (2026-11-20), 11. ✅ `pinecone_service.py` ya no bloquea el event loop (2026-11-20), 12. Gemini intermitente, 13. ✅ `CHROMA_URL` eliminada (2026-10-17), 14. ✅ E2E que faltaban (2026-11-20), 15. ✅ El CI estaba en rojo y no se veía (2026-11-20), 16. ✅ Base lista para demo (2026-11-20), 17. ✅ Recuperación de contraseña por correo (2026-11-20) (+4 more)

### Community 87 - "Ia Modelos Y Prompts / 87"
Cohesion: 0.20
Nodes (12): Embedding Concept, Defense Study Guide, Server-Sent Events (SSE) Streaming, 1536-Dimension Embeddings, Argentine 0-10 Grading Scale, Strict JSON Output Contracts, Mock-first Development Strategy, AI Models & Prompts Reference (+4 more)

### Community 88 - "Ci / Readme"
Cohesion: 0.18
Nodes (11): AI Service CI Job (ruff + pytest), Backend CI Job (lint + typecheck + tests), CI Pipeline (GitHub Actions), Frontend CI Job (lint + typecheck + tests + build), Prisma Generate CI Step, AI Service (FastAPI microservice), Chunking Service, Embeddings Service (+3 more)

### Community 89 - "Seed / Material Demo"
Cohesion: 0.24
Nodes (9): MATERIAL_DEMO, MaterialDemo, adapter, estadoAsistencia, fechaClase(), limpiar(), main(), prisma (+1 more)

### Community 90 - "Benchmark Tutor"
Cohesion: 0.18
Nodes (6): BASE, filas, N, PREGUNTAS, primeras, totales

### Community 91 - "Plan De Accion"
Cohesion: 0.18
Nodes (10): Diagnóstico, Fase 0 — Cierre rápido (1-2 h, casi sin código), Fase 1 — Seguridad (antes de la defensa), Fase 2 — Bugs visibles en demo (mayor retorno), Fase 3 — Calidad, Fase 4 — Post-defensa / opcional, Plan de acción — EduAI Platform, Recomendación de arranque (+2 more)

### Community 92 - "Cache Service"
Cohesion: 0.20
Nodes (4): CacheService, Servicio de cacheo en Redis para consultas y respuestas del tutor IA., Caché clave/valor con TTL. Degrada de forma silenciosa si Redis no está…, redis_asyncio

### Community 93 - "Test Pinecone Service 93"
Cohesion: 0.20
Nodes (3): fake_pinecone(), FakePinecone, fixture

### Community 94 - "Avance 94"
Cohesion: 0.20
Nodes (10): 1. Deploy a cloud — opcional, 2. ✅ Notificaciones — frontend implementado (2026-10-16), 3. ✅ Email — servicio implementado y cableado (2026-10-17), 4. ✅ R2 / object storage — cliente S3 integrado (2026-10-16), 5. ✅ Export PDF de reportes (2026-10-16), 6. ✅ Branding — presets en backend + logo a storage (2026-10-17), 🟢 DEPLOY — NO BLOQUEA LA ENTREGA, 🟠 FUNCIONALIDAD (2–6 ✅ hechas; 6 cerrada 2026-10-17) (+2 more)

### Community 95 - "Prompts Desarrollo"
Cohesion: 0.20
Nodes (9): Contexto al inicio de la sesión, EduAI · Prompts de desarrollo — Sesión de trabajo, Lecciones de proceso de esta sesión, Prompt 1 · «¿Qué hicimos hasta ahora? ¿Qué más quedaría? Solo coméntamelo.», Prompt 2 · «Dale, hagamos ese» → Asistente docente IA, Prompt 3 · «Dale» → Corrección IA (Auto-correction Engine), Prompt 4 · «Generame un archivo .md explicando qué IA se usó, qué modelo, los distintos prompts y las decisiones a lo largo del desarrollo», Prompt 5 · Aclaración — «Me refería a los prompts que usamos a lo largo de todo el desarrollo» (+1 more)

### Community 96 - "Flujo Completo E2e"
Cohesion: 0.22
Nodes (8): ahora, AI_URL, BASE, ctx, llamar(), login(), SUFIJO, ref_node_test

### Community 97 - "Test Index Material"
Cohesion: 0.28
Nodes (5): _EmbedderAgregado, Tests del caso de uso de indexado., Simula el bug original: un solo vector para N textos., _RetrievalEspia, test_falla_y_no_borra_si_faltan_vectores()

### Community 98 - "Dashboard Alumno Test / Health"
Cohesion: 0.25
Nodes (5): health(), router, actividad(), materia(), prismaMock

### Community 99 - "Avance 99"
Cohesion: 0.22
Nodes (9): Alumno, ✅ El alumno no ve cómo se arma su nota final, ✅ El chat con el tutor de IA no persiste, ✅ El chat con el tutor debe poder ampliarse, ✅ Entregas: columna "Nota", ✅ Material/PDF no abre ni descarga, ✅ Mensajería de alumno hacia el profesor, ✅ "Mis estadísticas" completamente mockeada (+1 more)

### Community 100 - "Avance 100"
Cohesion: 0.22
Nodes (9): Detalle de lo hecho (contexto técnico), Docker verificado (2026-09-28), Entregas del alumno (CU-A03, 2026-09-30), Gemini en producción (2026-09-28) — modelo y reintentos, Gestión de actividades del docente (CU-P03, 2026-09-30), OCR de imágenes y PDF escaneado (CU-P02, 2026-09-30), RAG para archivos (✅ 2026-09-25), Rúbricas y corrección IA (CU-P04 + CU-A07, 2026-09-30) (+1 more)

### Community 101 - "Documentacion Tecnica / Avance"
Cohesion: 0.31
Nodes (9): OCR Service (Tesseract), Three-Tier Architecture, Controlled Degradation, Documentación Técnica, X-Internal-Token Shared Secret, Tutor Latency Measurement, Known Limitations, RAG Flow (material to tutor answer) (+1 more)

### Community 102 - "Useadminenrollments / Enrolledstudentspanel"
Cohesion: 0.44
Nodes (7): EnrolledStudentsPanel(), Props, EnrolledStudent, useEnrolledStudents(), useRefreshEnrollment(), useUnenrollAll(), useUnenrollStudent()

### Community 103 - "Ia Modelos Y Prompts / 103"
Cohesion: 0.25
Nodes (8): LLM Service (Gemini), DB and ai-service Same Region, Gemini 503 Exponential-Backoff Retry, Deviations from Original Plan, Gemini flash-lite Model Choice, pgvector Vector Store, AI Service planificado: routers, services, use_cases, prompts, OpenAI (LLM y embeddings planificados)

### Community 105 - "Admin Service / Reports Csv"
Cohesion: 0.29
Nodes (7): csvFromReporte(), escapeCsvCell(), exportarReporte(), exportarReporteCsv(), exportarReportePdf(), reportesAdmin(), reporte

### Community 106 - "Tutor Tools Test"
Cohesion: 0.25
Nodes (6): chatTutorMock, generarExamenMock, prismaMock, resumirDocumentoMock, streamTutorMock, TEXTO_LARGO

### Community 107 - "Api Endpoints / Prompts Desarrollo"
Cohesion: 0.25
Nodes (8): Administración API Module, API Endpoints (131 endpoints), Asistente Docente API Module, Tutor IA API Module, Contract-first Development, Development Prompts Log, Teacher Assistant IA Implementation, Layered Architecture Rule

### Community 108 - "Avance 108"
Cohesion: 0.25
Nodes (8): Admin — conectado al backend real, Administrador, BUGS Y FALTANTES (reporte de usuarios — 2026-11-17), ✅ "Editar" materia no trae descripción ni nivel educativo, Estado: conectado al backend real, Resumen de estado, Servicio de IA (ai-service) — integrado, STACK

### Community 109 - "Avance 109"
Cohesion: 0.25
Nodes (8): ✅ Correcciones de "Contenidos", ✅ El docente no puede ver el documento de una entrega, ✅ Filtros de mensajería, ✅ Gestionar secciones envía a "Mis alumnos", ✅ Material para estudiantes, Profesor, ✅ Reorganización de menús y jerarquías, ✅ Simulación de TPs y exámenes para "Calificaciones"

### Community 110 - "Notas Del Alumno Test /"
Cohesion: 0.25
Nodes (5): colorNota(), formatoNota(), StudentAssignmentsPage(), StudentProgressPage(), apiMock

### Community 111 - "Package 111"
Cohesion: 0.29
Nodes (7): scripts, build, dev, lint, preview, test, typecheck

### Community 112 - "Reportspdf / Reports Pdf Test"
Cohesion: 0.47
Nodes (4): renderReportePdf(), ReportePdf, sinEmojis(), pdfkit

### Community 113 - "Docker Compose"
Cohesion: 0.67
Nodes (6): ai-service service, backend service, db service (pgvector/pg16), frontend service, redis service (7-alpine), Docker Compose Stack (eduai)

### Community 114 - "Avance 114"
Cohesion: 0.33
Nodes (5): CÓMO CORRER, Docker (recomendado), EduAI Platform — Avance del Proyecto, Local (sin contenedores de app), Verificación

### Community 115 - "Avance 115"
Cohesion: 0.33
Nodes (6): ✅ Ajustes de prompting, ✅ Eliminar "SIMILAR A MOODLE", General, 🟡 Licencias, ✅ Problemas de encoding, ✅ Sacar el buscador de la plataforma

### Community 116 - "Genai"
Cohesion: 0.40
Nodes (4): get_genai_client(), Devuelve el cliente compartido de Gemini, creado de forma perezosa. Si la clave…, Client, google

### Community 117 - "Package 117"
Cohesion: 0.40
Nodes (5): dependencies, react, react-dom, react-router-dom, @tanstack/react-query

### Community 119 - "Guia Defensa 119"
Cohesion: 0.67
Nodes (3): Token de sesión JWT de 15 min + cookie httpOnly de 7 días, Lista de tokens revocados en memoria, Recuperación de contraseña con token de 256 bits

### Community 121 - "Ci"
Cohesion: 0.67
Nodes (3): backend job (lint + typecheck + tests), frontend job (lint + typecheck + tests + build), actions/setup-node@v4 (Node 22)

## Knowledge Gaps
- **752 isolated node(s):** `ReportePdf`, `Notificacion`, `BrandingContextValue`, `Request`, `NotificacionApi` (+747 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1120 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `Button / Activityformmodal` to `Auth Service / Authcontext`, `Tutor Service / Simulacropanel`, `Useadminenrollments / Enrolledstudentspanel`, `Usetutorchat / Tutor Service`, `Adminreports Service / Useadminreports`, `Calificaciones Service / Usecalificaciones`, `Materialitem / Content Service`, `Planning Service / Useplanning`, `Messages Service / Usemessages`, `Package / Vite Config`, `Domain / Teachercourses Service`, `Teacherstudentprofilepage / Authlayout`, `Corrections Service / Usecorrections`, `Teacherai Service / Useteacherassistant`, `Paginas Humo Test / Successmetricscard`, `Adminusers Service / Useadminusers`?**
  _High betweenness centrality (0.086) - this node is a cross-community bridge._
- **Why does `@tanstack/react-query` connect `Paginas Humo Test / Successmetricscard` to `Auth Service / Authcontext`, `Button / Activityformmodal`, `Tutor Service / Simulacropanel`, `Planning Service / Useplanning`, `Domain / Teachercourses Service`, `Corrections Service / Usecorrections`, `Notificaciones Service / Api`, `Adminusers Service / Useadminusers`, `Assignments Service / Activities Service`, `Content Service / Usecontent`, `Calificaciones Service / Usecalificaciones`, `Messages Service / Usemessages`, `Adminkeys Service / Adminsubjects Service`, `Admin Licencias Test / Claves`, `Package / Vite Config`, `Teacherstudentprofilepage / Authlayout`, `Analytics Service / Domain`, `Adminsettings Service / Config Service`, `Limpieza De Sesion Test /`, `Adminreports Service / Useadminreports`, `Materialitem / Content Service`, `Progress Service / Domain`, `Useadminenrollments / Enrolledstudentspanel`, `Notas Del Alumno Test /`?**
  _High betweenness centrality (0.071) - this node is a cross-community bridge._
- **Why does `@prisma/client` connect `Auth Service / Reglas Casos` to `Notas Service / Notas Schemas`, `Asistente Chat Docente Test /`, `Admin Service / Admin Schemas`, `Materias Service / Materias Controller`, `Contenidos Service / Contenidos Schemas`, `Email Service / Notificaciones Service`, `Actividades Service / Actividades Schemas`, `Rag Indexer / Aiclient`, `Cache / Env`, `Secciones Service / Asistencias Service`, `Messages Service / Messages Controller`, `Dashboard Controller / Dashboard Service`, `Planning Service / Planning Material`, `Seed / Material Demo`, `Package 28`, `Analytics Service / Analytics Controller`, `Tutor Schemas / Tutor Service`?**
  _High betweenness centrality (0.063) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `api()` (e.g. with `adminSettings.service.test.ts` and `config.service.test.ts`) actually correct?**
  _`api()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `ReportePdf`, `Notificacion`, `BrandingContextValue` to the rest of the system?**
  _752 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Auth Service / Authcontext` be split into smaller, more focused modules?**
  _Cohesion score 0.05543071161048689 - nodes in this community are weakly interconnected._
- **Should `Button / Activityformmodal` be split into smaller, more focused modules?**
  _Cohesion score 0.08366746859128575 - nodes in this community are weakly interconnected._