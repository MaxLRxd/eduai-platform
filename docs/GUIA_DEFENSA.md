# Guía de estudio para la defensa

Complemento de la presentación (35 diapositivas, con notas del orador). Sirve para estudiar las respuestas a
las preguntas probables de los profesores, **con el dato y el archivo del código donde se comprueba**.
Si un profesor pide ver algo, ahí está dónde mirar.

> Regla de oro: si no sabés algo, decí qué sí sabés y dónde está en el código. Y no inventes cifras: los
> números de esta guía salen de la documentación y de mediciones reales. Los pendientes y su estado están en
> `PLAN_DE_ACCION.md` (único documento de pendientes). Actualizada el 2026-11-23.

---

## 1. La idea en 30 segundos

EduAI es un campus virtual con tres roles (alumno, docente, administrador). Su diferencial es un **tutor de IA
que responde solo con el material que cargó el docente de esa materia** (técnica RAG) y **cita la fuente**. El
docente además recibe un **borrador de corrección** hecho por la IA con su rúbrica, pero **él decide** qué se
publica. Resuelve dos problemas: la carga operativa del docente y la falta de un tutor confiable fuera de clase.
Se ejecuta **en local con Docker Compose** (acordado con la cátedra; el despliegue en la nube no se pide).

## 2. Números para tener en la cabeza

| Dato | Valor |
| --- | --- |
| Casos de uso | 26 (11 alumno, 10 docente, 4 administrador, 1 sistema), todos implementados |
| Tablas de la base | 34 |
| Endpoints de la API | 131 |
| Pruebas | 380 backend · 233 frontend · 164 servicio de IA (+1 omitida) · 53 punta a punta |
| Vulnerabilidades (`npm audit`) | 0 |
| Encuesta de relevamiento | 42 personas (34 estudiantes, 8 docentes) |
| Plan | 245 puntos de historia, 14 semanas, sprints de 2 semanas, 4 integrantes de 15 hs/semana |
| Token de sesión | 15 minutos; renovación con cookie httpOnly de 7 días |
| Fragmentos por consulta | 5 (los más cercanos de esa materia) |
| Tamaño de fragmento | ~500 tokens con 50 de solape |
| Vector | 1536 números (modelo `gemini-embedding-2`) |
| Caché de respuestas | Redis, 1 hora |
| Latencia medida | mediana **6,84 s** contra el objetivo de **3 s** → **no cumple** |

---

## 3. El recorrido de una pregunta, paso a paso

Alumno pregunta: «¿Cuántos hosts utilizables tiene una red /26?»

1. **El navegador** envía `POST /api/tutor/sesiones/:id/stream` con la pregunta y el token JWT.
   (`frontend/src/services/tutor.service.ts`)
2. **El backend valida y guarda.** Comprueba que la sesión de chat es del alumno, que está inscripto a la
   materia y que tiene rol ALUMNO; guarda la pregunta tal cual en `mensajes_ia` (`prompt_original`).
   (`backend/src/modules/tutor/tutor.controller.ts` → función `stream`; `tutor.service.ts` → `prepararStream`,
   `registrarMensajeUsuario`)
3. **¿Pregunta frecuente?** En modo normal busca si coincide con una pregunta cargada por el docente; si sí,
   responde sin usar la IA. (`buscarPreguntaFrecuente`)
4. **Llama al servicio de IA** (`POST /tutor/chat/stream`) por la red interna, con la pregunta, el modo, el
   historial de esa sesión y un mapa id→título de los materiales. Va autenticado con el secreto compartido en
   la cabecera `X-Internal-Token`. (`backend/src/config/aiClient.ts` → `streamTutor`)
5. **Depura el prompt:** quita saludos, muletillas y repeticiones. Si era solo un saludo, responde sin llamar al
   modelo. (`ai-services/src/services/prompt_sanitizer.py`)
6. **Caché:** busca en Redis la clave `tutor:` + SHA-256 de `materia::modo::pregunta`. Si existe, la devuelve.
   (`ai-services/src/use_cases/_helpers.py` → `cache_key`; `services/cache_service.py`)
7. **Búsqueda:** convierte la pregunta en un vector (embedding) y consulta pgvector:
   `ORDER BY embedding <=> $vector` con `WHERE subject_id = materia`, `LIMIT 5`. Solo trae material de **esa**
   materia. (`ai-services/src/services/retrieval_service.py` → `search`)
