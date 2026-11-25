# Plan de acción — EduAI Platform

> **Este es el ÚNICO documento de pendientes del proyecto.** No hay otra lista de tareas abiertas: `docs/AVANCE.md` es solo la bitácora de lo hecho y `docs/DOCUMENTACION_TECNICA.md` §15 resume las limitaciones para quien lee la documentación.
>
> **Regla para que no se bifurque:** una tarea abierta se anota **solo acá**. Al cerrarla se marca acá y se deja **una entrada con fecha** en `docs/AVANCE.md`. No se copia su estado a otros archivos.
>
> **Estado verificado (2026-11-24):** backend 380 tests · frontend 233 · ai-services 164 (+1 omitido) · **E2E 53 (todos pasan, incluida una consulta real al asistente docente)** · `npm audit` en 0 · lint sin errores.
>
> **Alcance de la entrega:** el sistema **corre en local con Docker Compose** (acordado con la cátedra). El despliegue en la nube **no se pide** y está fuera de alcance (ver al final).
>
> **Decisiones del usuario (2026-11-23):** no tocar nada del CI de GitHub (0.1 y 3.1 pausadas) y posponer las URLs firmadas (1.2).

---

## Pendientes abiertos de un vistazo

| # | Tarea | Estado |
| --- | --- | --- |
| 0.1 | Verificar el CI en GitHub | ⏸ Pausada a pedido del usuario |
| 1.2 | URLs firmadas y temporales para archivos | ⏸ Pospuesta |
| 3.1 | CI con migraciones y E2E | ⏸ Pausada a pedido del usuario |
| 4.3 | Prueba de integración contra un bucket R2 real | 🟡 Escrita; falta correrla con credenciales (opcional) |
| 6.1 | Licencia única (admin) | ✅ Hecha y verificada (2026-11-25) |
| 6.2 | Reportes del admin: revisar y corregir | ✅ Hecha y verificada contra la base (2026-11-25) |
| 6.3 | Quitar un docente de una materia | ✅ Hecha y verificada (2026-11-25) |
| 6.4 | Notas por materia en el dashboard del alumno | ✅ Hecha y verificada (2026-11-25) |
| 6.5 | Bloque blanco al final de las páginas | ✅ Layout endurecido; el usuario confirmó que desapareció (2026-11-25) |
| 6.6 | Barra lateral responsive | ✅ Hecha (menú se contrae bajo 1024 px) |

Todo lo demás está hecho y verificado (detalle abajo), incluida la 5.1 (E2E de las funciones nuevas). La Fase 6 sale de la revisión del proyecto completo del 2026-11-24. Lo que **no** se hará para esta entrega: deploy en la nube.

---

## Fase 0 — Cierre rápido · verificada 2026-11-22

