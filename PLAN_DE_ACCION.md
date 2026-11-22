# Plan de acción — EduAI Platform

> Generado el 2026-11-22 a partir de `docs/AVANCE.md`, `docs/COSAS_QUE_FALTAN.md` (BOLO, 2026-11-20) y el inventario verificado en `graphify-out/README.md`.
>
> **Fuente de verdad:** `docs/COSAS_QUE_FALTAN.md`. `AVANCE.md` dejó cerrado todo su «QUÉ FALTA» salvo los opcionales; la sección «Ya resuelto» del BOLO no se rehace.
>
> **Estado al cierre (2026-11-20):** backend 363 tests · frontend 195 · ai-services 161 (+1 omitido) · E2E 44.

---

## Diagnóstico

- El access token dura 15 min y `requireAuth()` no chequea que la cuenta siga activa (`backend/src/middlewares/auth.ts:14-37`).
- El chat del tutor del docente es estado local: se pierde al cambiar de pestaña y no permite elegir material (`frontend/src/hooks/useTeacherAssistant.ts:4-34`).
- El logo institucional no tiene fallback ante error de carga (`LoginPage.tsx:35-39`, `Sidebar.tsx:32-42`).
- El editor de nota aparece arriba del todo, sin overlay (`TeacherGradesPage.tsx:176-289`).
- El CI está corregido en clon limpio pero nunca se vio correr en GitHub (`.github/workflows/ci.yml`).

---

## Fase 0 — Cierre rápido (1-2 h, casi sin código) · verificada 2026-11-22