8. **Genera:** arma el mensaje (reglas + historial + contexto + consulta) y llama a Gemini en streaming.
   (`use_cases/ask_tutor.py` → `_prepare`, `stream`)
9. **Responde y registra:** los fragmentos de texto vuelven al navegador como eventos SSE
   (`{"type":"token","text":…}` y al final `{"type":"done","sources":[…]}`). Al terminar, el backend guarda la
   respuesta con el tiempo hasta la primera palabra (`primer_token_ms`) y cuenta la consulta para los
   analytics del docente.

### Qué recibe exactamente el modelo

Cuatro partes, en este orden:

1. **Instrucciones del sistema** (`ai-services/src/prompts/tutor.py`; hay una por modo: normal, socrático,
   pistas): responder únicamente con el contexto; si no está, decir que no cuenta con esa información; citar
   el material; no revelar datos de otros usuarios; responder en el idioma del alumno.
2. **Historial** de la sesión.
3. **Contexto:** los 5 fragmentos, cada uno rotulado `[Fuente: "título del material"]`. Se usa el título y no
   el identificador interno porque el modelo copiaba el identificador en sus citas.
4. **Consulta del alumno** (ya depurada).

---

## 4. Dónde se guarda cada dato

| Dato | Dónde | Duración | Quién lo ve |
| --- | --- | --- | --- |
| Pregunta y respuesta | PostgreSQL, `mensajes_ia` dentro de `sesiones_ia` (alumno + materia). Texto, modo, tiempos | Permanente | Solo ese alumno (`obtenerSesionDeAlumno` lo verifica) |
| Versión depurada del prompt | `mensajes_ia.prompt_depurado` (solo en la respuesta **sin** streaming) | Permanente | Ese alumno |
| Respuesta en caché | Redis, clave `tutor:<sha256>` | 1 hora | Solo el sistema |
| Conteo de consultas (analytics) | `errores_dudas_frecuentes` y `analytics_comprension_temas`: texto de la pregunta + contador, **sin id de alumno** | Permanente | El docente de la materia, anónimo |
| Material de la cátedra | `ai_materials` (pgvector): fragmento, vector, materia | Hasta que el docente lo borra | Solo el servicio de IA |
| Vector de la pregunta | **No se guarda** | — | — |

### Qué sale hacia Google (Gemini)

- **Sale:** la pregunta, el historial de esa sesión y los 5 fragmentos elegidos. Al indexar, el texto de cada
  fragmento (para calcular su vector).
- **No sale:** nombre, email, notas, asistencia, contraseñas, datos de otros alumnos ni material de otras
  materias. El pedido solo lleva `subject_id` (un UUID), `question`, `mode`, `history` y `material_titles`.

---

## 5. Preguntas probables y respuestas

### Sobre el sistema de información (temas de la cátedra)

**¿Qué es un sistema de información y por qué EduAI lo es?**
Es un conjunto de entradas, procesos, salidas y retroalimentación que convierte datos en información para
decidir. EduAI recibe datos de la cursada, los procesa (reglas, RAG, correcciones, analytics) y entrega
información que cada rol usa para decidir.

**¿Qué tipo de sistema de información es?**
Híbrido: transaccional (inscripciones, entregas, notas, asistencia), gerencial (tableros y reportes), de apoyo
a la decisión (mapa de comprensión, alertas de riesgo) y con un componente de IA y gestión del conocimiento
(el tutor).

**¿Cuál es la situación problemática?**
Dos ramas. Docente: carga horaria (corregir, preparar material), dudas repetidas que no se enteran, seguimiento
individual difícil. Alumno: sin tutor fuera de clase; usa IA genérica sin contexto y se desinforma.

**¿Cómo relevaron?**
Encuesta a 42 personas (34 estudiantes y 8 docentes), relevamiento de producto EduAI Platform v1.0 y entrevistas
(Anexo A). Hallazgo central: ningún campus integra IA alimentada con el material de cada cátedra.

**¿Qué metodología usaron y por qué?**
Scrum, con sprints de 2 semanas, porque el proyecto es iterativo y necesitaba validar y absorber cambios.
Roles: Product Owner (Acevedo), Scrum Master (Canello), equipo de desarrollo.

