# Análisis de bugs y faltantes - Causas detectadas

## 1) Alumno: sin botón/click para acceder al pdf/material
- Causa: En `frontend/src/pages/student/StudentCourseDetailPage.tsx` los ítems de unidades se muestran estáticamente sin enlaces. El panel "Material usado por la IA" solo renderiza `course.materiales` con título y estado RAG, sin URL/acción para abrir/descargar. Falta exponer URLs de materiales y agregar botón/enlace en UI.

## 2) Alumno: "Mis estadísticas" completamente mockapeado
- Causa: `frontend/src/pages/student/StudentProgressPage.tsx` consume `useProgress()` que llama a `frontend/src/services/progress.service.ts` -> `getProgreso()` hacia `GET /api/analytics/progreso`. Ese endpoint existe en backend (`backend/src/modules/analytics/analytics.controller.ts` y `analytics.service.ts` con `progresoAlumno`). Si los datos aparecen mockeados es por datos vacíos o por transformaciones. Revisar datos reales en BD / respuesta API; también `StudentDashboardPage` usa `useDashboard` + `getDashboardAlumno()` hacia `/api/dashboard/alumno`. Puede haber fallback/placeholder en UI o datos incompletos.

## 3) Profesor: "ver perfil" en Mis alumnos mockapeado
- Causa: En `frontend/src/pages/teacher/TeacherStudentsPage.tsx` el botón "Ver perfil" no tiene `onClick`/navegación. Solo es un botón estático. Falta implementar navegación al perfil del alumno o modal con datos.

## 4) Profesor: "Mensaje individual" no trae estudiantes / no envía correctamente
- Causa: `TeacherMessagesPage` usa `useContacts()` que llama `getAlumnosContactos()` en `messages.service.ts`. Ese método construye la lista agregando alumnos desde `GET /api/materias/mias` y luego `GET /api/materias/:id/notas` para cada materia, acumulando en un `Map` (deduplicados). Si el profesor no tiene materias asignadas o las notas no traen estructura `alumno`, el listado queda vacío. También revisión de permisos/rutas.

## 5) Profesor: promedio/asistencia en perfil
- Causa: `frontend/src/pages/teacher/TeacherProfilePage.tsx` muestra valores hardcodeados (`SUMMARY` con "Promedio clase": "8.3", avatar con iniciales, tags). No consume datos del profesor/dashboard; es puramente estático.

## 6) Profesor: "Contenidos" debe traer todos los documentos subidos (también de clases) con referencia a materia
- Causa: `TeacherContentPage` filtra por `seccionId` (`useUploadedMaterials(activeSection)`) y carga materiales solo de la sección activa. Para mostrar "todos los documentos subidos" globalmente por profesor/filtros por materia, hace falta agregar endpoint/consulta que agregue materiales por materia (no solo por sección) y UI para agruparlos con referencia a materia.

## 7) Profesor: "Secciones de la materia" - anidar clase creada / reubicar "Agregar texto o consigna"
- Causa: `TeacherContentPage` maneja secciones por separado (crear/eliminar sección) y subida de archivo en card "Subir archivo", "Agregar texto o consigna" en card separado. Lógica actual no permite anidar una clase dentro de sección ni agrupar las opciones de agregar contenido. Requiere modelo de datos/UX distinto (secciones con subitems/clases).

## 8) Profesor: "Material para estudiantes" - opción elegir material ya subido o subir nuevo
- Causa: En flujo de actividades/clases, la UI actual parece ofrecer solo subir archivo. Falta selector para "materiales ya cargados" (desde contenidos/global) además de subir archivo nuevo. Revisar `TeacherActivitiesPage` / hooks relacionados con asignación de materiales.

## 9) Admin: "editar" materia mockapeado
- Causa: `AdminMateriasPage` llama `useSaveAdminSubject()` que usa `saveAdminSubject()` en `adminSubjects.service.ts`. Para editar hace `PUT /api/admin/materias/:id` con body `{nombre, nivel_educativo, descripcion, activa}`; para crear `POST /api/admin/materias`. Backend tiene `actualizarMateria` en `admin.service.ts` que acepta esos campos. Posibles causas: validación en backend/schema rechaza, o form envía datos que no coinciden, o mensaje/error no se muestra. También `loadForEdit` no carga `nivelEducativo/descripcion/activa` correctamente del objeto completo.

