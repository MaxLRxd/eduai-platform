# Endpoints de la API

> Generado automáticamente desde `backend/src/**/*.routes.ts` con `npm run docs:api`. No editar a mano.

Total: **110 endpoints** en 18 módulos.

**Acceso:** *Público* no pide sesión; *Autenticado* cualquier rol con sesión; los demás exigen ese rol.
**Validación:** esquema Zod que valida el cuerpo antes de llegar al controlador. **Límite:** limitador de intentos.

## Autenticación

| Método | Ruta | Acceso | Validación | Límite |
| --- | --- | --- | --- | --- |
| POST | `/api/auth/register` | Público | `registerSchema` | sí |
| POST | `/api/auth/login` | Público | `loginSchema` | sí |
| POST | `/api/auth/refresh` | Público |  |  |
| POST | `/api/auth/logout` | Público |  |  |
| GET | `/api/auth/me` | Autenticado |  |  |
| POST | `/api/auth/password` | Autenticado | `cambiarPasswordSchema` | sí |

## Materias e inscripción

| Método | Ruta | Acceso | Validación | Límite |
| --- | --- | --- | --- | --- |
| POST | `/api/materias` | PROFESOR | `createMateriaSchema` |  |
| GET | `/api/materias/mias` | Autenticado |  |  |
| POST | `/api/materias/unirse` | ALUMNO | `unirseSchema` |  |
| POST | `/api/materias/:id/claves` | PROFESOR | `crearClaveSchema` |  |
| GET | `/api/materias/:id/inscriptos` | Autenticado |  |  |
| GET | `/api/materias/:id/alumnos/:alumnoId/perfil` | PROFESOR |  |  |
| GET | `/api/materias/:id` | Autenticado |  |  |

## Notas

| Método | Ruta | Acceso | Validación | Límite |
| --- | --- | --- | --- | --- |
| GET | `/api/materias/:materiaId/notas` | Autenticado |  |  |
| POST | `/api/materias/:materiaId/notas` | PROFESOR | `crearNotaSchema` |  |
| GET | `/api/notas/mias` | Autenticado |  |  |
| PUT | `/api/notas/:notaId` | PROFESOR | `actualizarNotaSchema` |  |

## Asistencia

| Método | Ruta | Acceso | Validación | Límite |
| --- | --- | --- | --- | --- |
| GET | `/api/materias/:materiaId/asistencias` | Autenticado |  |  |
| POST | `/api/materias/:materiaId/asistencias` | PROFESOR | `registraAsistenciaSchema` |  |
| GET | `/api/asistencias/mias` | Autenticado |  |  |
| PUT | `/api/asistencias/:asistenciaId` | PROFESOR | `actualizarAsistenciaSchema` |  |

## Actividades, entregas y rúbricas

| Método | Ruta | Acceso | Validación | Límite |
| --- | --- | --- | --- | --- |
| GET | `/api/materias/:materiaId/actividades` | Autenticado |  |  |
| POST | `/api/materias/:materiaId/actividades` | PROFESOR | `crearActividadSchema` |  |
| PUT | `/api/actividades/:actividadId` | PROFESOR | `actualizarActividadSchema` |  |
| DELETE | `/api/actividades/:actividadId` | PROFESOR |  |  |
| GET | `/api/actividades/:actividadId/entregas` | PROFESOR |  |  |
| GET | `/api/actividades/:actividadId/entregas/pendientes` | PROFESOR |  |  |
| GET | `/api/entregas/pendientes` | PROFESOR |  |  |
| POST | `/api/actividades/:actividadId/entrega` | ALUMNO | `enviarEntregaSchema` |  |
| PUT | `/api/actividades/:actividadId/entrega` | ALUMNO | `enviarEntregaSchema` |  |
| POST | `/api/actividades/:actividadId/entrega/archivo` | ALUMNO |  |  |
| PATCH | `/api/entregas/:entregaId/correccion` | PROFESOR | `corregirEntregaSchema` |  |
| POST | `/api/entregas/:entregaId/feedback-visto` | ALUMNO |  |  |
| POST | `/api/entregas/:entregaId/corregir-ia` | PROFESOR |  |  |
| GET | `/api/materias/:materiaId/rubricas` | PROFESOR |  |  |
| POST | `/api/materias/:materiaId/rubricas` | PROFESOR | `crearRubricaSchema` |  |
| PUT | `/api/rubricas/:rubricaId` | PROFESOR | `actualizarRubricaSchema` |  |
| DELETE | `/api/rubricas/:rubricaId` | PROFESOR |  |  |