**¿Qué diferencia hubo entre lo planificado y lo hecho?**
Cinco desvíos, todos documentados: Gemini en lugar de OpenAI/Claude (cuota gratuita), embeddings de Gemini,
pgvector en lugar de ChromaDB/Pinecone, pipeline propio en lugar de LangChain, y ejecución local en lugar de
despliegue en la nube (acordado con la cátedra).

### Sobre el prompt y los datos

**¿Cómo se guarda el prompt de un alumno?**
Como texto plano en PostgreSQL, tabla `mensajes_ia`, dentro de una sesión (`sesiones_ia`) ligada a ese alumno
y esa materia. Solo ese alumno puede leerla: el backend verifica la pertenencia en cada lectura.

**¿Dónde se guarda?**
PostgreSQL (permanente), Redis (la respuesta, 1 hora) y, sin identificar al alumno, en los contadores de
analytics del docente. El vector de la pregunta no se guarda.

**¿Cómo se envía a la IA?**
Navegador → backend por HTTPS con JWT → servicio de IA por la red interna con el secreto compartido → Gemini
por HTTPS con la clave del servidor. La clave de Gemini nunca llega al navegador.

**¿Está cifrado?**
En tránsito hacia el navegador, en producción debe ir por HTTPS (el sistema ya usa cookie `Secure` y HSTS en
producción). Los tramos internos van dentro de la red de Docker. **En reposo no ciframos columnas** de la base:
es una limitación a declarar.

**¿Cómo sabe qué material usar?**
Convierte la pregunta en un vector de 1536 números y busca los 5 fragmentos más cercanos (distancia coseno)
**solo dentro de esa materia**.

**¿Qué es un embedding?**
Una representación numérica del significado de un texto: textos parecidos dan vectores cercanos. Permite buscar
por significado y no por palabras exactas.

**¿Qué es la similitud coseno y qué es HNSW?**
Coseno mide el ángulo entre dos vectores (más cerca de 1, más parecidos). HNSW es un tipo de índice que permite
encontrar los vecinos más cercanos rápido sin comparar contra todos.

**¿Por qué fragmentos de 500 tokens con solape de 50?**
Un fragmento chico es preciso pero pierde contexto; uno grande trae ruido. El solape evita partir una idea
justo en el borde. Cortamos en oraciones.

**¿Qué evita que la IA invente?**
Capas: (1) instrucciones de responder solo con el contexto y citar; (2) el contexto se acota a la materia;
(3) si la materia no tiene material indexado, no se llama al modelo y se responde que no hay información;
(4) existe un umbral de similitud configurable (`RETRIEVAL_MIN_SCORE`) que **por defecto está apagado**;
(5) en correcciones, el docente decide qué se publica.
*Ojo:* no digas que «si ningún fragmento es parecido no responde»: con el umbral en 0 siempre se envían los 5
más cercanos y es el prompt el que ordena decir que no sabe.

**¿Qué pasa con una pregunta fuera de tema?**
El prompt ordena responder que su función se limita al contenido de la cátedra. Es una barrera de instrucción,
no una garantía absoluta.

**¿Y si un alumno intenta que la IA ignore sus reglas (inyección de instrucciones)?**
No hay un filtro dedicado: es una limitación declarada. El daño está acotado porque el modelo solo devuelve
texto, no tiene herramientas ni acceso a la base, y solo ve el material de esa materia.

**¿Entrenaron un modelo con los datos de los alumnos?**
No. Usamos el modelo de Google por API, sin ajuste fino. Los términos de uso de datos del plan gratuito de
Gemini hay que revisarlos antes de un uso real; en producción conviene un plan con garantías.

**¿Qué ve el docente de lo que preguntan los alumnos?**
Qué dudas se repiten y en qué unidad, con un contador. No ve quién las hizo (esa tabla no guarda el alumno).

**¿Qué pasa si dos alumnos hacen la misma pregunta?**
La segunda se sirve desde la caché de Redis (misma materia, modo y pregunta) sin volver a llamar al modelo.

**¿Qué es SSE y por qué lo usan?**
Server-Sent Events: el servidor envía la respuesta por partes sobre una conexión HTTP. Así el alumno ve la
primera palabra enseguida en lugar de esperar la respuesta completa.