- [ ] **0.1** Verificar en GitHub que los 3 jobs de CI (`backend`, `frontend`, `ai-service`) queden verdes tras el push (BOLO 1.2). **Bloqueado:** el workflow `CI` está `disabled_manually` desde 2026-09-28; el último run (#36, 2026-09-27) tiene `frontend` y `ai-service` verdes y `backend` rojo en `npm run typecheck`. Rehabilitarlo en GitHub y volver a correrlo tras el push.
- [x] **0.2** Envío real de correo verificado 2026-11-22 (BOLO 1.1): `EMAIL_PROVIDER=smtp` con Gmail, `APP_URL=http://localhost:5173`, probado desde `/recuperar`; el correo llegó y el enlace abrió `/restablecer?token=...`. Requisito: `EMAIL_FROM` = `EMAIL_SMTP_USER` (o alias verificado). Credenciales solo en `.env` (gitignored). Archivos: `backend/src/services/email.service.ts`, `backend/src/modules/auth/recuperacion.service.ts`.
- [x] **0.3** Borrar `tmp_icons3.txt` (BOLO 3.5). Ya no existe: `git status` lo marca como `D`.
- [x] **0.4** Regenerar el grafo con `/graphify` — el actual está desactualizado (BOLO 3.2). Regenerado el 2026-11-22 desde el commit `c884c2ed` (HEAD actual): `graphify-out/GRAPH_REPORT.md`.
- [x] **0.5** Confirmar el rename `docs/COSAS_QUE_FALTAN_BOLO.md` → `docs/COSAS_QUE_FALTAN.md` antes de commitear (hoy: viejo borrado, nuevo sin trackear). Confirmado: `git status` lo muestra como `R` (rename stageado).

**Verificación local 2026-11-22:** `npm run lint` y `npm test` (backend 363, ai-services 161 + 1 omitido,
frontend 195) pasan; tras Fase 1.1 el backend quedó en 366 y tras Fase 2.1 el frontend en 199. Los typechecks pasan después de `npx prisma generate` en `backend` (el cliente
generado estaba desactualizado y tiraba ~50 errores de tipos). E2E no corrido: requiere el stack levantado.

## Fase 1 — Seguridad (antes de la defensa)

> **Contrato 1.1 (2026-11-22):** al dar de baja, `admin.service` escribe el `usuario_id` en una denylist
> con TTL igual a `ACCESS_TOKEN_TTL_SECONDS` (900 s por defecto). `requireAuth` rechaza cualquier access
> token cuyo `sub` esté en la denylist; reactivar lo saca. No se consulta la BD por request (evita tocar los
> ~30 mocks de prisma de los tests) y el TTL cubre exactamente la vida del token. La caché es en proceso:
> con varias réplicas del backend habría que moverla a Redis/DB (no hay cliente Redis en el backend hoy).

- [x] **1.1** Revocar el acceso al desactivar un usuario (BOLO 2.1). Implementado con la denylist de caché del contrato: `backend/src/config/cache.ts` (TTL = `ACCESS_TOKEN_TTL_SECONDS`), chequeada en `backend/src/middlewares/auth.ts:36` y escrita/borrada desde `actualizarEstado()` en `backend/src/modules/admin/admin.service.ts:129`. `expiresIn` dejó de estar hardcodeado. Tests en `backend/src/tests/seguridad-archivos-sesiones.test.ts` (backend: 366). Limitación: una sola réplica del backend; con varias, mover la denylist a Redis/DB.
- [ ] **1.2** URLs firmadas y temporales para archivos (BOLO 2.3): `backend/src/config/storage.ts` y las rutas `/uploads`. Solo si se pasa a R2/S3 real; si no, posponer.

## Fase 2 — Bugs visibles en demo (mayor retorno)

> **Contrato 2.1 (2026-11-22):** `BrandLogo` recibe `src` (URL absoluta o ruta `/uploads/...`, resuelta con
> `apiUrl`), `alt`, `className` (solo tamaño/espaciado/borde) y `fallback?`. Sin `src`, o si la imagen falla
> (`onError`), muestra una marca por defecto con `role="img"` y el mismo `alt`, sin romper el layout. El
> componente es puro: no lee contextos ni hace requests. Se usa en Login, Sidebar y Ajustes de administrador.

- [x] **2.1** Fallback de logo resuelto 2026-11-22 (BOLO 3.1). `frontend/src/components/ui/BrandLogo.tsx` resuelve la URL con `apiUrl` y cae a una marca por defecto (`role="img"`, mismo `alt`) cuando no hay `src` o falla `onError`. Usado en Login, Sidebar y Ajustes. Tests en `frontend/src/tests/branding-context.test.tsx` (4 nuevos; frontend: 199).
- [ ] **2.2** Chat del tutor docente (BOLO 6): persistir la conversación siguiendo `frontend/src/hooks/useTutorChat.ts:23-128`, avisar al cambiar de pestaña y agregar selector de material (`content_ids`). Cadena a tocar: `frontend/src/services/teacherAI.service.ts` → `backend/src/modules/asistente/asistente.service.ts:14-47` → `ai-services/src/use_cases/generar_material.py:24-41`. Reutilizar el selector de `frontend/src/components/teacher/ClassMaterialModal.tsx:13-113`.
- [ ] **2.3** Editor de nota en popup (BOLO 6): reemplazar el formulario en línea de `frontend/src/pages/teacher/TeacherGradesPage.tsx:176-289` por `frontend/src/components/ui/Modal.tsx`.
- [ ] **2.4** «Editar» en clases → Planificación (BOLO 6): redirigir a `/teacher/planning?course=...` desde `frontend/src/pages/teacher/TeacherContentPage.tsx:389-429` (patrón existente en `:237-245`), sin cambiar la distribución actual.
- [ ] **2.5** Botón de eliminar contenido a mano (BOLO 6): agregarlo en `frontend/src/components/teacher/MaterialRow.tsx:9-59`; el endpoint ya existe en `backend/src/modules/contenidos/contenidos.routes.ts:78-83`, falta el cliente en `frontend/src/services/content.service.ts` y el hook en `frontend/src/hooks/useContent.ts:65`.
- [ ] **2.6** Problemas visuales (BOLO 6): contención horizontal/alto en `frontend/src/components/layout/AppShell.tsx:7-13`; scroll anidado de «Aula virtual» en `frontend/src/pages/student/StudentCourseDetailPage.tsx:138-212`; sidebar colapsable (`Sidebar.tsx:29`) con botón en `frontend/src/components/layout/Header.tsx:19-41`.

## Fase 3 — Calidad

- [ ] **3.1** CI con migraciones y E2E (BOLO 3.3): job con Postgres + pgvector que corra `prisma migrate deploy` y, si se puede, un E2E sin IA.
- [ ] **3.2** Cobertura fina del frontend (BOLO 3.4): hoy hay prueba de humo de las 30 rutas; agregar tests de comportamiento a las pantallas sin ellos.

## Fase 4 — Post-defensa / opcional

- [ ] **4.1** `npm audit`: upgrades mayores `zod` 4 y `react-router` 7 en rama aparte; revisar el aviso `prisma → @prisma/config → effect` (BOLO 2.2). No hacerlo justo antes de una demo.
- [ ] **4.2** Deploy cloud solo si se presenta online (`docs/DEPLOY.md`); sigue sin definir Postgres + pgvector y la región del `ai-service` (BOLO 4.1).
- [ ] **4.3** Prueba de integración contra un bucket R2 real (BOLO 4.2).
- [ ] **4.4** Recuperación para quien no tiene acceso a su correo (BOLO 4.3).
- [ ] **4.5** Latencia del tutor: declarar la mediana de 6,84 s (objetivo <3 s, no cumple) o volver a medir con plan pago. La causa es la variabilidad de Gemini free, no un bug del sistema (BOLO 5).

---

## Verificación después de cada fase

```bash
npm run lint
npm test
npm run typecheck --workspace backend
npm run typecheck --workspace frontend
npm run e2e        # requiere el stack levantado
```

## Reglas del proyecto (no romper nada)

1. Las capas solo se hablan con las adyacentes: frontend → backend → ai-service.
2. Todo error de negocio es `AppError` (`backend/src/middlewares/error.ts:5`); nunca otra clase ni un string suelto.
3. Todo endpoint con `materiaId` valida la asignación del profesor con `obtenerProfesorAsignado()` (defensa contra IDOR).
4. Ningún valor hardcodeado: toda configuración viene de `env` validado con zod.
5. Si cambia una interfaz en `ai-services`, se actualiza el fake en `ai-services/src/tests/fakes.py`.
6. Contrato primero: definir el shape de entrada/salida (Zod + Pydantic + `aiClient.ts`) antes de codear.

## Recomendación de arranque

Empezar por **Fase 0** (bajo riesgo, desbloquea la entrega) y seguir con **Fase 1.1** (seguridad). Las tareas visuales de la Fase 2 se pueden hacer en paralelo porque no tocan contratos entre servicios.
