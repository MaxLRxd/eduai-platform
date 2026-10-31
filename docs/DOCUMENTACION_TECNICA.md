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
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, React Query, React Router |
| Backend | Node.js 22, Express 5, TypeScript, Prisma 7, Zod, JWT, bcrypt, pdfkit, pino |
| Servicio de IA | Python 3.12, FastAPI, google-genai (Gemini), structlog |
| Datos | PostgreSQL 16 con **pgvector** (también soporta Pinecone), Redis 7 |
| Almacenamiento de archivos | Disco local (por defecto) o Cloudflare R2 (S3) |
| OCR | Tesseract + Poppler (imágenes y PDF escaneados) |
| Infraestructura | Docker + Docker Compose, GitHub Actions (CI) |
| Pruebas | Jest + Supertest, Vitest + Testing Library, pytest, `node:test` (E2E) |

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
npm run db:seed --workspace backend     # ⚠️ BORRA los datos existentes y carga el set de prueba
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

29 tablas en PostgreSQL, definidas en `backend/prisma/schema.prisma` y versionadas con migraciones.

| Dominio | Tablas |
| --- | --- |
| Cuentas | `usuarios`, `profesores`, `sesiones` (refresh tokens), `institutions` |
| Materias | `materias`, `materia_profesores`, `claves_matriculacion`, `inscripciones` |
| Contenido | `secciones`, `contenidos`, `accesos_contenido` |
| Actividades | `rubricas`, `actividades`, `entregas` |
| Tutor IA | `sesiones_ia`, `mensajes_ia`, `preguntas_frecuentes`, `intentos_simulacro` |
| Seguimiento | `notas`, `asistencias`, `analytics_comprension_temas`, `alertas_riesgo_academico`, `errores_dudas_frecuentes` |
| Comunicación | `notificaciones`, `conversaciones`, `conversacion_miembros`, `mensajes_directos`, `mensajes_broadcast`, `planning_clases` |

Reglas relevantes:

- **Integridad:** claves foráneas en todas las relaciones; unicidad de (alumno, materia) en inscripciones, (alumno, actividad) en entregas y (alumno, materia, fecha) en asistencias.
- **Historial conservado:** dar de baja a un usuario o desmatricular a un alumno **no borra** sus notas, entregas ni asistencias.
- **Latencia medida:** `mensajes_ia.primer_token_ms` guarda cuánto tardó en verse la primera palabra de cada respuesta.
- **Vectores:** los *embeddings* viven en el almacén vectorial del servicio de IA (tabla propia con índice HNSW en pgvector), no en el esquema de Prisma.

## 7. Backend: módulos y API

La API completa (110 endpoints, con rol requerido y esquema de validación de cada uno) está en [`API_ENDPOINTS.md`](./API_ENDPOINTS.md), generada del código.

| Módulo | Responsabilidad |
| --- | --- |
| `auth` | Registro, login, renovación de sesión, cambio de contraseña |
| `materias` | Materias del usuario, inscripción por clave, perfil del alumno para el docente |
| `secciones`, `contenidos` | Unidades, material, registro de accesos y estadísticas |
| `actividades` | Actividades, entregas con plazo, rúbricas, corrección y publicación |
| `correccion` | Corrección sugerida por IA |
| `tutor` | Sesiones, mensajes (normal y streaming), resumen, simulacro, corrección de simulacro, latencia |
| `asistente` | Generación de material docente y exportación a PDF |
| `notas`, `asistencias` | Registro y consulta |
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
| `corregir_simulacro` | Corrección: opción múltiple determinística; desarrollo con **un único llamado** al LLM para todas las respuestas |
| `correct_submission` | Pre-corrección de entregas contra una rúbrica |
| `generar_material` | Material didáctico para el docente |
| `index_material` | Extracción, división en fragmentos, *embeddings* y almacenamiento |
| `depurar_prompt` | CU-SYS01 |

**Depuración de prompts (CU-SYS01).** Antes de llamar al modelo se quitan saludos, cortesías, muletillas, repeticiones y puntuación redundante. Si el mensaje queda vacío o era solo un saludo, se responde **sin consumir tokens**. Si el depurador falla, se usa el prompt original. Se aplica al tutor (todos los modos), al asistente docente y a las respuestas de desarrollo de un simulacro. No se aplica a las entregas de actividades ni a los documentos a resumir, porque alteraría el trabajo que se evalúa.