## Secciones

| Método | Ruta | Acceso | Validación | Límite |
| --- | --- | --- | --- | --- |
| GET | `/api/materias/:materiaId/secciones` | Autenticado |  |  |
| POST | `/api/materias/:materiaId/secciones` | PROFESOR | `crearSeccionSchema` |  |
| PUT | `/api/secciones/:seccionId` | PROFESOR | `actualizarSeccionSchema` |  |
| DELETE | `/api/secciones/:seccionId` | PROFESOR |  |  |

## Contenidos y accesos

| Método | Ruta | Acceso | Validación | Límite |
| --- | --- | --- | --- | --- |
| POST | `/api/contenidos/:contenidoId/acceso` | ALUMNO |  |  |
| GET | `/api/materias/:materiaId/accesos` | PROFESOR |  |  |
| GET | `/api/secciones/:seccionId/contenidos` | Autenticado |  |  |
| POST | `/api/secciones/:seccionId/contenidos` | PROFESOR | `crearContenidoSchema` |  |
| POST | `/api/secciones/:seccionId/contenidos/archivo` | PROFESOR |  |  |
| PUT | `/api/contenidos/:contenidoId` | PROFESOR | `actualizarContenidoSchema` |  |
| DELETE | `/api/contenidos/:contenidoId` | PROFESOR |  |  |

## Notificaciones

| Método | Ruta | Acceso | Validación | Límite |
| --- | --- | --- | --- | --- |
| GET | `/api/notificaciones` | Autenticado |  |  |
| GET | `/api/notificaciones/no-leidas` | Autenticado |  |  |
| PATCH | `/api/notificaciones/leer-todas` | Autenticado |  |  |
| PATCH | `/api/notificaciones/:notificacionId/leida` | Autenticado |  |  |

## Tutor IA

| Método | Ruta | Acceso | Validación | Límite |
| --- | --- | --- | --- | --- |
| POST | `/api/materias/:materiaId/tutor/sesiones` | ALUMNO | `crearSesionSchema` |  |
| POST | `/api/materias/:materiaId/tutor/resumen` | ALUMNO | `resumenSchema` |  |
| POST | `/api/materias/:materiaId/tutor/resumen/pdf` | ALUMNO | `resumenPdfSchema` |  |
| POST | `/api/materias/:materiaId/tutor/examen` | ALUMNO | `examenSchema` |  |
| POST | `/api/materias/:materiaId/tutor/examen/corregir` | ALUMNO | `corregirExamenSchema` |  |
| GET | `/api/materias/:materiaId/tutor/simulacros` | ALUMNO |  |  |
| GET | `/api/materias/:materiaId/tutor/latencia` | PROFESOR |  |  |
| GET | `/api/admin/tutor/latencia` | ADMIN |  |  |
| GET | `/api/tutor/sesiones` | ALUMNO |  |  |
| GET | `/api/tutor/sesiones/:sesionId/mensajes` | ALUMNO |  |  |
| POST | `/api/tutor/sesiones/:sesionId/mensajes` | ALUMNO | `enviarMensajeSchema` |  |
| POST | `/api/tutor/sesiones/:sesionId/stream` | ALUMNO | `enviarMensajeSchema` |  |

## Analytics

| Método | Ruta | Acceso | Validación | Límite |
| --- | --- | --- | --- | --- |
| GET | `/api/analytics/progreso` | Autenticado |  |  |
| GET | `/api/materias/:materiaId/analytics/comprension` | PROFESOR |  |  |
| GET | `/api/materias/:materiaId/analytics/riesgo` | PROFESOR |  |  |
| GET | `/api/materias/:materiaId/analytics/dudas` | PROFESOR |  |  |
| GET | `/api/materias/:materiaId/preguntas-frecuentes` | Autenticado |  |  |
| POST | `/api/materias/:materiaId/preguntas-frecuentes` | PROFESOR | `crearPreguntaFrecuenteSchema` |  |
| PUT | `/api/preguntas-frecuentes/:preguntaId` | PROFESOR | `actualizarPreguntaFrecuenteSchema` |  |
| DELETE | `/api/preguntas-frecuentes/:preguntaId` | PROFESOR |  |  |

