# Cosas que faltan (BOLO)

Lista de lo pendiente al **2026-11-20**. Todo lo de «Qué falta» de `AVANCE.md` está cerrado salvo los
opcionales. Lo de abajo es lo que quedó fuera, ordenado de más a menos importante para una defensa.

Tests al cierre: backend 363 · frontend 195 · ai-services 161 (+1 omitido) · E2E 44.

---

## 1. Para cerrar lo último que se hizo

### 1.1 Probar el envío real del correo (recuperación de contraseña)
- **Estado:** el flujo está probado de punta a punta en el stack real, pero con `EMAIL_PROVIDER=none`: el
  enlace sale en el log del backend (solo en desarrollo). **Nunca se mandó un correo de verdad.**
- **Qué falta:** configurar un proveedor (`resend`, `brevo` o `smtp`) con `EMAIL_FROM` (y `EMAIL_API_KEY` o los
  datos SMTP) y `APP_URL` (URL pública del frontend), pedir un enlace y comprobar que llega y que el enlace
  abre `/restablecer`.
- **Riesgo si no se hace:** en producción, sin proveedor, el pedido responde bien pero no llega nada
  (queda un error en el log).
- **Dónde:** `backend/src/modules/auth/recuperacion.service.ts`, `backend/src/services/email.service.ts`,
  `.env.example`.

### 1.2 Ver el CI corriendo en GitHub
- **Estado:** el CI estaba en rojo sin que se viera (faltaba `npx prisma generate` y había líneas largas en
  Python). Se corrigió y se verificó en un **clon limpio**, pero no se vio correr en GitHub.
- **Qué falta:** después del push, confirmar que los tres jobs (backend, frontend, ai-service) queden verdes.
- **Dónde:** `.github/workflows/ci.yml`.

---

## 2. Seguridad

### 2.1 Revocar el acceso al desactivar un usuario
- **Problema:** al dar de baja a un usuario se revocan sus sesiones (refresh), pero su **token de acceso
  sigue sirviendo hasta que vence**.
- **Idea:** que el middleware de autenticación verifique que la cuenta siga activa (con caché corta), o
  acortar la vida del token de acceso.

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
- La base tiene una URL de logo de ejemplo que no carga. Falta un **fallback** en el frontend (mostrar el
  logo por defecto si la imagen falla).

### 3.2 `graphify-out/` desactualizado
- El grafo del código es del 30/10. Regenerarlo con `/graphify` si se va a usar para consultas.

### 3.3 El CI no cubre migraciones ni E2E
- Los E2E necesitan el stack levantado y las migraciones no se verifican en CI.
- **Idea:** un job con Postgres (pgvector) que corra `prisma migrate deploy` y, si se puede, un E2E sin IA.

### 3.4 Cobertura fina del frontend
- Hay una prueba de humo de las 30 rutas, pero varias pantallas no tienen tests de comportamiento.

### 3.5 Archivo basura en la raíz
- `tmp_icons3.txt` (lista de íconos en UTF-16, sin referencias). Se puede borrar.

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

## Ya resuelto (para no repetirlo)
CI y lint · reintento del 503 de Gemini en streaming · Pinecone sin bloquear el event loop · limpieza de
vectores huérfanos y reindexado (`rag:reindex --huerfanos|--limpiar`) · base de demo con material real
(`demo:reset`) · E2E del OCR de PDF escaneado y de la exportación de reportes · prueba de humo de todas las
páginas · recuperación de contraseña por correo.
