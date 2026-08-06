# EduAI · Documento de Implementación

**Versión:** 1.1 (corregida)  
**Alcance de esta versión:** incorpora los ajustes de cobertura detectados en la revisión del plan — OCR para imágenes (JPG/PNG), depuración de prompts (CU-SYS01), documentos propios del alumno (CU-A05), notificaciones, email de recuperación, streaming SSE, testing y logging/monitoreo.

---

## Tabla de contenidos

1. [Archivos de configuración del entorno](#1-archivos-de-configuración-del-entorno)
2. [Archivos de Docker](#2-archivos-de-docker)
3. [Archivos de CI/CD](#3-archivos-de-cicd)
4. [Testing, logging y monitoreo](#4-testing-logging-y-monitoreo)
5. [Cacheo con Redis](#5-cacheo-con-redis)
6. [Archivos de configuración de herramientas](#6-archivos-de-configuración-de-herramientas)
7. [Cómo se relacionan entre sí](#7-cómo-se-relacionan-entre-sí)
8. [Backend — Node.js / Express](#8-backend--nodejs--express)
9. [AI Service — Python / FastAPI](#9-ai-service--python--fastapi)
10. [Frontend — React / TypeScript](#10-frontend--react--typescript)
11. [La relación entre todo](#11-la-relación-entre-todo)
12. [Orden de implementación recomendado](#12-orden-de-implementación-recomendado)
13. [Estructura de carpetas del proyecto](#13-estructura-de-carpetas-del-proyecto)

---

## 1. Archivos de configuración del entorno

| Archivo | Propósito | Va al repo |
|---|---|---|
| `.env.example` | Plantilla con nombres de variables (valores vacíos o de ejemplo) | ✅ Sí |
| `.env` | Valores reales de cada desarrollador | ❌ No |
| `.gitignore` | Excluye `.env`, `node_modules/`, builds y datos locales de Docker | ✅ Sí |

**`.env.example`** es la fuente única de verdad de qué variables existen. Los archivos equivalentes en `backend/`, `ai-service/` y `frontend/` solo repiten las variables propias de cada servicio y se mantienen sincronizados desde la raíz.

Variables mínimas requeridas:

```
DATABASE_URL
REDIS_URL
OPENAI_API_KEY
R2_ACCESS_KEY_ID
JWT_SECRET
EMAIL_API_KEY   # SendGrid o Resend
```

> **Regla de oro:** el código nunca tiene un valor hardcodeado — ni una API key, ni una URL, ni una contraseña. Todo viene del entorno.

---

## 2. Archivos de Docker

### `docker-compose.yml`

Archivo central del entorno de desarrollo. Define y conecta todos los servicios:

- **backend** (Node.js / Express)
- **ai-service** (Python / FastAPI)
- **frontend** (React)
- **PostgreSQL** con extensión `pgvector` habilitada
- **Redis** — cacheo de consultas y respuestas del tutor IA
- **ChromaDB** — base vectorial (alternativa a pgvector)

Con un solo comando se levanta todo el sistema. PostgreSQL incluye `pgvector`, por lo que la base vectorial puede vivir dentro del propio Postgres si el equipo elige esa opción en lugar de ChromaDB.

### `docker-compose.staging.yml`

Variante pensada para el ambiente de staging: sin hot reload, imágenes compiladas, configuraciones de red más restrictivas. **Para el MVP académico este archivo es opcional** y puede posponerse hasta contar con un ambiente de staging real.

### `Dockerfile` (por servicio)

Cada servicio (`backend`, `ai-service`, `frontend`) tiene su propio `Dockerfile`. El formato recomendado es **multi-stage**: el mismo archivo sirve tanto para desarrollo (debug + hot reload) como para producción (imagen mínima y optimizada).

### `nginx.conf`

Configuración del servidor web Nginx para producción. Gestiona:

- Servido de archivos estáticos del frontend compilado
- Redirección de todas las rutas al `index.html` (soporte SPA de React)
- Headers de seguridad

---

## 3. Archivos de CI/CD

**Ubicación:** `.github/workflows/`

Archivos recomendados:

| Archivo | Cuándo se ejecuta | Qué hace |
|---|---|---|
| `ci.yml` | En cada Pull Request | Instala dependencias, corre tests y linters |
| `deploy.yml` | Al mergear a `develop` o `main` | Construye imágenes y hace el deploy |

### Herramientas de testing por servicio

| Servicio | Framework de tests | Linter / tipos |
|---|---|---|
| Backend | Jest + Supertest | ESLint + TypeScript |
| Frontend | Vitest + React Testing Library | ESLint + TypeScript |
| AI Service | Pytest | ruff |

### Secretos de CI

Las credenciales necesarias para los pipelines (tokens de Railway, API keys) se configuran en **GitHub Secrets**. Los workflows los leen como variables de entorno; nunca aparecen en el código.

---

## 4. Testing, logging y monitoreo

### Logging

Cada servicio loguea en **formato estructurado (JSON)** hacia `stdout` para que Docker y Railway lo capturen:

- **Backend:** `pino` + `morgan`
- **AI Service:** `structlog`

> **Regla:** nunca se loguean secretos ni datos sensibles de alumnos.

### Monitoreo

Backend y AI Service exponen un endpoint de salud para los healthchecks:

```
GET /healthz
```

La telemetría profunda (Sentry, métricas de terceros) queda fuera del alcance del MVP académico.

---

## 5. Cacheo con Redis

**Objetivo:** cachear las consultas y respuestas más frecuentes del tutor IA. Si un alumno hace la misma pregunta sobre el mismo material, la respuesta se sirve desde caché sin llamar al LLM, reduciendo costo por token y latencia.

| Entorno | Instancia de Redis |
|---|---|
| Desarrollo | Servicio en `docker-compose.yml` |
| Producción | Redis administrado de Railway o plan gratuito de Redis Cloud |

Las claves se escriben con **TTL** para no saturar la memoria. `backend`, `ai-service` y `frontend` lo consumen vía la variable `REDIS_URL`.

---

## 6. Archivos de configuración de herramientas

Estos archivos van al repositorio porque definen el comportamiento del proyecto, no credenciales.

| Archivo | Servicio | Propósito |
|---|---|---|
| `package.json` (raíz) | Monorepo | Scripts de conveniencia: `dev`, `db:migrate`, `logs` |
| `tsconfig.json` | Backend / Frontend | Configura el compilador de TypeScript |
| `vite.config.ts` | Frontend | Proxy al backend en dev, aliases de rutas, optimizaciones de build |
| `prisma/schema.prisma` | Backend | Define la estructura de la BD; las migraciones también van al repo |
| `requirements.txt` | AI Service | Dependencias de Python para producción |
| `requirements-dev.txt` | AI Service | Herramientas adicionales de testing y desarrollo |

---

## 7. Cómo se relacionan entre sí

```
.env.example  →  cada dev copia como .env y completa
     ↓
Docker Compose lee .env e inyecta variables a cada contenedor
     ↓
Servicios arrancan y fallan explícitamente si falta alguna variable
     ↓
En CI/CD → GitHub Secrets reemplaza al .env
En producción → Railway Panel reemplaza al .env
```

---

## 8. Backend — Node.js / Express

La arquitectura separa responsabilidades en capas. Cada capa tiene un trabajo específico y no se mete en el del otro.

### Capa de rutas (`routes/`)

Definen los endpoints de la API. No tienen lógica de negocio: reciben la petición HTTP, llaman al controlador y devuelven la respuesta.

Archivos por dominio:

```
auth.routes.ts          subjects.routes.ts      materials.routes.ts
activities.routes.ts    submissions.routes.ts   chat.routes.ts
users.routes.ts         grades.routes.ts        notifications.routes.ts
uploads.routes.ts
```

### Capa de controladores (`controllers/`)

Reciben la petición ya parseada, validan los datos de entrada, llaman al servicio correspondiente y formatean la respuesta. Un controlador por dominio, espejando los archivos de rutas.

### Capa de servicios (`services/`)

Contiene toda la lógica de negocio. Los servicios no saben nada de HTTP; solo reciben datos y devuelven resultados.

| Servicio | Responsabilidad |
|---|---|
| `material.service.ts` | Sube el archivo a R2, crea el registro en BD, llama al AI Service para indexarlo |
| `notifications.service.ts` | Crea y entrega notificaciones in-app (nueva entrega, feedback, alertas de riesgo) |
| `email.service.ts` | Genera y envía correos de recuperación de contraseña vía SendGrid o Resend |
| `uploads.service.ts` | Gestiona documentos propios del alumno (CU-A05): guarda en R2 y llama al AI Service para resumirlos |
| `cache.service.ts` | Encapsula el cliente de Redis (clave/valor con TTL) |

### Middlewares (`middlewares/`)

Se ejecutan antes de llegar al controlador:

- **Autenticación:** verifica el JWT y adjunta el usuario a la petición
- **Autorización:** verifica que el rol del usuario tenga permiso para la acción
- **Manejo de errores global**
- **Validación de esquemas de entrada**

### Configuración (`config/`)

Inicializan las conexiones externas: Prisma (base de datos), cliente de R2, cliente de email, variables de entorno con validación.

### Tipos (`types/`)

Define los tipos compartidos de TypeScript: payload del JWT, extensiones del objeto `Request` de Express para agregar el usuario autenticado, etc.

---

## 9. AI Service — Python / FastAPI

Microservicio con responsabilidad única: todo lo que toque a IA. El backend de Node.js lo llama por HTTP y no necesita saber cómo funciona por dentro.

### Routers (`routers/`)

| Router | Endpoints principales |
|---|---|
| `tutor.router.py` | Chat con el tutor; incluye `/chat/stream` (SSE) para respuestas en tiempo real |
| `rag.router.py` | Indexación de materiales |
| `correction.router.py` | Corrección automática de entregas |

### Servicios de IA (`services/`)

| Servicio | Responsabilidad |
|---|---|
| `embeddings_service.py` | Convierte texto en vectores usando la API de OpenAI |
| `retrieval_service.py` | Busca en ChromaDB o pgvector |
| `cache_service.py` | Cachea embeddings y respuestas frecuentes en Redis |
| `llm_service.py` | Arma el prompt y llama al LLM, incluyendo modo streaming |
| `document_service.py` | Extrae texto de PDF, DOCX, PPTX y TXT |
| `ocr_service.py` | Extrae texto de imágenes JPG/PNG con Tesseract o visión del LLM (CU-P02) |
| `prompt_sanitizer.py` | Depuración de prompts (CU-SYS01): elimina saludos, muletillas y contenido irrelevante; mide tokens ahorrados |
| `chunking_service.py` | Divide texto en fragmentos del tamaño correcto |

### Casos de uso (`use_cases/`)

Coordinan los servicios para resolver un problema completo:

| Caso de uso | Flujo |
|---|---|
| `index_material.py` | Extraer texto → chunkear → generar embeddings → guardar en ChromaDB/pgvector |
| `ask_tutor.py` | Verificar caché Redis → embedding de la pregunta → buscar en ChromaDB/pgvector → construir prompt → llamar al LLM → guardar en caché |
| `depurar_prompt.py` (CU-SYS01) | Depura el prompt y registra `prompt_depurado` en `mensajes_ia` |
| `resumir_documento.py` (CU-A05) | Toma un documento del alumno y genera el resumen estructurado |
| `correct_submission.py` | Tomar entrega y rúbrica → construir prompt → llamar al LLM → parsear respuesta como JSON estructurado |

### Schemas (`schemas/`)

Modelos Pydantic que definen la forma de los datos de entrada y salida de cada endpoint. Son los **contratos** entre el backend de Node.js y este servicio.

### Prompts (`prompts/`)

Textos de los system prompts del LLM, separados del código porque cambian con frecuencia durante el desarrollo:

- Modo tutor normal
- Modo socrático
- Modo pistas
- Corrección con rúbrica

---

## 10. Frontend — React / TypeScript

### Páginas (`pages/`)

Cada página es una ruta de la aplicación. Son componentes "contenedor" sin lógica compleja; solo componen otros componentes:

- Login
- Dashboard del alumno
- Vista de una materia
- Chat con el tutor
- Entrega de actividades
- Dashboard del docente
- Panel de administrador

### Componentes (`components/`)

Bloques reutilizables de UI, organizados por dominio:

```
chat/           materials/      activities/     dashboard/
ui/             # elementos genéricos: botones, modales, inputs, tarjetas, tablas
```

### Hooks (`hooks/`)

Encapsulan lógica reutilizable:

| Hook | Responsabilidad |
|---|---|
| `useAuth.ts` | Acceso al usuario autenticado en cualquier componente |
| `useChat.ts` | Estado de la conversación; consume el endpoint SSE `/chat/stream` |
| `useSubject.ts` | Carga los datos de una materia |
| `useNotifications.ts` | Consume las notificaciones in-app del backend |

### Servicios de API (`services/`)

Únicas funciones que hacen llamadas HTTP al backend. Un archivo por dominio:

```
auth.service.ts     materials.service.ts    uploads.service.ts
notifications.service.ts    ...
```

El resto de la aplicación no conoce la URL de ningún endpoint.

### Contextos (`contexts/`)

Estado global compartido entre muchos componentes. El más importante es `AuthContext`, que guarda el usuario logueado y expone las funciones de `login` y `logout`.

### Rutas y guards (`router/`)

Configuración de React Router. Incluye `ProtectedRoute`, que verifica si el usuario está autenticado y si tiene el rol correcto antes de renderizar una página.

---

## 11. La relación entre todo

```
Frontend (React)
    │  solo habla con el backend de Node.js
    ▼
Backend (Node.js / Express)
    ├── PostgreSQL vía Prisma
    ├── R2 (almacenamiento de archivos)
    └── AI Service (HTTP)
            ├── ChromaDB / pgvector
            └── API de OpenAI
```

Cada capa solo se comunica con la capa adyacente. Esto permite, por ejemplo:

- Cambiar ChromaDB por Pinecone → solo se toca `retrieval_service.py`
- Cambiar OpenAI por Claude → solo se toca `llm_service.py`

Las capas superiores no se enteran del cambio.

---

## 12. Orden de implementación recomendado

Lo primero no es código ni Docker. Es **acordar la estructura del proyecto y dejarlo funcionando en la máquina de todos**.

### Paso 1 — Repositorio y estructura de carpetas

Crear el repo en GitHub, definir la estrategia de ramas (`main`, `develop`, `feature/*`) y crear las carpetas vacías con sus archivos base. En este punto no hay lógica, solo la estructura acordada.

### Paso 2 — `.env.example` y `.gitignore`

Antes de escribir una línea de código, definir qué variables de entorno necesitará el sistema. Esto obliga al equipo a identificar todos los servicios externos desde el principio.

### Paso 3 — `docker-compose.yml`

Reemplaza el clásico "en mi máquina funciona". Una vez configurado, cualquier integrante puede clonar el repo, copiar `.env.example`, completar las variables y tener todo el sistema corriendo con **un solo comando** — incluyendo PostgreSQL con pgvector, Redis y ChromaDB listos, sin instalar nada manualmente.

### Paso 4 — Dockerfiles de cada servicio

Van de la mano con el paso anterior. Se configuran primero para desarrollo (con hot reload); la versión de producción se pule después.

### Paso 5 — Schema de Prisma y primera migración

Con la base de datos corriendo en Docker, se define el modelo de datos y se corre la primera migración. Es prioritario porque casi todo el equipo depende de conocer la estructura de los datos.

### Paso 6 — Código de la aplicación

Recién en este punto comienza el desarrollo de lógica de negocio.

---

## 13. Estructura de carpetas del proyecto

```
eduai/
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
│
├── backend/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── types/
│   │   ├── tests/
│   │   └── index.ts
│   ├── .env.example
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
│
├── ai-service/
│   ├── src/
│   │   ├── config/
│   │   ├── prompts/
│   │   ├── routers/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── tests/
│   │   ├── use_cases/
│   │   └── main.py
│   ├── .env.example
│   ├── Dockerfile
│   ├── requirements.txt
│   └── requirements-dev.txt
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── router/
│   │   ├── services/
│   │   ├── tests/
│   │   └── main.tsx
│   ├── .env.example
│   ├── Dockerfile
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── .env.example
├── .gitignore
├── docker-compose.yml
├── docker-compose.staging.yml
└── package.json
```
