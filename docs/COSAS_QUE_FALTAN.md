# Cosas que faltan (BOLO)

Lista de lo pendiente al **2026-11-20**. Todo lo de «Qué falta» de `AVANCE.md` está cerrado salvo los
opcionales. Lo de abajo es lo que quedó fuera, ordenado de más a menos importante para una defensa.

Tests al cierre: backend 363 · frontend 195 · ai-services 161 (+1 omitido) · E2E 44.

---

## 1. Para cerrar lo último que se hizo

### 1.1 Probar el envío real del correo (recuperación de contraseña)
- **Estado: RESUELTO 2026-11-22.** Configurado `EMAIL_PROVIDER=smtp` con Gmail (`smtp.gmail.com:587`,
  contraseña de aplicación de 16 caracteres) y `APP_URL=http://localhost:5173`. Probado desde el front en
  `/recuperar`: llegó el correo, el enlace abrió `/restablecer?token=...` y permitió cambiar la contraseña.
  El enlace vence en `RESET_TOKEN_MINUTES` (60 por defecto) y sirve una sola vez.
- **Detalle importante:** `EMAIL_FROM` debe coincidir con `EMAIL_SMTP_USER` (o ser un alias verificado de
  Gmail); si no, Gmail rechaza el envío.
- **Dónde:** `backend/src/services/email.service.ts`, `backend/src/modules/auth/recuperacion.service.ts`,
  `.env` (gitignored; la contraseña nunca se versiona).

### 1.2 Ver el CI corriendo en GitHub
- **Estado:** el CI estaba en rojo sin que se viera (faltaba `npx prisma generate` y había líneas largas en
  Python). Se corrigió y se verificó en un **clon limpio**, pero no se vio correr en GitHub.
- **Qué falta:** después del push, confirmar que los tres jobs (backend, frontend, ai-service) queden verdes.
- **Dónde:** `.github/workflows/ci.yml`.
- **Verificación 2026-11-22 (GitHub API):** el workflow `CI` está **`disabled_manually`** desde 2026-09-28,
  por eso no hay runs nuevos. El último run fue #36 (2026-09-27): `frontend` y `ai-service` verdes,
  `backend` rojo en `npm run typecheck` (los tests no llegaron a correr). Para cerrar: habilitar el workflow
  en GitHub → Actions → CI → *Enable workflow*, correrlo y confirmar los tres jobs verdes.
- **Local 2026-11-22:** lint y tests verdes (363 + 161 + 195); el typecheck del backend fallaba por un
  cliente Prisma desactualizado y pasó tras `cd backend && npx prisma generate`. El workflow ya incluye
  ese paso (verify en clon limpio), así que la causa del run #36 fue anterior a ese fix.

---

## 2. Seguridad

### 2.1 Revocar el acceso al desactivar un usuario
- **Problema:** al dar de baja a un usuario se revocan sus sesiones (refresh), pero su **token de acceso
  sigue sirviendo hasta que vence**.
- **Idea:** que el middleware de autenticación verifique que la cuenta siga activa (con caché corta), o
  acortar la vida del token de acceso.
- **Resuelto 2026-11-22:** dar de baja escribe el `usuario_id` en una denylist con TTL igual a la vida del
  access token (`ACCESS_TOKEN_TTL_SECONDS`, 900 s) y `requireAuth` responde 401 «Cuenta desactivada»;
  reactivar lo saca de la denylist. Con varias réplicas del backend habría que compartir esa caché.

### 2.2 Vulnerabilidades de `npm audit`
- Los arreglos necesitan **upgrades mayores con cambios incompatibles**: `zod` 4 y `react-router` 7.
- Hay además un aviso por `prisma → @prisma/config → effect` cuyo único «arreglo» propuesto es bajar de
  versión.
- **Recomendación:** hacerlo después de la defensa, con una rama aparte, no justo antes de una demo.

### 2.3 URLs firmadas para los archivos
- Hoy los archivos se sirven por rutas que dependen de la sesión. Con almacenamiento tipo R2/S3 convendría
  entregar URLs firmadas y temporales.

---

## 3. Pulido

### 3.1 Logo roto
- **Resuelto 2026-11-22:** `BrandLogo` (`frontend/src/components/ui/BrandLogo.tsx`) resuelve la URL con
  `apiUrl` y muestra la marca por defecto si no hay logo o si la imagen falla (`onError`). Se usa en login,
  sidebar y ajustes de administrador; cubierto por tests en `frontend/src/tests/branding-context.test.tsx`.

### 3.2 `graphify-out/` desactualizado
- El grafo del código es del 30/10. Regenerarlo con `/graphify` si se va a usar para consultas.
- **Resuelto 2026-11-22:** regenerado desde el commit `c884c2ed` (HEAD al 2026-11-22); ver
  `graphify-out/GRAPH_REPORT.md`.

### 3.3 El CI no cubre migraciones ni E2E
- Los E2E necesitan el stack levantado y las migraciones no se verifican en CI.
- **Idea:** un job con Postgres (pgvector) que corra `prisma migrate deploy` y, si se puede, un E2E sin IA.

### 3.4 Cobertura fina del frontend
- Hay una prueba de humo de las 30 rutas, pero varias pantallas no tienen tests de comportamiento.

### 3.5 Archivo basura en la raíz
- `tmp_icons3.txt` (lista de íconos en UTF-16, sin referencias). Se puede borrar.
- **Resuelto 2026-11-22:** archivo borrado (pendiente de incluir en el próximo commit).

---

## 4. Opcionales

### 4.1 Deploy (#1 de «Qué falta»)
- Solo si se presenta online. Las imágenes de producción ya se construyeron y se probaron con los E2E.

### 4.2 Integración real con R2 (#4)
- El cliente S3 está integrado y probado con simulaciones; falta una prueba contra un bucket real.

### 4.3 Recuperación para quien no tiene acceso a su correo
- Hoy el administrador le asigna una contraseña temporal. No hay otro canal.

---

## 5. Limitación declarada: latencia del tutor

- **Objetivo:** primera palabra en menos de 3 s.
- **Medido:** mediana de **6,84 s** → **no cumple**.
- **Causa:** variabilidad del plan gratuito de Gemini (no es un bug del sistema; la cadena de medición se
  verificó con un servicio simulado). El reintento del 503 ya cubre el primer fragmento del stream.
- **Qué hacer:** declararlo tal cual en la defensa, o volver a medir con un plan pago.

---

## 6. Bugs generales:
- visuales: pantallas que se salen de sus contenedores, se puede hacer desplegable el side-menu de la izquierda además; en "aula virtual" se puede scrollear hacia abajo hasta que la pagina desaparece.

## Ya resuelto (para no repetirlo)
CI y lint · reintento del 503 de Gemini en streaming · Pinecone sin bloquear el event loop · limpieza de
vectores huérfanos y reindexado (`rag:reindex --huerfanos|--limpiar`) · base de demo con material real
(`demo:reset`) · E2E del OCR de PDF escaneado y de la exportación de reportes · prueba de humo de todas las
páginas · recuperación de contraseña por correo · chat persistente del tutor docente con selector de materiales
y aviso al salir · indexación RAG desde Planificación (helper compartido + backfill `rag:reindex -- --planning`) · selector de materiales del Tutor IA rediseñado como modal amplio y clickeable (contenidos de sección/clase y adjuntos de Planificación, búsqueda, chips, estado RAG, apertura de archivo y fuentes visibles) · editor de nota en popup (Mis estudiantes → Calificaciones) · «Editar» de cada clase en Contenidos redirige a Planificación con la materia activa · botón «Eliminar» en cada fila de material (borra archivo y vector RAG).