**Protección.** Todas las rutas exigen el encabezado `X-Internal-Token` cuando `AI_SERVICE_TOKEN` está configurado.

**Resiliencia.** Reintentos con espera creciente ante 429/503 del proveedor, límite de llamadas de *embedding* por minuto y caché en Redis de las respuestas repetidas.

## 9. Frontend

- **Enrutamiento por rol:** un alumno no puede abrir pantallas de docente ni de administrador, ni el backend se lo permitiría aunque lo intentara.
- **Estado del servidor** con React Query: caché, reintentos e invalidación tras cada cambio.
- **Sesión:** token de acceso de 15 minutos en memoria; renovación automática con una cookie `httpOnly` de 7 días.
- **Tema institucional** (nombre, logo y colores) configurable desde *Apariencia*.
- **Mensajes de error comprensibles:** el cliente traduce los errores de la API en frases para el usuario.

## 10. Seguridad

| Medida | Detalle |
| --- | --- |
| Contraseñas | bcrypt; mínimo 8 caracteres; cambio con verificación de la actual |
| Sesiones | Token de acceso JWT (HS256, 15 min) + refresh token opaco en cookie `httpOnly`, `SameSite=Lax`, `Secure` en producción; se guarda solo su hash |
| Revocación | Cerrar sesión, dar de baja a un usuario o cambiar su contraseña revoca las sesiones correspondientes |
| Autorización | Rol verificado en cada ruta y, además, pertenencia a la materia (docente asignado / alumno inscripto) en cada operación |
| Fuerza bruta | Limitador por cuenta e IP que cuenta solo intentos fallidos: un aula entera detrás de la misma IP puede ingresar, pero una cuenta no se puede forzar |
| Validación | Zod en todas las entradas; límite de 1 MB en JSON y 50 MB en archivos |
| Archivos subidos | Nombres con sufijo aleatorio; los tipos ejecutables (`.html`, `.svg`, `.xml`, `.js`) se sirven como descarga y dentro de un *sandbox* (`Content-Security-Policy: sandbox`) para que no puedan correr código con las cookies de la sesión |
| Cabeceras | `nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, HSTS en producción |
| Servicio de IA | No expuesto; solo accesible con el secreto compartido desde el backend |
| Errores | Los 500 devuelven un mensaje genérico; el detalle queda en el log del servidor |
| Privacidad | Un alumno no puede ver los datos de sus compañeros; el docente solo ve a los alumnos de sus materias |
| Dependencias | Vulnerabilidades altas y críticas de producción resueltas; quedan documentadas las que requieren un salto de versión mayor (sección 15) |

## 11. Pruebas y calidad

| Nivel | Herramienta | Cantidad | Qué cubre |
| --- | --- | --- | --- |
| Backend | Jest + Supertest | 201 pruebas en 27 suites | Permisos por rol, validaciones, reglas de negocio, transacciones, métricas |
| Servicio de IA | pytest | 107 pruebas | Depurador, tutor, corrección, indexado, recuperación, reintentos, OCR |
| Frontend | Vitest + Testing Library | 25 pruebas | Login, branding, chat del tutor (incluido el aviso de demora y el reintento), servicios |
| **E2E** | `node:test` | **42 pruebas** | Los tres roles encadenados contra el stack real |

La suite E2E (`e2e/flujo-completo.e2e.mjs`) recorre: alta de usuarios y materia, asignación de docente, claves con límite de usos, inscripción, secciones y material, rúbrica y actividades, entrega dentro y fuera de plazo, nombres y fechas inválidos, subida de un archivo malicioso, corrección automática de opción múltiple, corrección y publicación, notas y asistencia, dashboards, permisos cruzados, cambio de contraseña, desmatriculación y baja de materia. Con `E2E_AI=1` suma el saludo al tutor, la corrección de un simulacro y la métrica de latencia (sin consumir tokens del LLM). Cada corrida crea sus propios datos, así que se puede repetir sin limpiar la base.

Calidad estática: TypeScript estricto en backend y frontend, ESLint sin advertencias, `ruff` en Python. El pipeline de CI (`.github/workflows/ci.yml`) corre lint, tipos y pruebas de los tres servicios en cada *push* y *pull request*.

## 12. Rendimiento del tutor

**Objetivo (CU-A04):** la primera respuesta visible en menos de 3 segundos.

**Qué se mide.** El tiempo desde que el backend recibe la pregunta hasta que sale el primer fragmento de texto hacia el alumno (`primer_token_ms`), junto con la duración total. Se guarda por cada respuesta del tutor.

**Dónde se ve.**

- Docente: panel *Tiempo de respuesta del tutor* en *Asistente IA* (por materia, últimos 30 días).
- Administrador / API: `GET /api/admin/tutor/latencia` (toda la plataforma) y `GET /api/materias/:id/tutor/latencia`.
- Reporta mediana, percentiles 90 y 95, máximo y el porcentaje de respuestas por debajo de 3 s. **Se considera que cumple si al menos el 90 % llega en menos de 3 s.** Sin datos no afirma nada.

**Cómo medirlo a demanda.** `npm run benchmark:tutor` hace N preguntas reales por streaming y reporta lo que ve el alumno. Requiere material indexado en la materia y una `GEMINI_API_KEY` válida; consume tokens.

**Verificación de la cadena de medición.** Con un servicio de IA simulado que demora 600 ms en emitir la primera palabra, el benchmark midió una mediana de 0,64 s y la métrica guardada por el backend marcó 637 ms: la medición es consistente de punta a punta.

> **Pendiente de medir con el LLM real:** en el entorno de desarrollo no hay `GEMINI_API_KEY` configurada, por lo que el tiempo real del modelo no pudo medirse. Ejecutar `npm run benchmark:tutor` con las claves y material cargado y registrar el resultado antes de la presentación. La métrica incluye las respuestas inmediatas (saludos) y las servidas desde caché, que son más rápidas que una consulta nueva.

## 13. Variables de entorno

`.env.example` documenta todas. Las imprescindibles:

| Variable | Para qué |
| --- | --- |
| `JWT_SECRET` | Firma de tokens (≥ 16 caracteres; en la práctica, 48 bytes aleatorios) |
| `GEMINI_API_KEY` | Habilita el LLM y los *embeddings* |
| `AI_SERVICE_TOKEN` | Secreto compartido backend ↔ ai-service (obligatorio fuera de desarrollo) |
| `VECTOR_STORE` | `pgvector` (por defecto) o `pinecone` (requiere `PINECONE_API_KEY`) |
| `CORS_ORIGIN` | Origen permitido del frontend |
| `R2_*` | Opcionales: sin ellas los archivos se guardan en `UPLOAD_DIR` |
| `EMAIL_PROVIDER` | `none` (por defecto), `resend`, `brevo` o `smtp`: copia por email de las notificaciones |

Nunca se versionan valores reales: `.env` está en `.gitignore`.

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

- **Dependencias con salto de versión mayor pendiente:** `zod` 3 → 4 (riesgo de agotar memoria con colecciones enormes; mitigado por el límite de 1 MB del cuerpo) y `react-router` 6 → 7 (afecta redirecciones y renderizado en servidor, que no se usa). Las herramientas de prueba (`vitest`) tienen una advertencia crítica que solo aplica a desarrollo.
- **Tiempos del LLM real sin medir** en el entorno de desarrollo (ver sección 12).
- **Los tokens de acceso no se invalidan al instante** al dar de baja a un usuario: siguen válidos hasta 15 minutos; la renovación sí queda bloqueada.
- **Los archivos subidos se sirven por URL no adivinable** (sufijo aleatorio de 128 bits) pero sin control de sesión; en producción real conviene un bucket privado con URLs firmadas.
- **Contraseña temporal:** el aviso de alta no incluye la contraseña (no se guarda ni se envía en claro); el administrador se la entrega al usuario por otro medio.
- **Sin recuperación de contraseña por email.** El administrador asigna una temporal.
- **Visibilidad de entregas por archivo:** la IA corrige el texto o código de una entrega; de un archivo adjunto solo registra el nombre.

---

## Verificación realizada

La última verificación se hizo construyendo las **tres imágenes de producción** (backend, frontend con nginx y servicio de IA) y ejecutando la suite E2E completa, con el tramo del tutor, contra esos contenedores: **42 de 42 pruebas correctas**. Esa verificación detectó y permitió corregir defectos que no se ven en desarrollo (generación del cliente de Prisma, configuración de migraciones, ejecutable de `uvicorn`, y un acceso directo al servicio de IA expuesto por nginx).