## 10) Notificaciones mal mostradas
- Causa: Backend `listarMias` ordena por `creada_en desc` y filtra por usuario. Frontend `getNotificaciones` mapea a `{createdAt: n.creada_en,...}` y muestra todas. `getNoLeidasCount` usa endpoint separado `/api/notificaciones/no-leidas`. En Header se muestra count; en NotificacionesPage se lista todo. Posible issue: mapeo/orden, o UI muestra solo una entrada por bug en render, o contador y lista no sincronizados. Revisar componente NotificacionesPage y uso de queries.

## 11) Web no responsive / menú hamburguesa
- Causa: Layout usa `Sidebar` fijo/ancho con `w-sidebar`, `Header` fijo. No hay lógica de responsive/hamburguesa en `AppShell.tsx`/`Header.tsx`. Falta estado para ocultar/mostrar sidebar en móvil.

## 12) Eliminar todos los emojis del sistema
- Causa: Hay emojis hardcodeados en múltiples archivos (LoginPage 🎓, StudentDashboardPage 👋🎉, StudentCourseDetailPage 📚🤖, StudentProgressPage 📊📅✅🏆📋📅, TeacherContentPage 📄📊📝🗒️🖼️🎬🤖⏳🧩📎✏️📢, TeacherMessagesPage ✉️📣📚🧑🏫, TeacherStudentsPage 📚, TeacherProfilePage, etc.). Hay que reemplazarlos por íconos SVG del sistema (`Icon` component) o similares.

## 13) Login muestra emoji, debe usar icono de personalización del admin
- Causa: `LoginPage.tsx` línea ~33 usa `<span className="text-2xl">🎓</span>` hardcodeado. Debe obtener logo/branding desde contexto/servicio de configuración (similar a Sidebar que usa `useBranding()`). Existe `BrandingContext` y `getConfigBranding`; login necesita consumirlo para mostrar logo personalizado.

## 14) Historial de chat con agente de IA no programado, para ningun usuario.

## Plan de acción detallado

### 1) Alumno: acceder a pdf/material
- [ ] **Frontend**: En `StudentCourseDetailPage.tsx` añadir enlace/botón en items de unidades si hay material asociado (o desde `course.materiales`). Si `course.materiales` trae `url`, renderizar link con `target="_blank"`. Si no, agregar acción para abrir modal con lista de materiales.
- [ ] **Datos**: Verificar shape de `Course`/materiales en tipos/hooks. Asegurar que backend incluya URLs de archivos subidos.
- [ ] **Backend**: Revisar endpoints que devuelven curso/materias del alumno para incluir `materiales` con `url`, `id`, `titulo`.

### 2) "Mis estadísticas" mockapeado
- [ ] **Verificar API**: Probar `GET /api/analytics/progreso` (auth alumno). Revisar respuesta vs lo que espera `progress.service.ts`.
- [ ] **Verificar dashboard**: Probar `GET /api/dashboard/alumno`. Comparar con `useDashboard` + `StudentDashboardPage`.
- [ ] **Frontend**: Eliminar fallbacks/mock si existen. Asegurar mapeo correcto (promedios, asistencia, calificaciones, registro).
- [ ] **Backend**: En `analytics.service.ts:progresoAlumno` revisar filtros por alumno inscrito, cálculo de promedios/asistencia.

### 3) Profesor: "Ver perfil" en Mis alumnos
- [ ] **Frontend**: En `TeacherStudentsPage.tsx` agregar `onClick={() => navigate(\`/teacher/students/:legajo\` or modal)}`. Crear ruta/modal para ver perfil del alumno con sus datos.
- [ ] **Hook/servicio**: Añadir consulta si no existe (o reutilizar datos ya cargados).

### 4) Profesor: Mensaje individual no trae estudiantes
- [ ] **Revisar**: `getAlumnosContactos()` en `messages.service.ts` - depende de `/api/materias/mias` y `/api/materias/:id/notas`. Verificar que `notas` retorne lista con `alumno: {id,nombre,email}`.
- [ ] **Backend**: Verificar endpoints de materias/notas para docente - permisos y estructura.
- [ ] **Fallback**: Si falla, obtener alumnos desde inscripciones/materias del profesor directamente.