**¿El docente también tiene un tutor?**
Sí, el Asistente IA: genera material de clase con el contexto de la materia y de la planificación. Sus
conversaciones se guardan (`sesiones_asistente_docente` y `mensajes_asistente_docente`), se pueden retomar y el
docente elige con qué materiales de la materia trabajar (el RAG se filtra por esos materiales).

### Sobre la corrección con IA

**¿La IA pone la nota?**
No. La IA elige un **nivel por criterio** de la rúbrica y redacta la explicación; la **nota la calcula el
sistema** a partir de esos niveles y los pesos. El docente edita, puede reemplazarla y recién entonces publica.
Hasta entonces el alumno no ve nada. Opción múltiple se corrige con cálculo numérico, sin IA.

**¿Qué pasa si la IA falla al corregir?**
El docente corrige a mano; la entrega no se pierde.

### Sobre seguridad y cuentas

**¿Qué pasa cuando se da de baja a un usuario?**
Se cierran sus sesiones y su token de acceso se rechaza **al instante** con una lista de revocados que dura lo
que el token (15 min). Limitación: esa lista vive en la memoria del backend, así que se pierde si se reinicia
y no se comparte entre réplicas; con una sola instancia, como acá, alcanza.

**¿Cómo se recupera una contraseña?**
Por correo: el alumno pide un enlace; lleva un token aleatorio de 256 bits del que en la base solo se guarda
el hash, vence a los 60 minutos y sirve una sola vez. La respuesta es la misma exista o no la cuenta (no se
puede averiguar quién tiene cuenta) y al usarlo se cierran todas las sesiones. Hay límites de pedidos por
cuenta (3) e IP (20) cada 15 minutos. El envío real por correo está verificado con SMTP.

**¿Y si el usuario no tiene acceso a su correo?**
El administrador emite desde *Usuarios → Recuperar* un enlace de un solo uso, que se muestra una sola vez y no
envía correo. *Salvedad que conviene decir:* un administrador puede emitir ese enlace para cualquier cuenta
(incluida otra de administrador); hoy no se registra quién lo emite ni se avisa al usuario.

**¿Cómo evitan que un alumno vea otra materia o a otro alumno?**
Dos niveles: rol en cada ruta y pertenencia a la materia en cada operación. Las consultas siempre filtran por
las materias del usuario.

**¿Los archivos subidos están protegidos?**
Se sirven por una URL no adivinable (sufijo aleatorio de 128 bits) pero sin control de sesión; los tipos
ejecutables (`.html`, `.svg`) se descargan aislados. Las URLs firmadas y temporales se evaluaron y se
pospusieron: cambiarían todos los enlaces a archivos justo antes de la entrega. Es una limitación declarada.

### Sobre el diseño

**¿Por qué RAG y no entrenar un modelo?**
El material cambia en cada cursada: con RAG se actualiza al instante, cita la fuente y no hace falta entrenar
ni tener datos masivos. Entrenar sería caro, lento y no citaría.

**¿Por qué un servicio de IA aparte (Python)?**
El ecosistema de IA está en Python, queda aislado y sin exponer a internet (solo lo llama el backend). Si cae,
el resto de la plataforma sigue funcionando.

**¿Por qué pgvector y no Pinecone?**
Una sola base para datos y vectores: una pieza menos que operar. Pinecone sigue soportado y se elige con la
variable `VECTOR_STORE`.

**¿Por qué Node/Express y React?**
El equipo ya los dominaba; Prisma + Zod dan tipado y validación; React Query maneja la caché del estado del
servidor.

**¿Qué pasa si dos alumnos intentan usar el último cupo de una clave?**
El cupo se reserva con un `UPDATE` condicional atómico: solo uno lo consigue.

**¿Qué pasa si se cae la IA o Gemini?**
Reintentos con espera creciente (hasta 4); si no responde, el alumno ve un aviso con botón *Reintentar* y el
resto de la plataforma sigue funcionando.

### Sobre calidad y honestidad

**¿Cómo comprobaron que funciona?**
380 + 233 + 164 = 777 pruebas automáticas, 53 pruebas punta a punta con los tres roles contra el sistema
levantado, análisis estático (TypeScript estricto, ESLint y ruff sin advertencias), `npm audit` en 0 y una
verificación con las imágenes de producción.