## Administración

| Método | Ruta | Acceso | Validación | Límite |
| --- | --- | --- | --- | --- |
| GET | `/api/admin/users` | ADMIN |  |  |
| POST | `/api/admin/users` | ADMIN | `crearUsuarioSchema` |  |
| PATCH | `/api/admin/users/:usuarioId/estado` | ADMIN | `actualizarEstadoSchema` |  |
| PATCH | `/api/admin/users/:usuarioId/rol` | ADMIN | `cambiarRolSchema` |  |
| GET | `/api/admin/materias` | ADMIN |  |  |
| POST | `/api/admin/materias` | ADMIN | `crearMateriaAdminSchema` |  |
| PUT | `/api/admin/materias/:materiaId` | ADMIN | `actualizarMateriaAdminSchema` |  |
| POST | `/api/admin/materias/:materiaId/profesores` | ADMIN | `asignarProfesorSchema` |  |
| DELETE | `/api/admin/materias/:materiaId/inscripciones/:alumnoId` | ADMIN |  |  |
| DELETE | `/api/admin/materias/:materiaId/inscripciones` | ADMIN |  |  |
| GET | `/api/admin/metricas-exito` | ADMIN |  |  |
| GET | `/api/admin/enrollment-keys` | ADMIN |  |  |
| POST | `/api/admin/enrollment-keys` | ADMIN | `generarClaveAdminSchema` |  |
| PATCH | `/api/admin/enrollment-keys/:claveId/revocar` | ADMIN |  |  |
| GET | `/api/admin/reports` | ADMIN |  |  |
| GET | `/api/admin/reports/:type/export` | ADMIN |  |  |
| GET | `/api/admin/license` | ADMIN |  |  |

## Corrección IA (alternativa)

| Método | Ruta | Acceso | Validación | Límite |
| --- | --- | --- | --- | --- |
| GET | `/api/entregas/:entregaId/correccion-ia` | PROFESOR |  |  |

## Asistente docente

| Método | Ruta | Acceso | Validación | Límite |
| --- | --- | --- | --- | --- |
| POST | `/api/asistente/generar` | PROFESOR | `generarMaterialSchema` |  |
| POST | `/api/asistente/pdf` | PROFESOR | `materialPdfSchema` |  |

## Dashboards

| Método | Ruta | Acceso | Validación | Límite |
| --- | --- | --- | --- | --- |
| GET | `/api/dashboard` | Autenticado |  |  |
| GET | `/api/dashboard/alumno` | Autenticado |  |  |
| GET | `/api/dashboard/profesor` | Autenticado |  |  |

## Planificación

| Método | Ruta | Acceso | Validación | Límite |
| --- | --- | --- | --- | --- |
| GET | `/api/materias/:materiaId/planning` | Autenticado |  |  |
| PUT | `/api/materias/:materiaId/planning/:fecha` | PROFESOR | `upsertPlanningSchema` |  |
| POST | `/api/materias/:materiaId/planning/:fecha/material` | PROFESOR |  |  |
| DELETE | `/api/materias/:materiaId/planning/:fecha/material` | PROFESOR |  |  |

## Mensajes

| Método | Ruta | Acceso | Validación | Límite |
| --- | --- | --- | --- | --- |
| GET | `/api/messages` | Autenticado |  |  |
| GET | `/api/messages/historial` | Autenticado |  |  |
| POST | `/api/messages` | Autenticado | `enviarMensajeSchema` |  |
| POST | `/api/messages/broadcast` | PROFESOR | `broadcastSchema` |  |

## Configuración e institución

| Método | Ruta | Acceso | Validación | Límite |
| --- | --- | --- | --- | --- |
| GET | `/api/config/branding` | Público |  |  |
| GET | `/api/admin/branding` | ADMIN |  |  |
| GET | `/api/admin/branding/presets` | ADMIN |  |  |
| POST | `/api/admin/branding/logo` | ADMIN |  |  |
| PUT | `/api/admin/branding` | ADMIN | `brandingSchema` |  |

## Salud

| Método | Ruta | Acceso | Validación | Límite |
| --- | --- | --- | --- | --- |
| GET | `/api/healthz` | Público |  |  |
