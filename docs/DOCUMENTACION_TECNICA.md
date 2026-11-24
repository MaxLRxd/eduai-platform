# EduAI — Documentación técnica

Campus educativo virtual con un tutor de IA contextualizado por materia (RAG). Este documento describe cómo está construido el sistema, cómo se ejecuta y cómo se verifica.

**Índice**

1. [Visión general](#1-visión-general)
2. [Arquitectura](#2-arquitectura)
3. [Tecnologías](#3-tecnologías)
4. [Cómo ejecutarlo localmente](#4-cómo-ejecutarlo-localmente)
5. [Estructura del repositorio](#5-estructura-del-repositorio)
6. [Modelo de datos](#6-modelo-de-datos)
7. [Backend: módulos y API](#7-backend-módulos-y-api)
8. [Servicio de IA](#8-servicio-de-ia)
9. [Frontend](#9-frontend)
10. [Seguridad](#10-seguridad)
11. [Pruebas y calidad](#11-pruebas-y-calidad)
12. [Rendimiento del tutor](#12-rendimiento-del-tutor)
13. [Variables de entorno](#13-variables-de-entorno)
14. [Desvíos respecto del plan original](#14-desvíos-respecto-del-plan-original)
15. [Limitaciones conocidas](#15-limitaciones-conocidas)

---

## 1. Visión general

EduAI resuelve dos problemas: la carga operativa del docente (corregir, preparar material, seguir a cada alumno) y la falta de un tutor que responda **solo con el material de la cátedra**, sin inventar ni depender de fuentes externas.

Tres actores: **Alumno**, **Docente** y **Administrador**. Las funciones se especifican como casos de uso (CU-A01…A11, CU-P01…P10, CU-AD01…AD04, CU-SYS01); el estado de cada uno está en [`MATRIZ_CASOS_DE_USO.md`](./MATRIZ_CASOS_DE_USO.md).

## 2. Arquitectura

```
                       ┌───────────────────────────────┐
   Navegador ────────► │  Frontend (React + Vite)      │  puerto 5173
                       └───────────────┬───────────────┘
                                       │ HTTPS/JSON + SSE (streaming)
                       ┌───────────────▼───────────────┐
                       │  Backend (Node.js + Express)  │  puerto 3000
                       │  auth · permisos · negocio    │
                       └───┬───────────┬───────────┬───┘
                           │           │           │ X-Internal-Token
                ┌──────────▼───┐  ┌────▼────┐  ┌───▼──────────────────────┐
                │ PostgreSQL   │  │  Redis  │  │ ai-service (FastAPI)     │ puerto 8000
                │ + pgvector   │  │ (caché) │  │ RAG · tutor · corrección │
                └──────────────┘  └─────────┘  └───┬──────────────────────┘
                                                   │
                                          LLM y embeddings (Gemini)
```

Decisiones de diseño:

- **El frontend solo habla con el backend.** El servicio de IA no se expone a internet: el backend lo llama por la red interna con un secreto compartido (`X-Internal-Token`). Así todos los permisos se deciden en un solo lugar.
- **El backend es dueño de los datos.** Usuarios, materias, notas, entregas, historial del tutor y métricas viven en PostgreSQL. El servicio de IA solo guarda los *embeddings* del material.
- **La IA sugiere, el docente decide.** La corrección automática deja un borrador; nada llega al alumno hasta que el docente lo publica.
- **El tutor responde por streaming (SSE)** para que la primera palabra aparezca rápido, sin esperar la respuesta completa.
- **Degradación controlada.** Si el servicio de IA no responde, el resto de la plataforma sigue funcionando y los endpoints de IA devuelven errores claros (502) que el frontend traduce en mensajes para reintentar.

### Flujo RAG (material → respuesta del tutor)

1. El docente sube un archivo o texto. El backend lo guarda y, **en segundo plano**, pide al servicio de IA que lo indexe.
2. El servicio extrae el texto (PDF, DOCX, PPTX, imágenes con OCR), lo divide en fragmentos (*chunks*), calcula un *embedding* de cada uno y lo guarda en el almacén vectorial, etiquetado con la materia.
3. Cuando el alumno pregunta, el servicio **depura** la pregunta (CU-SYS01), calcula su *embedding*, recupera los fragmentos más similares **de esa materia** y arma el prompt con ellos como contexto.
4. Si ningún fragmento supera el umbral de similitud, **responde sin llamar al LLM** que no tiene información en el material.
5. Si hay contexto, el LLM redacta la respuesta citando las fuentes por su título. Las respuestas repetidas se sirven desde Redis.

## 3. Tecnologías

| Capa | Tecnología |
| --- | --- |
| Frontend | React 18, TypeScript, Vite 8, Tailwind CSS, React Query, React Router 7 |
| Backend | Node.js 22, Express 5, TypeScript, Prisma 7, Zod 4, JWT, bcrypt, pdfkit, pino |
| Servicio de IA | Python 3.12, FastAPI, google-genai (Gemini), structlog |
| Datos | PostgreSQL 16 con **pgvector** (también soporta Pinecone), Redis 7 |
| Almacenamiento de archivos | Disco local (por defecto) o Cloudflare R2 (S3) |
| OCR | Tesseract + Poppler (imágenes y PDF escaneados) |
| Infraestructura | Docker + Docker Compose, GitHub Actions (CI) |
| Pruebas | Jest 30 + Supertest, Vitest 5 + Testing Library, pytest, `node:test` (E2E) |

## 4. Cómo ejecutarlo localmente

El proyecto está pensado para correrse en local; no requiere despliegue en la nube.

**Requisitos:** Docker Desktop (o Docker Engine + Compose). Para ejecutar fuera de Docker: Node.js 22 y Python 3.12.

### 4.1 Con Docker (recomendado)

```bash
cp .env.example .env        # completar JWT_SECRET y GEMINI_API_KEY (ver sección 13)
docker compose up --build   # levanta db, redis, backend, ai-service y frontend
```

El contenedor del backend aplica las migraciones al arrancar. Para cargar datos de prueba (con la base levantada):

```bash
npm install
npm run db:seed --workspace backend     # ⚠️ BORRA los datos existentes y carga el set de prueba (sin indexar el material)
npm run demo:reset --workspace backend  # ⚠️ seed + borra huérfanos y reindexa el material en el RAG (base lista para demo; con el ai-service arriba)
```

Direcciones: frontend <http://localhost:5173> · API <http://localhost:3000> · servicio de IA <http://localhost:8000/healthz>.

Usuarios de prueba (contraseña `Clave1234`): `admin@ies.edu`, `profe1@ies.edu`, `alumno1@ies.edu`.

> Sin `GEMINI_API_KEY` la plataforma funciona, pero el tutor, los resúmenes, los simulacros y la corrección con IA devuelven error. Lo que no usa IA (usuarios, materias, entregas, notas, asistencia, dashboards) anda igual.

### 4.2 Sin Docker

```bash
npm install
npm run ai:setup        # crea el entorno virtual de Python e instala dependencias
npm run dev:local       # backend + ai-service + frontend (necesita PostgreSQL y Redis locales)
```

### 4.3 Comandos útiles

| Comando | Qué hace |
| --- | --- |
| `npm test` | Pruebas de backend, ai-service y frontend |
| `npm run e2e` | Suite E2E contra el stack levantado (`E2E_AI=1` incluye el tramo del tutor) |
| `npm run benchmark:tutor` | Mide el tiempo de respuesta del tutor con el LLM real |
| `npm run docs:api` | Regenera [`API_ENDPOINTS.md`](./API_ENDPOINTS.md) desde el código |
| `npm run lint` | ESLint en backend y frontend (en el ai-service: `ruff check src`) |
| `npm run db:migrate` / `db:generate` | Migraciones y cliente de Prisma |

## 5. Estructura del repositorio

```
backend/              API REST (Express + Prisma)
  prisma/             schema.prisma, migraciones y seed
  src/modules/        un directorio por módulo (rutas · controlador · servicio · esquemas)
  src/middlewares/    autenticación, validación, errores, seguridad y limitador de intentos
  src/config/         entorno, Prisma, almacenamiento, cliente del servicio de IA
  src/tests/          pruebas de integración (Jest + Supertest)
ai-services/          servicio de IA (FastAPI)
  src/use_cases/      un caso de uso por función (tutor, resumen, simulacro, corrección…)
  src/services/       LLM, embeddings, recuperación vectorial, caché, OCR, depurador
  src/prompts/        prompts del sistema
frontend/             SPA React
  src/pages/          pantallas por rol (student, teacher, admin)
  src/components/     componentes de interfaz y paneles
  src/services/       clientes de la API · src/hooks/ consultas con React Query
e2e/                  suite E2E y benchmark del tutor
docs/                 esta documentación
docker-compose.yml    entorno local completo
```

## 6. Modelo de datos

34 tablas en PostgreSQL, definidas en `backend/prisma/schema.prisma` y versionadas con migraciones.

| Dominio | Tablas |
| --- | --- |
| Cuentas | `usuarios`, `profesores`, `sesiones` (refresh tokens), `institutions` |
| Materias | `materias`, `materia_profesores`, `claves_matriculacion`, `inscripciones` |
| Contenido | `secciones`, `contenidos`, `accesos_contenido`, `reportes_contenido` |
| Actividades | `rubricas`, `actividades`, `entregas` |
| Tutor IA | `sesiones_ia`, `mensajes_ia`, `preguntas_frecuentes`, `intentos_simulacro` |
| Seguimiento | `notas`, `categorias_nota`, `asistencias`, `analytics_comprension_temas`, `alertas_riesgo_academico`, `errores_dudas_frecuentes` |
| Comunicación | `notificaciones`, `conversaciones`, `conversacion_miembros`, `mensajes_directos`, `mensajes_broadcast`, `planning_clases` |

Reglas relevantes:

- **Integridad:** claves foráneas en todas las relaciones; unicidad de (alumno, materia) en inscripciones, (alumno, actividad) en entregas y (alumno, materia, fecha) en asistencias.
- **Historial conservado:** dar de baja a un usuario o desmatricular a un alumno **no borra** sus notas, entregas ni asistencias.
- **Reportes de archivos (CU-A02 5A):** `reportes_contenido` guarda un reporte por alumno y material; `archivo_disponible` se calcula al listar el contenido (`true`/`false` en disco local, `null` si no se puede comprobar, como con almacenamiento externo). Reportar notifica a los docentes de la materia; resolver notifica a quienes reportaron.
- **Rúbricas con niveles:** `rubricas.niveles` (JSONB, nulo = sin niveles) guarda `[{nombre, puntaje}]`, de mejor a peor, de 2 a 6, el primero en 100; cada criterio puede tener `descriptores` (texto por nivel). El servidor valida que los descriptores apunten a niveles existentes, también al editar solo una de las dos partes.
- **Calificaciones:** cada nota tiene evaluación, categoría (con peso por materia) y, si viene de una actividad, queda ligada a ella. La nota final es el promedio ponderado por categoría (promedio simple si la materia no definió categorías), calculado en un único lugar (`notas.promedio.ts`).
- **Analytics del docente:** cada consulta al tutor se registra por unidad (la de los materiales citados) y período real; el nivel de comprensión queda `NULL` (sin evaluar) hasta que haya una medición, en lugar de un 0 que marcaba todo como crítico. Los endpoints de comprensión y dudas aceptan `?periodo=` y `?seccion_id=` (un id o `general`).
- **Latencia medida:** `mensajes_ia.primer_token_ms` guarda cuánto tardó en verse la primera palabra de cada respuesta.
- **Vectores:** los *embeddings* viven en el almacén vectorial del servicio de IA (tabla propia con índice HNSW en pgvector), no en el esquema de Prisma.

## 7. Backend: módulos y API

La API completa (131 endpoints, con rol requerido y esquema de validación de cada uno) está en [`API_ENDPOINTS.md`](./API_ENDPOINTS.md), generada del código.

| Módulo | Responsabilidad |
| --- | --- |
| `auth` | Registro, login, renovación de sesión, cambio de contraseña y recuperación por correo |
| `materias` | Materias del usuario, inscripción por clave, perfil del alumno para el docente |
| `secciones`, `contenidos` | Unidades, material, registro de accesos y estadísticas |
| `actividades` | Actividades, entregas con plazo, rúbricas, corrección y publicación |
| `correccion` | Corrección sugerida por IA |
| `tutor` | Sesiones, mensajes (normal y streaming), resumen, simulacro, corrección de simulacro, latencia |
| `asistente` | Generación de material docente y exportación a PDF |
| `notas`, `asistencias` | Calificaciones por categoría con peso (nota final ponderada), notas ligadas a actividades, asistencia |
| `analytics`, `dashboard` | Indicadores del docente, del alumno y de la institución |
| `planning`, `messages`, `notificaciones` | Planificación, mensajería y avisos |
| `admin` | Usuarios, materias, asignación de docentes, claves, desmatriculación, reportes |
| `config` | Datos e identidad visual de la institución |

Convenciones:

- Cada módulo separa **rutas → controlador → servicio**; los servicios son los únicos que tocan Prisma.
- Todo cuerpo de petición se valida con **Zod** antes de llegar al controlador.
- Los errores se devuelven como `{ "error": "mensaje" }` con el código HTTP correspondiente; los errores internos nunca exponen detalles al cliente.
- Las operaciones multi-tabla usan transacciones; el cupo de una clave de matriculación se reserva con un `UPDATE` condicional para que dos alumnos no usen el último lugar a la vez.

## 8. Servicio de IA

Casos de uso (`ai-services/src/use_cases`):

| Caso de uso | Función |
| --- | --- |
| `ask_tutor` | Chat del tutor en modo normal, socrático o pistas, con y sin streaming |
| `resumir_documento` | Resumen estructurado, con división en partes para textos largos |
| `examen` | Generación de simulacros a partir del material |
| `corregir_simulacro` | Corrección: opción múltiple determinística; desarrollo con **un único llamado** al LLM para todas las respuestas. Las preguntas **sin respuesta modelo** (respuestas propias del alumno, CU-A11 A2) se corrigen contra el material de la materia recuperado por búsqueda vectorial; si no hay material, se corrige igual y se devuelve `material_limitado` (A4). El estado del material sale de `GET /rag/material/estado/{materia}` (cantidad de fragmentos indexados) |
| `correct_submission` | Pre-corrección de entregas contra una rúbrica. Con **niveles de desempeño** (CU-P04) el modelo elige un nivel por criterio y la nota se calcula en el código: suma de peso × % del nivel (si el modelo omite un criterio o inventa un nivel se usa la nota que haya dado, y si tampoco dio ninguna es un error: no se inventa una calificación) |
| `generar_material` | Material didáctico para el docente |
| `index_material` | Extracción, división en fragmentos, *embeddings* y almacenamiento |
| `depurar_prompt` | CU-SYS01 |

**Depuración de prompts (CU-SYS01).** Antes de llamar al modelo se quitan saludos, cortesías, muletillas, repeticiones y puntuación redundante. Si el mensaje queda vacío o era solo un saludo, se responde **sin consumir tokens**. Si el depurador falla, se usa el prompt original. Se aplica al tutor (todos los modos), al asistente docente y a las respuestas de desarrollo de un simulacro. No se aplica a las entregas de actividades ni a los documentos a resumir, porque alteraría el trabajo que se evalúa.

**Resumen de un archivo propio (CU-A05 A1).** El backend recibe el archivo del alumno (hasta 10 MB; PDF, DOCX, PPTX, TXT, MD, PNG, JPG) en `POST /api/materias/:id/tutor/resumen/archivo`, le pide el texto al ai-service (`POST /tutor/extraer-texto`, que no guarda ni indexa nada) y lo resume. El archivo vive solo en memoria durante la petición. Hasta 60.000 caracteres; si hay más, se resume el comienzo y se avisa.

**Protección.** Todas las rutas exigen el encabezado `X-Internal-Token` cuando `AI_SERVICE_TOKEN` está configurado.

**Resiliencia.** Reintentos con espera creciente ante 429/503 del proveedor, límite de llamadas de *embedding* por minuto y caché en Redis de las respuestas repetidas.

## 9. Frontend

- **Enrutamiento por rol:** un alumno no puede abrir pantallas de docente ni de administrador, ni el backend se lo permitiría aunque lo intentara.
- **Navegación del docente agrupada por áreas:** *Mis materias* → Contenidos (y Planificación); *Mis estudiantes* con pestañas Calificaciones y Asistencia; *Evaluaciones* con Actividades, Correcciones y Calificaciones.
- **Contenidos jerárquicos:** unidad → clases → archivos y evaluaciones; el alumno ve la misma jerarquía.
- **Estado del servidor** con React Query: caché, reintentos e invalidación tras cada cambio.
- **Sesión:** token de acceso de 15 minutos en memoria; renovación automática con una cookie `httpOnly` de 7 días.
- **Tema institucional** (nombre, logo y colores) configurable desde *Apariencia*.
- **Mensajes de error comprensibles:** el cliente traduce los errores de la API en frases para el usuario.

## 10. Seguridad

| Medida | Detalle |
| --- | --- |
| Contraseñas | bcrypt; mínimo 8 caracteres; cambio con verificación de la actual |
| Sesiones | Token de acceso JWT (HS256, 15 min) + refresh token opaco en cookie `httpOnly`, `SameSite=Lax`, `Secure` en producción; se guarda solo su hash |
| Revocación | Cerrar sesión, dar de baja a un usuario o cambiar su contraseña revoca las sesiones correspondientes. Al dar de baja, además, el token de acceso vigente se rechaza al instante (lista de revocados en memoria; ver sección 15) |
| Autorización | Rol verificado en cada ruta y, además, pertenencia a la materia (docente asignado / alumno inscripto) en cada operación |
| Fuerza bruta | Limitador por cuenta e IP que cuenta solo intentos fallidos: un aula entera detrás de la misma IP puede ingresar, pero una cuenta no se puede forzar |
| Validación | Zod en todas las entradas; límite de 1 MB en JSON y 50 MB en archivos |
| Archivos subidos | Nombres con sufijo aleatorio; los tipos ejecutables (`.html`, `.svg`, `.xml`, `.js`) se sirven como descarga y dentro de un *sandbox* (`Content-Security-Policy: sandbox`) para que no puedan correr código con las cookies de la sesión |
| Cabeceras | `nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, HSTS en producción |
| Servicio de IA | No expuesto; solo accesible con el secreto compartido desde el backend |
| Errores | Los 500 devuelven un mensaje genérico; el detalle queda en el log del servidor |
| Privacidad | Un alumno no puede ver los datos de sus compañeros; el docente solo ve a los alumnos de sus materias |
| Dependencias | `npm audit` en 0 vulnerabilidades al 2026-11-23; los overrides necesarios están documentados en la sección 15 |

## 11. Pruebas y calidad

| Nivel | Herramienta | Cantidad | Qué cubre |
| --- | --- | --- | --- |
| Backend | Jest + Supertest | 380 pruebas en 42 suites | Permisos por rol, validaciones, reglas de negocio, transacciones, métricas |
| Servicio de IA | pytest | 164 pruebas (+1 omitida) | Depurador, tutor, corrección, indexado, recuperación, reintentos, OCR |
| Frontend | Vitest + Testing Library | 233 pruebas en 33 archivos | Login, branding, chat del tutor (incluido el aviso de demora y el reintento), servicios, enlaces a materiales, calificaciones, limpieza de sesión |
| **E2E** | `node:test` | **53 pruebas** | Los tres roles encadenados contra el stack real |

La suite E2E (`e2e/flujo-completo.e2e.mjs`) recorre: alta de usuarios y materia, asignación de docente, claves con límite de usos, inscripción, secciones y material, rúbrica y actividades, entrega dentro y fuera de plazo, nombres y fechas inválidos, subida de un archivo malicioso, corrección automática de opción múltiple, corrección y publicación, notas y asistencia, dashboards, permisos cruzados, cambio de contraseña, recuperación de contraseña con el enlace del administrador, conversaciones persistentes del asistente docente, desmatriculación y baja de materia. Con `E2E_AI=1` suma el saludo al tutor, la corrección de un simulacro y la métrica de latencia (sin consumir tokens del LLM). Cada corrida crea sus propios datos, así que se puede repetir sin limpiar la base.

Calidad estática: TypeScript estricto en backend y frontend, ESLint sin advertencias, `ruff` en Python. El pipeline de CI (`.github/workflows/ci.yml`) corre lint, tipos y pruebas de los tres servicios en cada *push* y *pull request* (el backend genera antes el cliente de Prisma con `npx prisma generate`). No ejecuta la suite E2E, que necesita el stack levantado.

## 12. Rendimiento del tutor

**Objetivo (CU-A04):** la primera respuesta visible en menos de 3 segundos.

**Qué se mide.** El tiempo desde que el backend recibe la pregunta hasta que sale el primer fragmento de texto hacia el alumno (`primer_token_ms`), junto con la duración total. Se guarda por cada respuesta del tutor.

**Dónde se ve.**

- Docente: panel *Tiempo de respuesta del tutor* en *Asistente IA* (por materia, últimos 30 días).
- Administrador / API: `GET /api/admin/tutor/latencia` (toda la plataforma) y `GET /api/materias/:id/tutor/latencia`.
- Reporta mediana, percentiles 90 y 95, máximo y el porcentaje de respuestas por debajo de 3 s. **Se considera que cumple si al menos el 90 % llega en menos de 3 s.** Sin datos no afirma nada.

**Cómo medirlo a demanda.** `npm run benchmark:tutor` hace N preguntas reales por streaming y reporta lo que ve el alumno. Requiere material indexado en la materia y una `GEMINI_API_KEY` válida; consume tokens.

**Verificación de la cadena de medición.** Con un servicio de IA simulado que demora 600 ms en emitir la primera palabra, el benchmark midió una mediana de 0,64 s y la métrica guardada por el backend marcó 637 ms: la medición es consistente de punta a punta.

**Medición con el LLM real (2026-11-18).** `npm run benchmark:tutor`, 10 preguntas de Redes por streaming, `gemini-3.5-flash-lite`, clave gratuita, con un apunte de Redes cargado e indexado:

| | Resultado |
| --- | --- |
| Primera respuesta visible, mediana | **6,84 s** |
| Primera respuesta, p95 / máximo | 14,97 s |
| Respuestas en menos de 3 s | 1 de 9 (la única fue una respuesta de 46 caracteres en 0,01 s, demasiado rápida para haber pasado por el modelo; no se investigó su origen) |
| Respuesta completa, mediana | 6,96 s |
| Fallos | 1 de 10: error 503 "high demand" de Gemini, sin respuesta |
| **Veredicto** | **No cumple** el objetivo (90 % en menos de 3 s) |

**De dónde sale la demora.** Se midió cada etapa por separado:

- El *embedding* de la pregunta tarda **0,4–0,6 s**. La búsqueda vectorial y la depuración no se midieron por separado, pero el camino completo dentro del ai-service (6,4–8,1 s hasta el primer fragmento) es prácticamente el del modelo solo: el resto de la aplicación no es el cuello de botella.
- El modelo, llamado **directamente** (sin nada de la plataforma de por medio), tarda entre **0,7 s y 22 s** hasta el primer fragmento para el mismo pedido corto. Con `gemini-3.5-flash-lite` la mediana fue 5,9 s (1 de 6 en menos de 3 s) y con `gemini-3.1-flash-lite`, 4,9 s (3 de 6). Ninguno es estable.
- Conclusión: con una clave gratuita, la latencia depende de la capacidad que Gemini tenga disponible en ese momento (demanda compartida), no del código. Un cambio de modelo no alcanza.

**Qué se puede hacer** (no implementado): usar una clave con plan pago o una cuenta con cuota dedicada; reintentar a mitad del *stream* ante un 503 (hoy solo se reintenta al abrirlo); y mostrar un indicador de espera. Las preguntas frecuentes que carga el docente responden al instante y sin IA, y el alumno ya recibe un aviso con botón *Reintentar* si pasan 10 s sin respuesta.

> **Datos del seed (actualizado 2026-11-20):** el seed trae ahora material de estudio real (3 textos por materia) y `npm run demo:reset` lo indexa de verdad, así que el tutor responde y cita el material sin cargar nada a mano. En la medición original el seed tenía una sola frase por material y figuraba indexado sin estarlo.

## 13. Variables de entorno

`.env.example` documenta todas. Las imprescindibles:

| Variable | Para qué |
| --- | --- |
| `JWT_SECRET` | Firma de tokens (≥ 16 caracteres; en la práctica, 48 bytes aleatorios) |
| `ACCESS_TOKEN_TTL_SECONDS` | Vida del access token (900 por defecto) y TTL de la denylist de cuentas dadas de baja |
| `GEMINI_API_KEY` | Habilita el LLM y los *embeddings* |
| `AI_SERVICE_TOKEN` | Secreto compartido backend ↔ ai-service (obligatorio fuera de desarrollo) |
| `VECTOR_STORE` | `pgvector` (por defecto) o `pinecone` (requiere `PINECONE_API_KEY`) |
| `CORS_ORIGIN` | Origen permitido del frontend |
| `R2_*` | Opcionales: sin ellas los archivos se guardan en `UPLOAD_DIR` |
| `EMAIL_PROVIDER` | `none` (por defecto), `resend`, `brevo` o `smtp`: copia por email de las notificaciones y **correos de recuperación de contraseña** |
| `APP_URL` | URL pública del frontend para los enlaces de los correos (por defecto, el primer `CORS_ORIGIN`) |

Nunca se versionan valores reales: `.env` está en `.gitignore`. Con Gmail SMTP, `EMAIL_FROM` debe coincidir
con `EMAIL_SMTP_USER` (o ser un alias verificado) y `EMAIL_SMTP_PASS` es una contraseña de aplicación.

## 14. Desvíos respecto del plan original

El plan de proyecto (Anexo, sección 3.5) planteaba algunas tecnologías que, al implementar, se reemplazaron:

| Plan original | Implementación | Motivo |
| --- | --- | --- |
| OpenAI GPT-4o / Claude API | **Google Gemini** (modelo configurable) | Cuota gratuita compatible con un proyecto académico |
| `text-embedding-3-small` (OpenAI) | `gemini-embedding-2` (1536 dimensiones) | Mismo proveedor que el LLM |
| ChromaDB / Pinecone | **pgvector** en la propia PostgreSQL (Pinecone queda como alternativa) | Una pieza menos que operar; índice HNSW |
| LangChain / LlamaIndex | Pipeline propio (extracción → *chunks* → *embeddings* → recuperación) | Menos dependencias y control total del flujo |
| Despliegue en Railway/Render/Vercel | **Ejecución local con Docker Compose** | Acordado con la cátedra: alcanza con correrlo en local |
| Cloudflare R2 | Opcional; por defecto disco local | Simplifica la ejecución local |

## 15. Limitaciones conocidas

Esta sección resume las limitaciones para quien lee la documentación. **Los pendientes y su estado están solo en [`PLAN_DE_ACCION.md`](../PLAN_DE_ACCION.md).**

- **Dependencias actualizadas 2026-11-23:** `zod` 4, `react-router-dom` 7, `vitest` 5, `vite` 8 y `@vitejs/plugin-react` 6; `npm audit` queda en 0. Se usan `overrides` para `effect` 3.22.5 y `glob` 14.0.6 porque `@prisma/config` y Jest 30 fijan versiones con avisos. `npm ls` puede marcarlos como `invalid` al no cumplir el rango exacto, pero `npm ci`, Prisma, lint, typechecks, builds y las suites pasan.
- **La latencia del tutor no cumple el objetivo** de la primera respuesta en menos de 3 s: se midió con la IA real (mediana de 6,84 s) y depende de la capacidad de Gemini con clave gratuita (ver sección 12).
- **Revocación del acceso al dar de baja a un usuario:** el token de acceso se rechaza al instante con una lista de revocados (`backend/src/config/cache.ts`) cuya duración es la del propio token (15 minutos). Esa lista vive en la memoria del backend: **se pierde si el backend se reinicia** (el token volvería a servir hasta que venza) y no se comparte entre réplicas. Con una sola instancia, como en esta entrega, alcanza.
- **Los archivos subidos se sirven por URL no adivinable** (sufijo aleatorio de 128 bits) pero sin control de sesión. Las URLs firmadas y temporales se evaluaron y se **pospusieron** (cambian todos los enlaces a archivos y vencen; riesgo para la demo): se retoman si se pasa a un bucket privado. El cliente de R2 está cubierto por una prueba de integración escrita que se salta sin credenciales (`backend/src/tests/storage-r2.integration.test.ts`); falta correrla una vez con un bucket de pruebas.
- **Contraseña temporal:** el aviso de alta no incluye la contraseña (no se guarda ni se envía en claro); el administrador se la entrega al usuario por otro medio.
- **Recuperación de contraseña por correo.** `POST /api/auth/password/olvide` y `POST /api/auth/password/restablecer`; pantallas `/recuperar` y `/restablecer`. El enlace lleva un token aleatorio de 256 bits del que en la base solo se guarda el hash; vence a los 60 minutos (`RESET_TOKEN_MINUTES`), sirve una sola vez, y pedir otro invalida el anterior. La respuesta del pedido es idéntica exista o no la cuenta (no permite averiguar quién tiene cuenta). Al restablecer se cierran **todas** las sesiones de la cuenta y se avisa por correo. Límites: 3 pedidos por cuenta y 20 por IP cada 15 minutos. Requiere `EMAIL_PROVIDER` configurado y `APP_URL` (URL pública del frontend); sin correo, en desarrollo el enlace se escribe en el log del backend y en producción se registra un error. Si un usuario no tiene acceso a su correo, el administrador puede usar **Usuarios → Recuperar** (`POST /api/admin/users/:usuarioId/recuperacion-token`): genera el mismo enlace de un solo uso, no envía correo y lo muestra una sola vez con `Cache-Control: no-store`; el token viaja en claro solo en esa respuesta y en la base solo queda su hash. **Salvedad:** un administrador puede emitir un enlace para cualquier cuenta (incluida otra de administrador) y quedarse con ella; hoy no se registra quién lo emite ni se avisa al usuario.
- **Visibilidad de entregas por archivo:** la IA corrige el texto o código de una entrega; de un archivo adjunto solo registra el nombre.

---

## Verificación realizada

**2026-11-18:** con el stack de desarrollo levantado se aplicó la migración de calificaciones sobre una base con datos, se recorrieron en el navegador las pantallas de Entregas, Mis estadísticas y Calificaciones, y la suite E2E pasó 39 de 39 (sin el tramo del tutor).

La última verificación se hizo construyendo las **tres imágenes de producción** (backend, frontend con nginx y servicio de IA) y ejecutando la suite E2E completa, con el tramo del tutor, contra esos contenedores: **42 de 42 pruebas correctas**. Esa verificación detectó y permitió corregir defectos que no se ven en desarrollo (generación del cliente de Prisma, configuración de migraciones, ejecutable de `uvicorn`, y un acceso directo al servicio de IA expuesto por nginx).