**¿Tienen integración continua?**
El pipeline está definido (`.github/workflows/ci.yml`: lint, tipos y pruebas de los tres servicios) y lo
verificamos reproduciéndolo desde un clon limpio. *Ojo:* no digas que corre en cada cambio en GitHub: ese
workflow figura deshabilitado en el repositorio y no se verificó su ejecución allí (es un pendiente pausado).

**¿Qué no cumple?**
La **latencia**: el objetivo era la primera respuesta en menos de 3 s y medimos una mediana de 6,84 s (solo 1
de 9 respuestas bajó de 3 s). La causa medida es la capacidad de Gemini con clave gratuita (el modelo llamado
directo tarda de 0,7 a 22 s). Se solucionaría con un plan pago o cuota dedicada.

**¿Se cumplieron las métricas de éxito?**
Los 26 casos de uso, sí. Las cuatro métricas de adopción (uso del tutor, retención, feedback revisado y
reducción de tiempo docente) el sistema ya las calcula con datos de uso, pero el valor con usuarios reales
requiere un piloto de semanas o meses.

**¿Qué mejorarían?**
Un piloto con usuarios reales para medir la adopción; un plan pago de Gemini para cumplir la latencia; URLs
firmadas para los archivos; un filtro contra inyección de instrucciones; guardar en la base (o Redis) la lista
de tokens revocados y registrar quién emite los enlaces de recuperación; extender las pruebas punta a punta a
las funciones más nuevas; y, si se quisiera, desplegarlo en la nube (hoy fuera de alcance).

**¿Qué fue lo más difícil?**
La variabilidad de Gemini: los errores 503 intermitentes. Medimos, descubrimos que el error llegaba al leer el
primer fragmento y no al abrir la conexión, y extendimos el reintento hasta ahí.

**¿Qué parte hizo cada uno?**
Ver la tabla del informe (sección 3.4): Acevedo, backend e integración del modelo; Canello, base de datos y
DevOps; Oliver, frontend, UX y pruebas; Rojas, pipeline RAG y analytics. Cada módulo tuvo un responsable
principal con apoyo cruzado.

---

## 6. Glosario rápido

| Término | En una frase |
| --- | --- |
| RAG | Antes de responder, buscar en el material propio y dárselo al modelo como contexto |
| LLM | Modelo de lenguaje (aquí, Gemini) que genera el texto |
| Embedding | Vector numérico que representa el significado de un texto |
| pgvector | Extensión de PostgreSQL que guarda vectores y busca por cercanía |
| Chunk / fragmento | Trozo del material (~500 tokens) que se indexa por separado |
| Prompt | El texto que se le envía al modelo |
| SSE | Envío de la respuesta por partes sobre HTTP |
| JWT | Token firmado que prueba quién sos, vence a los 15 minutos |
| Prisma | Capa que habla con PostgreSQL y versiona el esquema con migraciones |
| Zod | Librería que valida cada entrada antes de llegar a la lógica |
| Scrum | Marco ágil con sprints, roles y ceremonias |

---

## 7. Demostración: guion y plan B

Preparación (antes de la defensa):

```powershell
docker compose up --build
npm run demo:reset --workspace backend
```

Usuarios de prueba (contraseña `Clave1234`): `admin@ies.edu`, `profe1@ies.edu`, `alumno1@ies.edu`.

Guion:
1. **Docente:** cargar un texto de estudio nuevo; mostrar que queda indexado.
2. **Docente:** crear una actividad con rúbrica.
3. **Alumno:** panel; preguntar al tutor algo que esté en el material recién cargado (señalar la **fuente
   citada**); preguntar algo fuera de tema (no inventa).
4. **Alumno:** resumen, simulacro y entrega de la actividad.
5. **Docente:** abrir la corrección sugerida, editarla y publicarla.
6. **Docente:** mapa de comprensión y dudas frecuentes.
7. **Administrador:** usuarios, claves, reportes y métricas de éxito.

**Plan B** si falla internet o Gemini (el tutor responde con un aviso y botón *Reintentar*): mostrar el resto
del sistema, que no depende de la IA (entregas, notas, asistencia, correcciones a mano, reportes), el historial
del tutor ya guardado y la documentación. Tener abierta la matriz de casos de uso y los resultados de pruebas.
**Tip:** probá la pregunta del tutor un minuto antes; si está en la caché de Redis responde al instante.