- [ ] **0.1** ⏸ **PAUSADA a pedido del usuario (2026-11-23): no tocar el CI de GitHub.** Verificar en GitHub que los 3 jobs de CI (`backend`, `frontend`, `ai-service`) queden verdes tras el push. Dato conocido: el workflow `CI` figura `disabled_manually` desde 2026-09-28 y el último run (#36, 2026-09-27) tuvo `backend` rojo en `npm run typecheck`, anterior al arreglo de `npx prisma generate` (verificado en clon limpio).
- [x] **0.2** Envío real de correo verificado 2026-11-22: `EMAIL_PROVIDER=smtp` con Gmail, `APP_URL=http://localhost:5173`, probado desde `/recuperar`; el correo llegó y el enlace abrió `/restablecer?token=...`. Requisito: `EMAIL_FROM` = `EMAIL_SMTP_USER` (o alias verificado). Credenciales solo en `.env` (gitignored). Archivos: `backend/src/services/email.service.ts`, `backend/src/modules/auth/recuperacion.service.ts`.
- [x] **0.3** Borrado `tmp_icons3.txt`.
- [x] **0.4** Grafo regenerado con `/graphify` el 2026-11-22: `graphify-out/GRAPH_REPORT.md`.
- [x] **0.5** Unificación de documentos (2026-11-23): `docs/COSAS_QUE_FALTAN.md` eliminado (su contenido útil pasó a este plan y a `AVANCE.md`, entrada 18); `docs/DEPLOY.md` y `docs/plan_accion_bugs_faltantes.txt` archivados en `docs/archivo/`.

**Verificación local 2026-11-22:** `npm run lint` y `npm test` pasan; los typechecks pasan **después de `npx prisma generate`** en `backend` (el cliente generado queda desactualizado tras cada migración nueva y tira errores de tipos). E2E: requiere el stack levantado.

## Fase 1 — Seguridad (antes de la defensa)

> **Contrato 1.1 (2026-11-22):** al dar de baja, `admin.service` escribe el `usuario_id` en una denylist con TTL igual a `ACCESS_TOKEN_TTL_SECONDS` (900 s por defecto). `requireAuth` rechaza cualquier access token cuyo `sub` esté en la denylist; reactivar lo saca. No se consulta la BD por request (evita tocar los ~30 mocks de prisma de los tests) y el TTL cubre exactamente la vida del token.

- [x] **1.1** Revocar el acceso al desactivar un usuario. Implementado con la denylist de caché del contrato: `backend/src/config/cache.ts` (TTL = `ACCESS_TOKEN_TTL_SECONDS`), chequeada en `backend/src/middlewares/auth.ts` y escrita/borrada desde `actualizarEstado()` en `backend/src/modules/admin/admin.service.ts`. `expiresIn` dejó de estar hardcodeado. Tests en `backend/src/tests/seguridad-archivos-sesiones.test.ts`. **Limitaciones:** la denylist vive en la memoria del proceso, así que (a) con varias réplicas del backend habría que moverla a Redis/BD y (b) **se pierde al reiniciar el backend**: el token de un usuario dado de baja vuelve a servir hasta que venza (máx. 15 min).
- [ ] **1.2** ⏸ **POSPUESTA (decisión 2026-11-23).** URLs firmadas y temporales para archivos: `backend/src/config/storage.ts` y las rutas `/uploads`. Se evaluó una versión para disco local (enlace `?exp&sig` con HMAC, firmado al responder y limpiado al recibir; logos públicos), pero cambia cada enlace a un archivo y los enlaces vencen: riesgo de romper aperturas de material, entregas y logo justo antes de la defensa, para cerrar un riesgo ya declarado (enlace no adivinable de 128 bits, sin control de sesión). Se retoma si se pasa a R2/S3 privado, junto con la 4.3.

## Fase 2 — Bugs visibles en demo · completada 2026-11-22

> **Contrato 2.1:** `BrandLogo` recibe `src` (URL absoluta o ruta `/uploads/...`, resuelta con `apiUrl`), `alt`, `className` y `fallback?`. Sin `src`, o si la imagen falla (`onError`), muestra una marca por defecto con `role="img"` y el mismo `alt`. Es puro: no lee contextos ni hace requests. Se usa en Login, Sidebar y Ajustes.
>
> **Contrato 2.2:** el asistente docente pasa a conversaciones persistentes. Rutas `POST /api/asistente/sesiones` (`{materia_id}`), `GET /api/asistente/sesiones?materia_id=...`, `GET /api/asistente/sesiones/:id/mensajes` y `POST /api/asistente/sesiones/:id/mensajes` (`{prompt, class_date?, content_ids?}`). Cada mensaje devuelve `{id, rol, contenido, sources, creado_en}`. `content_ids` son UUIDs de `Contenido` de la materia (máx. 10), se validan contra la BD y se convierten en `material_titles`; el ai-service recibe `material_ids` y filtra el RAG por ellos. `POST /api/asistente/generar` sigue funcionando y también acepta `content_ids`. Persistencia en `sesiones_asistente_docente` y `mensajes_asistente_docente` (dueño verificado con `obtenerProfesorAsignado`).

- [x] **2.1** Fallback de logo: `frontend/src/components/ui/BrandLogo.tsx`; usado en Login, Sidebar y Ajustes. Tests en `branding-context.test.tsx`.
- [x] **2.2** Chat del tutor docente con conversaciones persistidas (migración `20261122160000_sesiones_asistente_docente`), `content_ids` validados y propagados al RAG; selector múltiple de materiales, retoma de sesión y aviso `beforeunload`.
- [x] **2.2b** Correcciones posteriores a la demo: la subida desde Planificación crea `Contenido` e indexa en RAG; backfill idempotente con `rag:reindex -- --planning`; `aiClient` omite `material_ids` vacío y el ai-service responde sin LLM cuando no hay fragmentos para ids explícitos; selector del Tutor IA como modal amplio y clickeable. `maxWorkers: 2` en Jest para estabilizar el run paralelo.
- [x] **2.3** Editor de nota en popup (`TeacherGradesPage.tsx`), con validación y campos deshabilitados de notas ligadas a actividad.
- [x] **2.4** «Editar» en cada clase lleva a Planificación con la materia activa.
- [x] **2.5** Botón de eliminar contenido (borra archivo y vector RAG); los adjuntos sintéticos de Planificación no lo muestran.
- [x] **2.6** Shell contenido (`AppShell`), chat ampliado sin scroll heredado y sidebar colapsable desde el Header.

## Fase 3 — Calidad

- [ ] **3.1** ⏸ **PAUSADA a pedido del usuario (no tocar el CI de GitHub); se retoma solo si el usuario lo pide.** CI con migraciones y E2E: job con Postgres + pgvector que corra `prisma migrate deploy` y, si se puede, un E2E sin IA.
- [x] **3.2** Cobertura fina del frontend: inscripción por clave, claves de matriculación, entrega del alumno y registro de asistencia (11 tests nuevos).

## Fase 4 — Opcionales

- [x] **4.1** `npm audit`: **0 vulnerabilidades (2026-11-23).** Se actualizaron `zod` 4.6.7, `react-router-dom` 7.18.6, `vitest` 5.1.1, `vite` 8.3.8 y `@vitejs/plugin-react` 6.3.0. `effect` (3.22.5) y `glob` (14.0.6) quedan como `overrides` porque `@prisma/config` y Jest 30 fijan versiones con avisos; `npm ls` puede marcarlos como `invalid`, pero `npm ci`, Prisma, lint, typechecks, builds y las suites pasan.
- [ ] **4.3** 🟡 Prueba de integración contra un bucket R2 real. **Escrita 2026-11-23** en `backend/src/tests/storage-r2.integration.test.ts` (sube, lee, borra y comprueba que ya no está; y, con `R2_PUBLIC_URL`, el acceso público). **Se salta sola** sin credenciales, así que `npm test` no toca ningún bucket. Falta correrla una vez con un bucket de pruebas: `R2_INTEGRATION=1 R2_ACCESS_KEY_ID=… R2_SECRET_ACCESS_KEY=… R2_ENDPOINT=… R2_BUCKET_NAME=… npx jest storage-r2` (en `backend`). Opcional: el almacenamiento por defecto es disco local.
- [x] **4.4** Recuperación para quien no tiene acceso a su correo: el administrador emite un enlace de un solo uso desde **Usuarios** (`POST /api/admin/users/:usuarioId/recuperacion-token`, ADMIN, límite 10/15 min, mismo token hasheado de `/api/auth/password/restablecer`); respuesta `201 { enlace, expira_en }` con `Cache-Control: no-store`; el enlace se muestra una sola vez en el modal. **Salvedad conocida:** un administrador puede emitir un enlace para cualquier cuenta (incluida otra de administrador) y quedarse con ella; hoy no se registra quién lo emite ni se avisa al usuario.
- [x] **4.5** Latencia del tutor declarada: ver «Declaraciones para la defensa».

## Fase 5 — Antes de la defensa

- [x] **5.1** E2E de las funciones nuevas, cerrada 2026-11-24 (`e2e/flujo-completo.e2e.mjs`, de 44 a **53** pruebas). Cubren: (a) **recuperación de contraseña y enlace del administrador**: el pedido responde igual exista o no la cuenta, solo el administrador emite el enlace (403 a docente y alumno, 401 sin sesión), el enlace es de 256 bits y sirve una sola vez, una contraseña corta no lo consume, al usarlo la contraseña vieja deja de servir y la sesión abierta antes queda cerrada, un token inventado y un usuario inexistente se rechazan; (b) **asistente docente persistente**: crear conversación y verla en el listado, aislamiento entre docentes y alumnos (403/404), materiales ajenos o mal formados rechazados (400) sin dejar mensajes, y, con `E2E_AI=1 E2E_LLM=1`, una consulta real a Gemini que queda guardada (USER + ASSISTANT) y titula la conversación. Las pruebas sin `E2E_LLM` no consumen tokens. Verificado contra el stack real (53 de 53). Nota: el administrador puede emitir 10 enlaces cada 15 min y el pedido de recuperación admite 20 por IP cada 15 min; repetir la suite muchas veces seguidas puede dar 429.

---

## Fase 6 — Correcciones de la revisión del proyecto (2026-11-24)

> Origen: revisión del proyecto completo hecha por el usuario. Cada tarea trae su **diagnóstico verificado en el código**, el contrato propuesto, los pasos y el criterio de aceptación. Orden sugerido: **6.5 → 6.3 → 6.4 → 6.1 → 6.2** (de lo más rápido y visible a lo más grande; 6.1 y 6.2 comparten el reporte «Consumo MAU» y conviene cerrarlas juntas). El despliegue en la nube sigue fuera de alcance.
>
> **Decisiones que necesita del usuario** (la propuesta va marcada; si no hay respuesta se implementa la propuesta): (a) 6.1: ¿la licencia es solo informativa o lleva fecha de vigencia/renovación? *Propuesta: informativa, sin vigencia.* (b) 6.2: ¿qué estadísticas son pertinentes para la dirección? *Propuesta: filtros por período y por materia.* (c) 6.3: ¿qué pasa con lo que dejó el docente al que se quita? *Propuesta: no se borra nada; lo ve el siguiente docente asignado.* (d) 6.4: ¿cuántas notas por materia en el dashboard? *Propuesta: las 5 últimas, con enlace al detalle.*

- [x] **6.1** **Licencia única.** Se vende **una sola licencia, sin importar la cantidad de alumnos**: todos reciben el mismo producto.
  - *Diagnóstico:* hoy el modelo es por alumnos activos mensuales (MAU). `backend/src/modules/admin/admin.service.ts` define `PLANES_LICENCIA` (Starter ≤100, Growth ≤500, Scale ≤2K, Enterprise) y `LIMITE_MAU = 5000`; `GET /api/admin/license` devuelve `{ uso: {current, limit}, planes[] }`. El frontend (`AdminLicenciasPage.tsx`, titulada «Licencias MAU») muestra una barra de capacidad y la lista de planes; además usan ese modelo `adminLicensing.service.ts`, `useAdminLicensing.ts`, el tipo `LicensePlan`, la prueba `admin-licencias.test.tsx`, el ítem «Licencias» del menú, el reporte «Consumo MAU» (ver 6.2), el Manual §4.5 y `API_ENDPOINTS.md`.
  - *Contrato propuesto:* `GET /api/admin/license` → `{ licencia: { nombre, tipo: "UNICA", estado: "ACTIVA", incluye: string[] }, uso: { alumnos, docentes, materias } }`. El uso es **informativo, sin tope, sin plan «actual» ni barra de capacidad**. `incluye` lista todo el producto (tutor IA, corrección asistida, analytics, reportes, etc.), igual para todas las instituciones.
  - *Pasos:* (1) backend: reemplazar planes y límite por la licencia única (service + controller; la ruta se mantiene); (2) frontend: la página pasa a «Licencia» con el nombre, el estado, qué incluye y el uso informativo; quitar la barra, los planes y el tipo `LicensePlan`; ajustar servicio, hook y menú; (3) reescribir `admin-licencias.test.tsx` y agregar una prueba de backend del nuevo contrato; (4) reemplazar el reporte «Consumo MAU» (ver 6.2); (5) actualizar Manual §4.5, `API_ENDPOINTS.md` (`npm run docs:api`), `DOCUMENTACION_TECNICA.md` y dejar la entrada en `AVANCE.md`; (6) E2E: el administrador consulta la licencia y el resultado no tiene límite ni planes.
  - *Aceptación:* no queda ninguna mención de MAU, planes ni límite en la interfaz, la API ni los documentos; el administrador ve una licencia única con lo que incluye.
- [x] **6.2** **Reportes del administrador: revisar y corregir.**
  - *Diagnóstico (revisado en `reportesAdmin()` y **contrastado con la base real el 2026-11-24**):* **no son un mockup**: salen de consultas reales y las cifras coinciden con la base (184 asistencias, 92 notas, 91 aprobadas, promedio 7,98, 32 sesiones del tutor, 64 mensajes, 16 alumnos, 10 con inscripción). Pero tienen defectos de fondo: (a) **todos son globales**: las descripciones prometen «por materia y período» y «distribución de calificaciones» y no lo entregan; (b) «Notas» promedia **todas las notas con el mismo peso**, cuando el sistema define la nota final como promedio **ponderado por categoría** (`notas.promedio.ts`), usa un umbral fijo (≥ 6) y muestra «Docentes», que no es una métrica de notas; (c) «Retención» es alumnos inscriptos sobre registrados, **no es retención** (la retención mensual real está en Métricas de éxito: dos números distintos para el mismo nombre); (d) «Consumo MAU» cuenta alumnos con al menos una inscripción, **no usuarios activos mensuales**, y está atado al modelo de licencia viejo; (e) cuentan alumnos desactivados (no filtran `activo`), a diferencia de la licencia; (f) las pruebas solo verifican el encabezado `%PDF-`, **ninguna comprueba los números**.
  - *Pasos:* (1) definir por escrito la fuente y la fórmula de cada reporte; (2) filtros `?periodo=` y `?materia_id=` en `GET /api/admin/reports` y en la exportación (CSV y PDF); (3) **Notas:** promedio ponderado por materia (reutilizar `calcularPromediosPorMateria`), distribución por rangos y desglose por materia, sin la fila «Docentes»; (4) **Asistencia:** por materia y por mes; (5) **Retención:** definición real (alumnos activos este mes que ya lo estaban el mes anterior), la misma que usa Métricas de éxito; (6) reemplazar «Consumo MAU» por «Uso de la plataforma» (usuarios activos por actividad real: sesiones del tutor, entregas, accesos a material); (7) excluir cuentas desactivadas en todos; (8) pruebas de backend con datos conocidos y **valores esperados exactos**, más un E2E que cree datos y compruebe lo que muestra el reporte; (9) contrastar a mano con consultas SQL sobre la base real; (10) Manual §4.5 y entrada en `AVANCE.md`.
  - *Aceptación:* cada cifra del reporte se puede reproducir con una consulta a la base; los nombres de las métricas coinciden con lo que miden; las exportaciones llevan los mismos números.
- [x] **6.3** **Quitar un docente de una materia sin borrar el usuario.**
  - *Diagnóstico:* el **backend ya lo soporta**: `POST /api/admin/materias/:id/profesores` con `activo: false` marca `desasignado_en`, le avisa al docente y hay prueba de «reasignar». **Falta todo el frontend:** `assignAdminProfessor` siempre manda `activo: true`, la tabla de Materias solo lista los nombres sin acciones por docente y el formulario solo permite asignar.
  - *Pasos:* (1) backend: endpoint explícito `DELETE /api/admin/materias/:materiaId/profesores/:profesorId` (más claro que `activo: false`; se mantiene el actual por compatibilidad); 404 si no estaba asignado; **no se borra** ninguna actividad, rúbrica, nota ni entrega; si era el único docente, la materia queda «Sin asignar»; (2) frontend: servicio `unassignAdminProfessor` y hook; en la fila de la materia, un chip por docente con «Quitar» y una confirmación («pierde el acceso a la materia; su historial se conserva; se le avisa»); en «Editar», la lista de docentes asignados con la misma acción; (3) pruebas de backend (quitar, quitar dos veces, reasignar, aviso, el historial queda) y de frontend (confirmación y llamada); (4) E2E: asignar, quitar, y comprobar que ese docente **ya no entra** a la materia (hoy `obtenerProfesorAsignado` le da 403); (5) Manual §4.3 y `API_ENDPOINTS.md`.
  - *Aceptación:* el administrador quita a un docente de una materia desde la pantalla, el usuario del docente sigue activo y con sus otras materias, y no se pierde ningún dato.
- [x] **6.4** **Notas por materia en el dashboard del alumno.**
  - *Diagnóstico:* `dashboardAlumno` (`backend/src/modules/dashboard/dashboard.service.ts`) ya lee las notas del alumno, pero **solo calcula el promedio ponderado por materia** y no devuelve las notas; `StudentDashboardPage` muestra una lista de promedios sueltos. El detalle de calificaciones existe en la pantalla de progreso (`StudentProgressPage`, `useCalificaciones`) pero no en el panel principal.
  - *Contrato propuesto:* `materias[].notas: { id, evaluacion, categoria, calificacion, fecha }[]` (las 5 últimas por materia, respetando el filtro de período) y `materias[].total_notas`.
  - *Pasos:* (1) backend: devolver las notas por materia, solo las propias, ordenadas por fecha; (2) frontend: tipo `DashboardAlumno` y un componente «Mis notas» por materia con las últimas notas, el promedio ponderado y un enlace «Ver todas» al detalle; estado vacío; debe respetar el selector de período; (3) pruebas: backend (valores, orden, período, que no aparezcan notas de otro alumno) y frontend; (4) actualizar la prueba de humo y el Manual (§2.2 y §2.9).
  - *Aceptación:* el alumno ve en su dashboard sus notas agrupadas por materia, coherentes con el detalle y con el promedio.
- [x] **6.5** **Bloque blanco al final de todas las páginas.**
  - *Reproducción 2026-11-24 (stack levantado, navegador integrado, 1024×768 y 1440×900, los tres roles, 27 rutas):* **no se reproduce.** El documento nunca desborda (`scrollHeight` = `innerHeight` en todas las rutas) y el único scroll es el de `main`, que termina con el relleno de 28 px. Falta el dato de **dónde lo ve el usuario**: navegador, zoom, tamaño de ventana, pantalla exacta y una captura. Hasta tenerlo, lo único comprobable es que `bg-bg` (`#f8fafc`) y las tarjetas (`#fff`) casi no se distinguen, así que ese relleno final se lee como un bloque blanco. *Diagnóstico previo (hipótesis):* `AppShell` usa `h-screen` (100vh) con `overflow-hidden` y un `main` con `overflow-y-auto p-8 bg-bg`. Dos causas posibles, a confirmar: (a) `bg-bg` es `#f8fafc`, casi blanco, igual que las tarjetas (`#fff`): el «bloque blanco» sería el relleno inferior de `main`; (b) un desborde del documento (100vh frente al alto visible, por la barra del navegador o el zoom) que deja scroll de la página por fuera del shell.
  - *Pasos:* (1) **reproducir** con el stack levantado, en la vista real y en tamaños habituales; medir `document.documentElement.scrollHeight` frente a `innerHeight` y el alto de `main`, e identificar con `getBoundingClientRect` qué elemento genera el espacio; (2) arreglar según la causa: `html, body, #root { height: 100%; overflow: hidden }` o `h-dvh` en `AppShell`, un único contenedor con scroll (`main`), ajustar el relleno inferior y el contraste del fondo para que el final de la página se lea como un final; (3) revisar las pantallas con diseño propio (login y `AuthLayout` con `fixed inset-0`, el chat ampliado del Aula virtual con `useScrollLock`); (4) dejar una prueba que fije las clases del shell (jsdom no mide el layout).
  - *Pedir al usuario:* en qué navegador y a qué zoom aparece, en qué pantalla, y una captura con el bloque a la vista.
  - *Aceptación:* en todas las rutas de los tres roles, `document.documentElement.scrollHeight <= innerHeight` y al llegar al final de `main` no aparece ningún bloque ajeno a la aplicación; verificado en el navegador, con captura antes y después.
- [x] **6.6** **Barra lateral responsive.** Hallazgo de la revisión del 2026-11-24: en ancho de celular (375 px) la barra lateral ocupa 256 px fijos y deja 119 px al contenido; no se colapsa sola. Si la demo o el uso real incluyen tableta o celular, hay que colapsarla bajo cierto ancho (botón del Header ya existente) y probar a 375, 768 y 1024 px.
- **Resultado de la fase (2026-11-25):**
  - Backend 402 pruebas (44 suites, 1 omitida), frontend 240 (35 archivos), E2E 57 (56 pasan + 1 omitida por LLM) con el bloque nuevo «Revisión del proyecto (Fase 6)»; lint, tipos y `npm run docs:api` (132 endpoints) en verde.
  - Verificado en el navegador: Licencia, Reportes con filtros, Materias con «Quitar» y «Mis notas» en el dashboard del alumno. Cifras de asistencia y notas de Reportes iguales a las consultas SQL (186 registros / 123 presentes / 33 ausentes / 30 tardanzas; 93 notas, 92 aprobadas).
  - **6.5:** el bloque blanco no se reprodujo; se fijó el layout (`html/body/#root` al 100 % y sin desborde, `h-dvh`) para que el documento nunca scrollee. El usuario confirmó en su navegador que desapareció.
  - **6.6:** a 375 px el menú pasa de 256 px a 69 px (contenido de 119 a 306 px). El botón del header sigue pudiendo abrirlo o cerrarlo.
  - Las decisiones (a)–(d) se aplicaron con la propuesta marcada (licencia informativa sin vigencia, filtros por período y materia, no se borra nada al quitar un docente, 5 notas por materia).
- **Verificación de toda la fase:** `npx prisma generate` (si cambia el esquema), `npm run lint`, `npm test`, tipos de backend y frontend, `npm run e2e` con los casos nuevos (licencia, quitar docente, reportes, notas en el dashboard), `npm run docs:api`, y una entrada por tarea en `docs/AVANCE.md`.

## Declaraciones para la defensa

- **Latencia del tutor:** no cumple el objetivo de primera respuesta en menos de 3 s. La medición real dio una mediana de **6,84 s** (1 de 9 respuestas por debajo de 3 s) con `gemini-3.5-flash-lite` y clave gratuita. La plataforma aporta ~0,6 s; el resto es la variabilidad de Gemini (0,7–22 s llamando al modelo directamente). La cadena de medición se validó con un servicio simulado (0,64 s medidos, 637 ms registrados). Para cumplirlo haría falta una clave con plan pago o cuota dedicada. Detalle en `docs/DOCUMENTACION_TECNICA.md` §12 y `docs/MATRIZ_CASOS_DE_USO.md`.

## Fuera de alcance de esta entrega

- **Despliegue en la nube.** La cátedra aceptó que alcanza con correr el proyecto en local con Docker Compose. El análisis que se había hecho quedó archivado en `docs/archivo/DEPLOY.md` y no es un pendiente.

---

## Verificación después de cada fase

```bash
npx prisma generate --workspace backend   # (o `npx prisma generate` dentro de backend) tras cada pull con migraciones
npm run lint
npm test
npm run typecheck --workspace backend
npm run typecheck --workspace frontend
npm run e2e        # requiere el stack levantado
```

## Reglas del proyecto (no romper nada)

1. Las capas solo se hablan con las adyacentes: frontend → backend → ai-service.
2. Todo error de negocio es `AppError` (`backend/src/middlewares/error.ts`); nunca otra clase ni un string suelto.
3. Todo endpoint con `materiaId` valida la asignación del profesor con `obtenerProfesorAsignado()` (defensa contra IDOR).
4. Ningún valor hardcodeado: toda configuración viene de `env` validado con zod.
5. Si cambia una interfaz en `ai-services`, se actualiza el fake en `ai-services/src/tests/fakes.py`.
6. Contrato primero: definir el shape de entrada/salida (Zod + Pydantic + `aiClient.ts`) antes de codear.
7. **Un solo lugar para los pendientes: este documento** (ver el encabezado).

## Recomendación de arranque

Empezar por la **Fase 6**, en este orden: **6.5** (bloque blanco, rápido y visible en toda la demo), **6.3** (el backend ya está hecho, solo falta la pantalla), **6.4**, y por último **6.1 + 6.2** juntas (licencia única y reportes). La **4.3** necesita un bucket de pruebas (opcional); 0.1, 1.2 y 3.1 están pausadas o pospuestas por decisión del usuario.
