# Matriz de casos de uso vs. implementación

Estado de los **26 casos de uso** especificados en el Anexo B, contrastados con el código y las pruebas.
Las especificaciones están en la carpeta *Casos de Uso* de la documentación del proyecto.

**Resumen:** 22 casos completos y 4 parciales. Ningún caso quedó sin implementar. Las excepciones menores dentro de casos "completos" se listan en la columna *Observaciones*.

Referencias de la columna *Prueba*: `E2E` = `e2e/flujo-completo.e2e.mjs`; el resto son archivos de `backend/src/tests/`, `ai-services/src/tests/` o `frontend/src/tests/`.

Leyenda: ✅ completo · 🟡 parcial

---

## Módulo Alumno

| CU | Nombre | Estado | Dónde está | Prueba | Observaciones |
| --- | --- | --- | --- | --- | --- |
| A01 | Inscribirse a materia | ✅ | `materias.service.unirse` · `StudentEnrollPage` | `clave-usos`, E2E | Valida clave inexistente, revocada, vencida y sin cupo (reserva atómica). Si ya estaba inscripto avisa y lo lleva a la materia sin gastar un uso. Tras inscribirse lo redirige a la materia. La clave se depura en el cliente (espacios, mayúsculas). |
| A02 | Navegar contenido | ✅ | `contenidos.service` (`registrarAcceso`, `estadisticasDeAcceso`) · `MaterialItem` | `contenido-accesos`, E2E | Los textos se leen en la plataforma y los archivos se abren aparte; cada apertura se registra (sin duplicar recargas en 5 min) y el docente ve cuántos alumnos abrieron cada material. **No hay botón para reportar un archivo dañado** (A5A). |
| A03 | Entregar actividad | ✅ | `actividades.service.enviar` · `AssignmentSubmitModal` | `entrega-plazo`, `entrega-archivo`, `actividades-ciclo`, E2E | Cuatro tipos de entrega, validación de formatos, bloqueo pasada la fecha límite (A4), reemplazo mientras no se publique, aviso al docente y marca de tiempo. Sin rúbrica no hay corrección automática (A6). |
| A04 | Consultar Tutor IA | ✅ | `ask_tutor` (ai-service) · `tutor.service` · `useTutorChat` | `test_ask_tutor`, `test_depuracion_prompts`, `preguntas-frecuentes`, `tutor-chat` | RAG por materia, depuración, aviso si no hay información, historial, streaming. Pregunta frecuente reconocida (A5.1): responde con la respuesta que cargó el docente, sin llamar a la IA (solo en modo normal). Demora (A7): indicador de carga y, pasados 10 s, aviso con reintento. |
| A05 | Resumir documento | 🟡 | `resumir_documento` · `ResumenPanel` | `test_router`, `resumen-pdf` | Resume un material de texto de la materia o un texto pegado, y se descarga en **PDF**. **Pendiente (A1):** adjuntar un archivo propio al chat; la alternativa disponible es pegar su texto. |
| A06 | Pedir pistas | ✅ | modo *Pistas* de `ask_tutor` | `test_ask_tutor` | El tutor orienta sin dar la solución y se niega con amabilidad a resolver. |
| A07 | Explicación del error | ✅ | `AssignmentSubmitModal` · `actividades.service.marcarFeedbackRevisado` | `adopcion-metricas`, E2E | Muestra el feedback publicado (incluido el editado por el docente), "en revisión" si no está publicado, y registra que el alumno lo abrió. |
| A08 | Generar simulacro | ✅ | `examen` · `SimulacroPanel` | `test_router`, E2E | Preguntas variadas por dificultad, interactivo. Las respuestas no se guardan como borrador entre sesiones: se descarta o se corrige. |
| A09 | Modo estudio (socrático) | ✅ | modo *Socrático* de `ask_tutor` | `test_ask_tutor` | Pregunta y evalúa sin dar la respuesta directa; sin pregunta frecuente en este modo. |
| A10 | Estadísticas personales | ✅ | `dashboard.service.dashboardAlumno` · `StudentDashboardPage`, `StudentProgressPage` | `dashboard-alumno`, E2E | Promedio, asistencia, avance por materia y próximas entregas con datos reales; panel vacío con mensaje si no hay datos. |
| A11 | Corregir simulacro | ✅ | `corregir_simulacro` · `tutor.service.corregirSimulacro` · `SimulacroPanel` | `test_corregir_simulacro`, `simulacro-correccion`, E2E | Confirmación previa, aviso de preguntas sin responder con corrección parcial (A3), conserva las respuestas si la IA falla (A5), calificación y feedback por pregunta, historial. **No cubre (A2)** respuestas externas ni **(A4)** el aviso de material insuficiente. |

