# EduAI: Campus educativo virtual integrado con asistente de Inteligencia Artificial

**Instituto de Estudios Superiores de Santa Fe | Técnico Superior en Desarrollo de Software**
**Práctica Profesionalizante 2**

**Alumnos:** Acevedo Lautaro, Canello Manuel, Oliver Matias, Rojas Máximo

---

## Índice

1. Delimitación del problema
   1.1. Objetivos
   1.2. Población
2. Fundamentación
3. Plan de proyecto
   3.1. Metodología de desarrollo
   3.2. Actividades a desarrollar
   3.3. Estimación de esfuerzo
   3.4. Recursos humanos
   3.5. Ambiente de desarrollo, tecnologías y plataformas
4. Anexo A - Entrevistas
5. Anexo B - Casos de Uso
   5.1. Diagrama de Casos de Uso
   5.2. Especificación de Casos de Uso
6. Anexo C - Diagramas
   6.1. Mockup y pantallas
   6.2. Modelo de base de datos
   6.3. Diagrama de arquitectura

---

## 1. Delimitación del problema

El problema a resolver se enfoca en dos ramas: por un lado, el docente se encuentra con mucha carga horaria, tanto para corregir trabajos prácticos como para generar material de estudio (clases, presentaciones, ejercitaciones, etc.). Además, la toma de asistencia se torna dificultosa en algunos contextos como en la primaria o secundaria. También, muchas veces los alumnos tienen las mismas dudas y no preguntan, lo cual puede ser contraproducente para ambas partes, porque podría indicar dificultades para aprender por parte de los alumnos o dificultades de enseñar por parte del profesor. Por último, existe una dificultad a la hora de realizar el seguimiento a cada alumno en particular.

Por otro lado, muchos alumnos se enfrentan a problemas como no tener la ayuda de un tutor fuera del horario de clases, por lo que suelen recurrir al uso de IA y tienen que, o pasarle todos los documentos y apuntes, o que la IA saque información de cualquier fuente, lo que puede llevar a errores y/o malentendidos que terminan desinformando y/o confundiendo al alumno.

### 1.1. Objetivos

El objetivo general es que haya un tutor IA contextualizado por materia, combinado con feedback automático sobre actividades, corrección asistida por rúbricas y asistencia a docentes en la preparación de clases, generando adopción sostenida y reduciendo la carga operativa docente.

**Métricas de éxito:**
- Tasa de uso del tutor IA por sesión activa de alumno ≥ 40%.
- Reducción autopercibida del tiempo de preparación de clases por docentes ≥ 30% en encuesta post-lanzamiento.
- Porcentaje de actividades con feedback automático revisado por el alumno ≥ 60%.
- Retención mensual de usuarios activos ≥ 70% en el primer trimestre.

### 1.2. Población

La fuente de datos del relevamiento fue una encuesta a 42 participantes (34 estudiantes y 8 docentes), complementada con el relevamiento de producto EduAI Platform v1.0. La población objetivo del sistema comprende instituciones de nivel secundario, terciario, universitario y corporativo.

**Actores del sistema:** Alumno, Profesor y Administrador.

---

## 2. Fundamentación

En base a la investigación realizada, percibimos que hay un alto uso por parte de los docentes con la inteligencia artificial para organizar clases o generar documentación académica, como ejercitación, trabajos prácticos, etc. Además, todos los alumnos la usan para estudiar, ya sea generación de resúmenes, feedback de actividades o nuevas actividades para practicar/estudiar. Pero al no darle un uso correcto (como no brindar el contexto necesario, copiar y pegar sin razonar realmente) el alumno no termina aprendiendo.

En la actualidad ningún campus virtual cuenta con una integración con agentes de IA que estén alimentados con el contexto y material académico pertinente de cada cátedra. EduAI viene a satisfacer dichas necesidades, ya que impulsa el aprendizaje con IA y facilita los procesos ajenos a este, como el manejo de herramientas digitales, al tener una interfaz sencilla y entendible.

---

## 3. Plan de proyecto

### 3.1. Metodología de desarrollo

El desarrollo de EduAI se llevará a cabo bajo la metodología ágil Scrum, adaptada al contexto académico y al equipo de cuatro integrantes. Esta elección se fundamenta en la naturaleza iterativa del proyecto, que requiere validación continua de funcionalidades con usuarios reales (docentes y alumnos) y permite incorporar cambios de requisitos durante el ciclo de vida del desarrollo.