### 5) Profesor: promedio/asistencia en perfil
- [ ] **Frontend**: Reemplazar valores hardcodeados en `TeacherProfilePage.tsx` con datos reales (desde dashboard/progreso del docente o resumen).
- [ ] **Hook**: Crear/usar hook para datos del docente (estadísticas). Conectar a API correspondiente.

### 6) Contenidos: traer todos los documentos con referencia a materia
- [ ] **Backend**: Añadir endpoint para listar materiales por profesor (agregando todos los de sus materias/secciones) con `materia_id/nombre`.
- [ ] **Frontend**: En `TeacherContentPage` agregar vista/filtro "Todos los materiales" agrupados por materia. O extender `useUploadedMaterials` para modo global.
- [ ] **Tipos**: Añadir `materia`/`materiaNombre` a `UploadedMaterial`.

### 7) Secciones: anidar clase creada / mover "Agregar texto o consigna"
- [ ] **Modelo/UX**: Reestructurar UI - permitir anidar contenido (clase) dentro de sección, o convertir "sección" para aceptar items. Mover opciones "Subir archivo" y "Agregar texto o consigna" al mismo bloque/contexto por sección.
- [ ] **Backend**: Si se requiere jerarquía (sección > clase > material), evaluar cambios en modelos `seccion`/`material`/`contenido`. Ajustar endpoints si necesario.

### 8) Material para estudiantes: elegir ya subido o subir nuevo
- [ ] **Frontend**: En flujo de actividades (crear/editar actividad) agregar selector "Material existente" (desde contenidos del profesor/materia) y opción "Subir nuevo archivo".
- [ ] **Hook/servicio**: Consumir materiales ya cargados.
- [ ] **Backend**: Permitir asociar material existente a actividad; mantener subida nueva.

### 9) Admin: editar materia
- [ ] **Debug**: Verificar `loadForEdit` - actualmente setea `nivelEducativo: existing?.estado === "Pendiente" ? "" : form.nivelEducativo` (bug lógico). Debe cargar desde `existing`.
- [ ] **Datos**: En `getAdminSubjects()` convertir correctamente todos los campos; asegurar `toAdminSubject` conserva info necesaria o cargar objeto completo.
- [ ] **Validación**: Revisar `admin.schemas.ts` para PUT materia (campos requeridos). Backend `actualizarMateria` acepta campos opcionales - verificar qué espera.
- [ ] **UI/feedback**: Mostrar errores en `onError` de `save.mutate`.

### 10) Notificaciones mal mostradas
- [ ] **Frontend**: Revisar `NotificacionesPage` - asegurar render completo (key, mapeo). Verificar que `useNotificaciones(false)` trae todas.
- [ ] **Sincronización**: Header usa `useNoLeidasCount()`, lista usa `useNotificaciones()`. Verificar invalidación de queries al marcar leída.
- [ ] **Backend**: Confirmar orden (`creada_en desc`). Revisar si hay paginación/limit escondiendo elementos.

### 11) Responsive + menú hamburguesa
- [ ] **Layout**: En `AppShell.tsx` agregar estado `sidebarOpen` (móvil). Sidebar ocultable con overlay.
- [ ] **Header**: Agregar botón hamburguesa que togglee sidebar.
- [ ] **CSS**: Usar clases responsive (hidden/md:flex). Añadir transición.
- [ ] **Componentes**: Ajustar anchos/scroll en móvil.

### 12) Eliminar emojis, usar íconos SVG
- [ ] **Inventario**: Reemplazar emojis en `LoginPage`, `StudentDashboardPage`, `StudentCourseDetailPage`, `StudentProgressPage`, `StudentAssignmentsPage`, `TeacherContentPage`, `TeacherMessagesPage`, `TeacherStudentsPage`, `TeacherProfilePage`, etc.
- [ ] **Componente Icon**: Usar `Icon` existente o agregar íconos necesarios. Reemplazar spans con emojis por `<Icon name=.../>`.
- [ ] **Limpieza**: Buscar y reemplazar sistemáticamente.

### 13) Login usar icono de personalización
- [ ] **LoginPage**: Importar `useBranding()`. Si hay `logoUrl`, mostrar `<img src={logoUrl} .../>`, sino fallback a ícono SVG. Eliminar emoji 🎓.
- [ ] **Context**: Asegurar que `BrandingContext` esté disponible en login (o cargar branding directamente).
- [ ] **Admin**: Verificar que sección de apariencia/personalización guarde `logo_url` correctamente.