## Módulo Profesor

| CU | Nombre | Estado | Dónde está | Prueba | Observaciones |
| --- | --- | --- | --- | --- | --- |
| P01 | Crear y gestionar secciones | 🟡 | `secciones.service` · `TeacherContentPage` | `reglas-casos-de-uso`, E2E | Crear y eliminar desde la pantalla; rechaza nombres duplicados (E1). **Editar y reordenar** existen en la API (`PUT /api/secciones/:id`, campo `orden`) pero **la pantalla no los ofrece**. |
| P02 | Subir contenido | ✅ | `contenidos.service` · `TeacherContentPage` | `entrega-archivo`, `rag-indexer`, E2E | PDF, DOCX, PPTX, imágenes y texto hasta 50 MB; indexado automático en segundo plano para el tutor. |
| P03 | Definir espacio de entrega | ✅ | `actividades.service.crear` · `ActivityFormModal` | `reglas-casos-de-uso`, E2E | Cuatro tipos, formatos permitidos, rúbrica opcional (sin rúbrica = revisión manual), rechaza fecha límite en el pasado (E1). Más tarde el docente puede mover la fecha al pasado para cerrar la entrega. |
| P04 | Configurar rúbrica | ✅ | `actividades.service` (rúbricas) · `RubricFormModal` | `rubricas`, E2E | Los pesos deben sumar 100 %; advierte si la rúbrica está en uso. Cada criterio lleva "lo esperado" (usado por la IA). **No tiene niveles de desempeño** (Excelente/Bueno/…) configurables. |
| P05 | Gestionar correcciones | ✅ | `correccion` · `TeacherCorrectionsPage` | `rubricas`, `reglas-casos-de-uso`, E2E | La entrega llega con un borrador pre-generado: numérico automático para opción múltiple, por IA contra la rúbrica para el resto. El docente edita, hace override manual y publica; el alumno recibe el aviso. Si la IA falla, corrige a mano. |
| P06 | Registrar notas | ✅ | `notas` · `TeacherGradesPage` | E2E | Marca de edición para el historial. |
| P07 | Registrar asistencia | ✅ | `asistencias` · `TeacherAttendancePage` | E2E | Presente / ausente / tardanza; una clase ya cargada se edita en lugar de duplicarse. |
| P08 | Dashboard de la clase | 🟡 | `analytics` · `TeacherAnalyticsPage`; `perfil-alumno.service` · `TeacherStudentProfilePage` | `perfil-alumno`, E2E | Mapa de comprensión, alertas de riesgo y perfil individual del alumno (notas, asistencia, entregas, uso del tutor, simulacros). **Pendiente:** filtrar por período o unidad (solo se filtra por materia). |
| P09 | Dudas y errores frecuentes | 🟡 | `analytics` · `TeacherAnalyticsPage` | — (sin prueba automática propia) | Ranking de dudas y errores conceptuales. **Pendiente:** el detalle de preguntas al hacer clic en un tema. |
| P10 | Materiales de clase con IA | ✅ | `asistente` · `TeacherAIPage` | `material-pdf`, `tutor-tools`, E2E | Genera con el contexto de la materia y de la planificación, opción de incluir soluciones (FA1), edición del resultado, descarga en PDF y **publicación directa en una sección**. |