#### Marco de trabajo Scrum

Los sprints tendrán una duración de 2 semanas, con entregas incrementales funcionales al final de cada uno.

| Rol Scrum | Responsable | Responsabilidades principales |
|---|---|---|
| Product Owner | Acevedo Lautaro | Priorización del backlog, validación con usuarios |
| Scrum Master | Canello Manuel | Facilitación de ceremonias, gestión de impedimentos |
| Dev Team | Oliver Matias, Rojas Máximo, Acevedo Lautaro, Canello Manuel | Diseño, desarrollo, testing e integración y despliegue |

#### Ceremonias Scrum

- **Sprint Planning** (inicio de cada sprint, 1 hora): definición de objetivos y selección de ítems del backlog.
- **Backlog Refinement** (mitad del sprint, 2 horas): refinamiento y estimación de próximas historias de usuario.
- **Stand-up Meeting** (3 veces por semana, 15 minutos): sincronización del equipo, bloqueos y avances.
- **Sprint Review** (fin de sprint, 1 hora): demo de funcionalidades entregadas al tutor/usuario.
- **Sprint Retrospective** (fin de sprint, 45 minutos): mejora del proceso interno del equipo.

#### Artefactos

- **Product Backlog:** lista priorizada de todas las funcionalidades del sistema (historias de usuario).
- **Sprint Backlog:** subset de ítems comprometidos para cada sprint.
- **Definition of Done (DoD):** criterio que define cuándo una historia está terminada (código desarrollado, pruebas unitarias pasadas, revisión de pares, integración exitosa).
- **Definition of Ready (DoR):** acuerdo entre el equipo y el Product Owner que establece los requisitos mínimos que debe cumplir una tarea o Historia de Usuario para poder empezar a desarrollarse en un Sprint. Evita trabajar en tareas con información incompleta.
- **Incremento:** versión funcional y entregable del producto al final de cada sprint.

### 3.2. Actividades a desarrollar

Las actividades se organizan en fases iterativas, alineadas con los módulos funcionales del sistema: Alumno, Profesor y Administrador.

