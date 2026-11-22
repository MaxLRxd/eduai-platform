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
- [ ] **0.2** Probar el envío real de correo: configurar `EMAIL_PROVIDER=resend|brevo|smtp` + `EMAIL_FROM` + `APP_URL`, pedir un enlace y comprobar que abre `/restablecer` (BOLO 1.1). **Bloqueado:** `.env` no contiene ninguna variable de correo; queda documentado como paso de entrega en `docs/COSAS_QUE_FALTAN.md` §1.1. Archivos: `backend/src/services/email.service.ts`, `backend/src/modules/auth/recuperacion.service.ts`, `.env.example`.
- [x] **0.3** Borrar `tmp_icons3.txt` (BOLO 3.5). Ya no existe: `git status` lo marca como `D`.
- [x] **0.4** Regenerar el grafo con `/graphify` — el actual está desactualizado (BOLO 3.2). Regenerado el 2026-11-22 desde el commit `c884c2ed` (HEAD actual): `graphify-out/GRAPH_REPORT.md`.
- [x] **0.5** Confirmar el rename `docs/COSAS_QUE_FALTAN_BOLO.md` → `docs/COSAS_QUE_FALTAN.md` antes de commitear (hoy: viejo borrado, nuevo sin trackear). Confirmado: `git status` lo muestra como `R` (rename stageado).

**Verificación local 2026-11-22:** `npm run lint` y `npm test` (backend 363, ai-services 161 + 1 omitido,
frontend 195) pasan; los typechecks pasan después de `npx prisma generate` en `backend` (el cliente
generado estaba desactualizado y tiraba ~50 errores de tipos). E2E no corrido: requiere el stack levantado.

## Fase 1 — Seguridad (antes de la defensa)

- [ ] **1.1** Revocar el acceso al desactivar un usuario (BOLO 2.1): verificar `usuario.activo` en `requireAuth()` con caché corta (~30-60 s) en Redis (`backend/src/config/cache.ts`) e invalidarla al desactivar en `backend/src/modules/admin/admin.service.ts:132`. Alternativa más simple: acortar `expiresIn` en `auth.ts:14`. Tests: `backend/src/tests/seguridad-archivos-sesiones.test.ts`.
- [ ] **1.2** URLs firmadas y temporales para archivos (BOLO 2.3): `backend/src/config/storage.ts` y las rutas `/uploads`. Solo si se pasa a R2/S3 real; si no, posponer.

## Fase 2 — Bugs visibles en demo (mayor retorno)

- [ ] **2.1** Fallback de logo (BOLO 3.1): extraer componente `BrandLogo` con `onError` y usarlo en `frontend/src/pages/LoginPage.tsx:35`, `frontend/src/components/layout/Sidebar.tsx:32` y `frontend/src/pages/admin/AdminSettingsPage.tsx:98`. Test: `frontend/src/tests/branding-context.test.tsx`.
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