## Módulo Administrador

| CU | Nombre | Estado | Dónde está | Prueba | Observaciones |
| --- | --- | --- | --- | --- | --- |
| AD01 | Gestionar materias | ✅ | `admin.service` · `AdminMateriasPage`, `EnrolledStudentsPanel` | `materia-baja`, `admin-matricula-avisos`, `reglas-casos-de-uso`, E2E | Rechaza nombres duplicados (E1). La baja con alumnos inscriptos se bloquea (A3.1) y se resuelve **desmatriculando** uno por uno o a todos, con aviso al alumno y conservando su historial. |
| AD02 | Asignar profesores | ✅ | `admin.service.asignarProfesor` | `admin-matricula-avisos`, E2E | Un docente puede tener varias materias; rechaza duplicados (E1); desasignar quita el acceso; el docente recibe un aviso en ambos casos. |
| AD03 | Gestionar usuarios | ✅ | `admin.service` · `AdminUsuariosPage` | `admin-matricula-avisos`, `seguridad-archivos-sesiones`, E2E | Alta, cambio de rol y de tipo de docente, baja (cierra sus sesiones), correo duplicado (E1). El aviso de alta llega dentro de la plataforma **sin la contraseña** (por seguridad se entrega aparte). |
| AD04 | Claves de matriculación | ✅ | `admin.service` · `AdminClavesPage` | `clave-usos`, `reglas-casos-de-uso`, E2E | Vencimiento y cupo opcionales (E5: no admite vencimiento pasado), revocación, listado de inscriptos por clave; clave de una materia donde ya está inscripto (E6). |

## Módulo Sistema

| CU | Nombre | Estado | Dónde está | Prueba | Observaciones |
| --- | --- | --- | --- | --- | --- |
| SYS01 | Depurar prompt | ✅ | `prompt_sanitizer` (ai-service) | `test_depuracion_prompts`, `test_prompt_sanitizer`, E2E | Quita saludos, cortesías, muletillas y repeticiones; prompt vacío (A4) y solo saludo (A4.1) se responden sin consumir tokens; si el depurador falla usa el original (A5). Se aplica a tutor, asistente docente y respuestas de simulacro. |

---

## Métricas de éxito del proyecto

El objetivo general (sección 1.1) define cuatro métricas. Tres se calculan con datos reales en el *Panel* del administrador; la cuarta depende de una encuesta.

| Métrica | Meta | Cómo se mide |
| --- | --- | --- |
| Uso del tutor IA por sesión activa de alumno | ≥ 40 % | Alumnos activos en 30 días que hicieron consultas al tutor |
| Actividades con feedback revisado por el alumno | ≥ 60 % | Correcciones publicadas que el alumno abrió |
| Retención mensual de usuarios activos | ≥ 70 % | Usuarios activos el mes anterior que volvieron este mes |
| Reducción del tiempo de preparación docente | ≥ 30 % | Encuesta post-lanzamiento (no se calcula desde el sistema) |

Además, el requisito de rendimiento del tutor (*primera respuesta visible en menos de 3 s*) se mide con la métrica de latencia descripta en la [documentación técnica](./DOCUMENTACION_TECNICA.md#12-rendimiento-del-tutor).

## Pendientes declarados

Lo que queda fuera, en orden de importancia para la defensa:

1. **Medir el tiempo real del LLM** con las claves de Gemini configuradas (`npm run benchmark:tutor`); en el entorno de desarrollo no hay clave.
2. P08/P09: filtros por período o unidad y detalle por tema en el dashboard del docente.
3. P01: pantalla para editar y reordenar secciones.
4. A05 (A1): adjuntar un archivo propio al resumen.
5. P04: niveles de desempeño configurables en la rúbrica.
6. A02 (A5A) y A11 (A2, A4): reporte de archivo dañado, corrección de respuestas externas y aviso de material insuficiente.