| Sprint | Módulos / Entregables | Story Points | Semanas | Responsable principal |
|---|---|---|---|---|
| 0 | Configuración repositorio GitHub y estrategia de ramas | 3 | 1-2 | Todo el equipo |
| 0 | Setup entorno local: dependencias, BD, variables de entorno | 4 | 1-2 | Todo el equipo |
| 0 | Definición y refinamiento del Product Backlog | 4 | 1-2 | Todo el equipo |
| 0 | Diseño de arquitectura general del sistema | 5 | 1-2 | Todo el equipo |
| 0 | Configuración pipelines CI/CD (GitHub Actions) | 2 | 1-2 | Todo el equipo |
| 0 | Setup proyecto en plataforma cloud (Railway / Render) | 2 | 1-2 | Todo el equipo |
| 1 | Módulo autenticación: registro, login y recuperación de contraseña | 8 | 3-4 | Acevedo/Canello |
| 1 | Gestión de roles con permisos diferenciados | 5 | 3-4 | Acevedo/Canello |
| 1 | CU-AD01/02/03: alta, baja y modificación de usuarios y materias | 8 | 3-4 | Acevedo/Canello |
| 1 | Panel principal por rol con navegación básica | 5 | 3-4 | Acevedo/Canello |
| 1 | Testing unitario del módulo de autenticación | 4 | 3-4 | Acevedo/Canello |
| 1 | Integración JWT / manejo de sesiones | 5 | 3-4 | Acevedo/Canello |
| 2 | CU-P01/P02: creación de secciones y subida de contenido (docente) | 8 | 5-6 | Oliver/Rojas |
| 2 | Soporte de formatos: PDF, DOCX, PPTX, JPG, PNG, TXT | 5 | 5-6 | Oliver/Rojas |
| 2 | CU-A02: vista de navegación de contenido para el alumno | 5 | 5-6 | Oliver/Rojas |
| 2 | CU-A01: inscripción de alumnos mediante clave de matriculación | 5 | 5-6 | Oliver/Rojas |
| 2 | Integración RAG Pipeline: indexación automática del material subido | 13 | 5-6 | Rojas |
| 2 | Almacenamiento de archivos y gestión de rutas | 4 | 5-6 | Rojas |
| 3 | AI Tutor Engine: integración LLM (OpenAI / Claude API) + RAG | 3 | 7-8 | Rojas |
| 3 | CU-A04: consultas en lenguaje natural contextualizadas a la materia | 5 | 7-8 | Rojas |
| 3 | CU-A05: solicitud de resúmenes de documentos | 5 | 7-8 | Canello/Acevedo |
| 3 | CU-A06: solicitud de pistas sin revelar respuesta | 3 | 7-8 | Canello/Acevedo |
| 3 | CU-A09: modo estudio con metodología socrática | 3 | 7-8 | Canello/Acevedo |
| 3 | CU-A08: generación de simulacros de examen | 5 | 7-8 | Canello/Acevedo |
| 3 | Historial de interacciones del alumno con la IA | 5 | 7-8 | Canello/Acevedo |
| 3 | UI del chat / interfaz del tutor IA | 4 | 7-8 | Canello/Acevedo |
| 4 | CU-P03: definición de espacios de entrega por el docente | 5 | 9-10 | Canello/Acevedo |
| 4 | CU-P04: configuración de rúbricas de evaluación | 5 | 9-10 | Canello/Acevedo |
| 4 | CU-A03: entrega de actividades — multiple choice | 4 | 9-10 | Canello/Acevedo |
| 4 | CU-A03: entrega de actividades — desarrollo escrito | 4 | 9-10 | Canello/Acevedo |
| 4 | CU-A03: entrega de actividades — archivo y código | 4 | 9-10 | Canello/Acevedo |
| 4 | CU-A07: Auto-correction Engine con rúbrica + feedback explicativo | 13 | 9-10 | Canello/Acevedo |
| 4 | CU-P05: revisión, edición y publicación del feedback (docente) | 5 | 9-10 | Canello/Acevedo |
| 5 | Analytics Engine: procesamiento de interacciones, notas y asistencia | 8 | 11-12 | Todo el equipo |
| 5 | CU-P06: registro de notas y asistencia por el docente | 4 | 11-12 | Todo el equipo |
| 5 | CU-P07: dashboard docente — mapa de calor + alertas de riesgo académico | 8 | 11-12 | Todo el equipo |
| 5 | CU-P08: dashboard de errores y dudas frecuentes detectadas por IA | 5 | 11-12 | Todo el equipo |
| 5 | CU-A10: panel de estadísticas personales del alumno | 5 | 11-12 | Todo el equipo |
| 5 | CU-P10: historial de interacciones del alumno visible para el docente | 5 | 13-14 | Todo el equipo |
| 6 | CU-P09: generación de materiales de clase con IA (docente) | 8 | 13-14 | Todo el equipo |
| 6 | Pruebas de integración end-to-end de todos los módulos | 5 | 13-14 | Todo el equipo |
| 6 | Corrección de bugs identificados en etapas anteriores | 5 | 13-14 | Todo el equipo |
| 6 | Optimización de rendimiento — tiempo de respuesta tutor IA (< 3s) | 5 | 13-14 | Todo el equipo |
| 6 | Documentación técnica | 4 | 13-14 | Todo el equipo |
| 6 | Manual de usuario | 3 | 13-14 | Todo el equipo |
| **TOTAL** | **43 tareas** | **245 SP** | **14 semanas** | |

### 3.3. Estimación de esfuerzo

| Sprint | Módulos / Entregables | Story Points | Semanas | Responsable principal |
|---|---|---|---|---|
| 0 | Configuración, arquitectura y backlog | 20 | 1-2 | Todo el equipo |
| 1 | Autenticación, roles, módulo Administrador | 35 | 3-4 | Acevedo / Canello |
| 2 | Gestión de contenido + RAG Pipeline | 40 | 5-6 | Oliver / Rojas |
| 3 | Tutor IA (RAG + LLM + modos de estudio) | 45 | 7-8 | Oliver / Rojas |
| 4 | Actividades y Autocorrection Engine | 40 | 9-10 | Canello / Acevedo |
| 5 | Analytics Engine y dashboards | 35 | 11-12 | Todo el equipo |
| 6 | Asistente docente, QA, deploy final | 30 | 13-14 | Todo el equipo |
| **TOTAL** | | **245 SP** | **14 semanas** | |

> **Nota:** La velocidad real se ajustará tras el primer sprint mediante la técnica de velocidad empírica. El buffer del 15% sobre las estimaciones iniciales contempla imprevistos académicos y de integración con APIs externas (LLM, RAG).

### 3.4. Recursos humanos

El equipo de desarrollo está compuesto por cuatro estudiantes del Técnico Superior en Desarrollo de Software del Instituto de Estudios Superiores de Santa Fe, con dedicación parcial al proyecto en el marco de la Práctica Profesionalizante 2.

| Integrante | Rol Scrum | Responsabilidades técnicas | Disponibilidad estimada |
|---|---|---|---|
| Acevedo Lautaro | Product Owner | Backend (Node.js/Python), gestión de API, integración LLM | 15 hs/semana |
| Canello Manuel | Scrum Master | Backend, base de datos, DevOps y CI/CD | 15 hs/semana |
| Oliver Matias | Dev Team | Frontend (React), diseño UI/UX, testing | 15 hs/semana |
| Rojas Máximo | Dev Team | Frontend/Backend, RAG Pipeline, Analytics Engine | 15 hs/semana |

#### Distribución de Responsabilidades por Módulo

| Módulo / Componente | Acevedo | Canello | Oliver | Rojas |
|---|---|---|---|---|
| Autenticación y gestión de usuarios | Líder | Soporte | UI | |
| Módulo Administrador | Líder | | BD | UI |
| Gestión de contenido y RAG Pipeline | API | BD | UI | Líder |
| AI Tutor Engine (LLM + RAG) | LLM API / Infra | | Chat UI | Líder |
| Auto-correction Engine | Líder | BD | UI | Soporte |
| Analytics Engine y dashboards | Soporte | Líder | UI | Data |
| DevOps / CI-CD / Deploy | Soporte | Líder | Soporte | |

> **Referencias:** Líder = responsable principal, UI = implementación de interfaz, BD = base de datos, API = integración de APIs, Infra = infraestructura, Data = procesamiento de datos.

### 3.5. Ambiente de desarrollo, tecnologías y plataformas

La selección tecnológica se realizó priorizando el conocimiento previo del equipo, la disponibilidad de herramientas gratuitas o de bajo costo para el contexto académico, y la adecuación a los requisitos técnicos del sistema (especialmente la integración con LLMs y el pipeline RAG).

#### Stack de Desarrollo

| Capa | Tecnología / Herramienta | Justificación |
|---|---|---|
| Frontend | React 18 + TypeScript | Ecosistema robusto, tipado estático para reducir errores, amplio conocimiento del equipo. |
| Frontend | Tailwind CSS | Desarrollo de UI rápido y consistente, sin dependencia de frameworks pesados. |
| Frontend | Vite | Bundler ultrarrápido para desarrollo local con HMR. |
| Frontend | React Query | Gestión de estado servidor y caché de peticiones HTTP. |
| Backend | Node.js + Express / FastAPI (Python) | Node.js para API REST principal; FastAPI para microservicio de IA (RAG + LLM) por su rendimiento con I/O asíncrono. |
| Backend | JWT + bcrypt | Autenticación stateless segura con tokens firmados y contraseñas hasheadas. |
| Base de datos | PostgreSQL | BD relacional robusta para datos estructurados (usuarios, materias, notas, asistencia). |
| Base de datos | Prisma ORM | Abstracción de BD con tipado TypeScript, migraciones automáticas y queries seguras. |
| Base de datos | ChromaDB / Pinecone | Base de datos vectorial para almacenar embeddings del material educativo (RAG Pipeline). |
| Inteligencia Artificial | OpenAI API (GPT-4o) / Claude API | LLM base para el AI Tutor Engine y el Auto-correction Engine. Selección final según costo/rendimiento. |
| Inteligencia Artificial | LangChain / LlamaIndex | Framework para implementar el RAG Pipeline: chunking, embedding, recuperación y generación. |
| Inteligencia Artificial | text-embedding-3-small (OpenAI) | Modelo de embeddings para indexar el material educativo en la BD vectorial. |
| Almacenamiento | Cloudflare R2 | Almacenamiento de archivos subidos por docentes (PDF, PPTX, DOCX, imágenes). R2 como alternativa sin costo de egress. |
| DevOps / Infra | GitHub Actions | CI/CD: pipelines de lint, testing y deploy automático en cada push a main. |
| DevOps / Infra | Docker + Docker Compose | Contenerización del backend, frontend y servicios auxiliares para entorno reproducible. |
| DevOps / Infra | Railway / Render | Plataforma de deploy cloud con tier gratuito suficiente para el MVP académico. |

#### Herramientas de Gestión y Colaboración

| Herramienta | Propósito | Uso en el proyecto |
|---|---|---|
| GitHub | Control de versiones | Repositorio central, pull requests, code review y GitHub Projects para backlog. |
| Notion / Confluence | Documentación | Wiki del proyecto, actas de sprint, decisiones de arquitectura (ADRs). |
| Postman | Testing de APIs | Pruebas manuales de endpoints REST durante el desarrollo. |
| Discord / WhatsApp | Comunicación del equipo | Daily stand-ups asincrónicos y coordinación entre miembros. |
| dbdiagram.io | Modelado de BD | Diseño y documentación del modelo de base de datos (ver Anexo C). |

#### Ambientes

| Ambiente | Descripción | Configuración |
|---|---|---|
| Desarrollo | Ambiente local de cada desarrollador | Docker Compose con PostgreSQL, ChromaDB y servicios Node.js/Python en contenedores locales. |
| Staging | Ambiente de integración y QA | Deploy automático desde rama develop. Usado para validación previa al release. |
| Producción | Ambiente final de entrega académica | Deploy desde rama main. Railway/Render para backend, Vercel para frontend, RDS para PostgreSQL. |

> **Nota:** Las API keys de LLM se gestionan exclusivamente mediante variables de entorno (.env) y secretos de GitHub Actions, nunca en el repositorio de código fuente.

---

## 4. Anexo A - Entrevistas/encuestas

Link hacia Encuestas *(pendiente de completar)*

---

## 5. Anexo B - Casos de Uso

### 5.1. Diagramas de Casos de Uso

> Nota: los diagramas originales (Profesor, Alumno, Administrador) son imágenes y no se incluyen en este Markdown. Se resumen en la especificación de abajo.

### 5.2. Especificación de Casos de Uso

**Módulo Alumno:**
- CU-A01: Inscribirse a Materia
- CU-A02: Navegar Contenido de la Materia
- CU-A03: Entregar Actividad
- CU-A04: Consultar Tutor IA
- CU-A05: Solicitar Resumen de Documento al Tutor IA
- CU-A06: Solicitar Pistas en Ejercicios
- CU-A07: Recibir Explicación del Error con Razonamiento
- CU-A08: Generar Simulacro de Examen
- CU-A09: Activar Modo Estudio del Tutor IA
- CU-A10: Consultar Estadísticas Personales
- CU-A11: Solicitar Corrección de Simulacro de Examen

**Módulo Profesor:**
- CU-P01: Crear y Gestionar Secciones de Materia
- CU-P02: Subir Contenido a Materia
- CU-P03: Definir Espacio de Entrega de Actividad
- CU-P04: Configurar Rúbrica de Evaluación
- CU-P05: Gestionar Correcciones Automáticas
- CU-P06: Registrar Notas
- CU-P07: Registrar Asistencia
- CU-P08: Consultar Dashboard de Estadísticas de la Clase
- CU-P09: Consultar Dashboard de Errores y Dudas Frecuentes
- CU-P10: Generar Materiales de Clase con IA

**Módulo Administrador:**
- CU-AD01: Gestionar Materias
- CU-AD02: Asignar Profesores a Materias
- CU-AD03: Gestionar Usuarios
- CU-AD04: Gestionar Claves de Matriculación

**Módulo Sistema:**
- CU-SYS01: Depurar Prompt de Usuario

---

## 6. Anexo C - Diagramas

### 6.1. Mockup y pantallas
Link a la maqueta *(pendiente de completar)*

### 6.2. Modelo de base de datos
El archivo drawio cuenta con dos páginas: en la primera se encuentra el diagrama de modelado de datos, mientras que en la segunda un cuadro referencial que explica las relaciones y su cardinalidad.
Link al modelado de base de datos *(pendiente de completar)*

### 6.3. Diagrama de arquitectura
Link al diagrama *(pendiente de completar)*
