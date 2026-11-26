/**
 * Suite E2E de EduAI: recorre los tres roles contra el stack real (backend + base de datos).
 *
 * Requisitos: stack levantado y base sembrada (`npm run db:seed --workspace backend`).
 *   E2E_BASE_URL   URL del backend (default http://127.0.0.1:3000)
 *   E2E_PASSWORD   contraseña de los usuarios del seed (default Clave1234)
 *   E2E_AI=1       además prueba lo que pasa por el ai-service (saludo, corrección de opción
 *                  múltiple). No consume tokens del LLM, pero el ai-service tiene que estar arriba.
 *   E2E_LLM=1      además hace UNA consulta real al asistente docente (llama a Gemini y consume
 *                  tokens). Requiere E2E_AI=1 y una GEMINI_API_KEY válida en el ai-service.
 *
 * Uso: npm run e2e
 *
 * Cada corrida deja 1 materia dada de baja y 4 usuarios nuevos (no se pueden borrar por API):
 * `npm run demo:reset --workspace backend` restaura la base de demo.
 * Cada corrida crea su propia materia y sus propios usuarios (sufijo único): se puede repetir
 * sin limpiar la base.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { after, describe, it } from "node:test";

const BASE = (process.env.E2E_BASE_URL ?? "http://127.0.0.1:3000").replace(/\/+$/, "");
const PASSWORD = process.env.E2E_PASSWORD ?? "Clave1234";
const AI_URL = (process.env.E2E_AI_URL ?? "http://127.0.0.1:8000").replace(/\/+$/, "");
const CON_IA = process.env.E2E_AI === "1";
const CON_LLM = CON_IA && process.env.E2E_LLM === "1";
const SUFIJO = Math.random().toString(36).slice(2, 8);
const CLAVE_NUEVA = "OtraClave2026";

const DIA = 24 * 60 * 60 * 1000;
const ahora = Date.now();

/** Llama a la API y devuelve { status, headers, body }. */
async function llamar(metodo, ruta, { token, cuerpo, crudo, contentType } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  let body;
  if (cuerpo !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(cuerpo);
  } else if (crudo !== undefined) {
    headers["Content-Type"] = contentType;
    body = crudo;
  }
  const res = await fetch(BASE + ruta, { method: metodo, headers, body });
  const texto = await res.text();
  let json = {};
  try {
    json = texto ? JSON.parse(texto) : {};
  } catch {
    json = { texto };
  }
  return { status: res.status, headers: res.headers, body: json };
}

async function login(email, password = PASSWORD) {
  const r = await llamar("POST", "/api/auth/login", { cuerpo: { email, password } });
  assert.equal(r.status, 200, `login de ${email} falló (${r.status}): ${JSON.stringify(r.body)}`);
  return r.body.accessToken;
}

const lista = (body, ...claves) => {
  for (const c of claves) if (Array.isArray(body[c])) return body[c];
  return Array.isArray(body) ? body : [];
};

// Estado compartido entre pasos: los casos de uso se encadenan como en una cursada real.
const ctx = {};

describe(`EduAI E2E (${BASE})${CON_IA ? " + IA" : ""}`, { concurrency: false }, () => {
  // La materia de la corrida no se puede borrar por API (solo dar de baja): al menos no dejar
  // sus vectores huérfanos en el almacén. Para volver a la base de demo: `npm run demo:reset`.
  after(async () => {
    if (!CON_IA || !ctx.materiaId) return;
    await fetch(`${AI_URL}/rag/materias/${ctx.materiaId}`, { method: "DELETE" }).catch(() => undefined);
  });

  describe("Sistema y autenticación", () => {
    it("el backend responde y la base está conectada", async () => {
      const r = await llamar("GET", "/api/healthz");
      assert.equal(r.status, 200);
      assert.equal(r.body.status, "ok");
    });

    it("rechaza peticiones sin token y con credenciales incorrectas", async () => {
      assert.equal((await llamar("GET", "/api/auth/me")).status, 401);
      const r = await llamar("POST", "/api/auth/login", {
        cuerpo: { email: "admin@ies.edu", password: "incorrecta" },
      });
      assert.equal(r.status, 401);
    });

    it("inicia sesión como administrador y docente del seed", async () => {
      ctx.admin = await login("admin@ies.edu");
      ctx.profeSeed = await login("profe1@ies.edu");
      const me = await llamar("GET", "/api/auth/me", { token: ctx.admin });
      assert.equal(me.body.usuario.rol, "ADMIN");
    });
  });

  describe("Administrador (CU-AD01..AD04)", () => {
    it("CU-AD01: crea una materia", async () => {
      const r = await llamar("POST", "/api/admin/materias", {
        token: ctx.admin,
        cuerpo: { nombre: `E2E Materia ${SUFIJO}`, nivel_educativo: "Terciario", descripcion: "Creada por la suite E2E" },
      });
      assert.equal(r.status, 201, JSON.stringify(r.body));
      ctx.materiaId = r.body.materia.id;
    });

    it("CU-AD01 (E1): no admite dos materias con el mismo nombre", async () => {
      const r = await llamar("POST", "/api/admin/materias", {
        token: ctx.admin,
        cuerpo: { nombre: `E2E Materia ${SUFIJO}`.toUpperCase(), nivel_educativo: "Terciario" },
      });
      assert.equal(r.status, 409);
    });

    it("CU-AD03: da de alta docente y alumnos, y cada uno recibe su aviso dentro de la plataforma", async () => {
      const alta = async (nombre, rol) => {
        const email = `e2e-${rol.toLowerCase()}-${nombre}-${SUFIJO}@ies.edu`;
        const r = await llamar("POST", "/api/admin/users", {
          token: ctx.admin,
          cuerpo: { nombre: `E2E ${nombre}`, email, password: PASSWORD, rol },
        });
        assert.equal(r.status, 201, JSON.stringify(r.body));
        return { id: r.body.usuario.id, email, perfilId: r.body.usuario.profesor_id ?? null };
      };

      ctx.docente = await alta("Docente", "PROFESOR");
      ctx.alumnoA = await alta("AlumnoA", "ALUMNO");
      ctx.alumnoB = await alta("AlumnoB", "ALUMNO");
      assert.ok(ctx.docente.perfilId, "el docente tiene perfil de profesor");

      ctx.tokDocente = await login(ctx.docente.email);
      ctx.tokA = await login(ctx.alumnoA.email);
      ctx.tokB = await login(ctx.alumnoB.email);

      const avisos = lista((await llamar("GET", "/api/notificaciones", { token: ctx.tokA })).body, "notificaciones", "items");
      assert.ok(
        avisos.some((n) => /cuenta fue creada/i.test(n.titulo)),
        "el alumno recibe el aviso de alta"
      );
      assert.ok(
        !JSON.stringify(avisos).includes(PASSWORD),
        "el aviso no incluye la contraseña temporal"
      );
    });

    it("CU-AD02: asigna al docente, rechaza duplicados y le avisa", async () => {
      const asignar = () =>
        llamar("POST", `/api/admin/materias/${ctx.materiaId}/profesores`, {
          token: ctx.admin,
          cuerpo: { profesor_id: ctx.docente.perfilId, activo: true },
        });

      assert.equal((await asignar()).status, 201);
      assert.equal((await asignar()).status, 409, "no se asigna dos veces al mismo docente");

      const avisos = lista((await llamar("GET", "/api/notificaciones", { token: ctx.tokDocente })).body, "notificaciones", "items");
      assert.ok(avisos.some((n) => /nueva materia asignada/i.test(n.titulo)));
    });

    it("CU-AD04: genera una clave de un solo uso y otra sin límite", async () => {
      const generar = async (max_usos) => {
        const r = await llamar("POST", "/api/admin/enrollment-keys", {
          token: ctx.admin,
          cuerpo: { materia_id: ctx.materiaId, ...(max_usos ? { max_usos } : {}) },
        });
        assert.equal(r.status, 201, JSON.stringify(r.body));
        return r.body.codigo ?? r.body.clave?.codigo ?? r.body.clave;
      };
      ctx.claveUnUso = await generar(1);
      ctx.claveLibre = await generar();
      assert.ok(ctx.claveUnUso && ctx.claveLibre);
    });

    it("CU-AD04 (E5): no se genera una clave con vencimiento en el pasado", async () => {
      const r = await llamar("POST", "/api/admin/enrollment-keys", {
        token: ctx.admin,
        cuerpo: { materia_id: ctx.materiaId, vencimiento: new Date(ahora - DIA).toISOString() },
      });
      assert.equal(r.status, 400);
    });
  });

  describe("Alumno: inscripción (CU-A01)", () => {
    it("se inscribe con una clave válida", async () => {
      const r = await llamar("POST", "/api/materias/unirse", { token: ctx.tokA, cuerpo: { clave: ctx.claveUnUso } });
      assert.equal(r.status, 201, JSON.stringify(r.body));
    });

    it("una clave de un solo uso no admite un segundo alumno", async () => {
      const r = await llamar("POST", "/api/materias/unirse", { token: ctx.tokB, cuerpo: { clave: ctx.claveUnUso } });
      assert.equal(r.status, 400);
      assert.match(r.body.error, /limite/i);
    });

    it("si ya está inscripto no se duplica ni es un error, y una clave inventada no sirve", async () => {
      const dos = await llamar("POST", "/api/materias/unirse", { token: ctx.tokA, cuerpo: { clave: ctx.claveLibre } });
      assert.equal(dos.status, 200);
      assert.equal(dos.body.materia.ya_inscripto, true);
      assert.equal(dos.body.materia.id, ctx.materiaId);
      const falsa = await llamar("POST", "/api/materias/unirse", { token: ctx.tokB, cuerpo: { clave: "NOEXISTE123" } });
      assert.equal(falsa.status, 400);
    });

    it("el segundo alumno entra con la clave sin límite", async () => {
      const r = await llamar("POST", "/api/materias/unirse", { token: ctx.tokB, cuerpo: { clave: ctx.claveLibre } });
      assert.equal(r.status, 201, JSON.stringify(r.body));
    });
  });

  describe("Docente: contenido y actividades (CU-P01..P04)", () => {
    it("CU-P01: crea una sección", async () => {
      const r = await llamar("POST", `/api/materias/${ctx.materiaId}/secciones`, {
        token: ctx.tokDocente,
        cuerpo: { nombre: "Unidad 1", tipo: "TEORIA", orden: 1 },
      });
      assert.equal(r.status, 201, JSON.stringify(r.body));
      ctx.seccionId = r.body.seccion.id;
    });

    it("CU-P01 (E1): no admite dos secciones con el mismo nombre", async () => {
      const r = await llamar("POST", `/api/materias/${ctx.materiaId}/secciones`, {
        token: ctx.tokDocente,
        cuerpo: { nombre: "UNIDAD 1", tipo: "TEORIA", orden: 2 },
      });
      assert.equal(r.status, 409);
    });

    it("CU-P02: sube un material de texto", async () => {
      const r = await llamar("POST", `/api/secciones/${ctx.seccionId}/contenidos`, {
        token: ctx.tokDocente,
        cuerpo: {
          tipo: "TEXTO",
          titulo: "Apunte de la Unidad 1",
          texto_contenido: "Una red de computadoras conecta dispositivos para compartir recursos e información.",
        },
      });
      assert.equal(r.status, 201, JSON.stringify(r.body));
      ctx.contenidoId = r.body.contenido.id;
    });

    it("CU-P04: crea una rúbrica", async () => {
      const r = await llamar("POST", `/api/materias/${ctx.materiaId}/rubricas`, {
        token: ctx.tokDocente,
        cuerpo: {
          nombre: "Rúbrica E2E",
          criterios: [
            { nombre: "Conceptos", peso: 60, esperado: "Define los conceptos principales." },
            { nombre: "Claridad", peso: 40, esperado: "Se entiende y está ordenado." },
          ],
        },
      });
      assert.equal(r.status, 201, JSON.stringify(r.body));
      ctx.rubricaId = r.body.rubrica.id;
    });

    it("CU-P04: una rúbrica cuyos pesos no suman 100 se rechaza", async () => {
      const r = await llamar("POST", `/api/materias/${ctx.materiaId}/rubricas`, {
        token: ctx.tokDocente,
        cuerpo: { nombre: "Mala", criterios: [{ nombre: "A", peso: 50, esperado: "x" }] },
      });
      assert.equal(r.status, 400);
    });

    it("CU-P03: define una actividad vigente y otra ya vencida", async () => {
      const crear = async (nombre, tipo, fecha, extra = {}) => {
        const r = await llamar("POST", `/api/materias/${ctx.materiaId}/actividades`, {
          token: ctx.tokDocente,
          cuerpo: {
            seccion_id: ctx.seccionId,
            nombre,
            consigna: "Explicá qué es una red de computadoras.",
            tipo,
            fecha_limite: new Date(fecha).toISOString(),
            ...extra,
          },
        });
        assert.equal(r.status, 201, JSON.stringify(r.body));
        return r.body.actividad.id;
      };
      ctx.actVigente = await crear("TP vigente", "DESARROLLO", ahora + 7 * DIA, { rubrica_id: ctx.rubricaId });
      ctx.actArchivo = await crear("Entrega de archivo", "ARCHIVO", ahora + 7 * DIA);

      // Una actividad no nace vencida, pero el docente puede cerrarla moviendo la fecha.
      ctx.actVencida = await crear("TP vencido", "DESARROLLO", ahora + 7 * DIA);
      const cierre = await llamar("PUT", `/api/actividades/${ctx.actVencida}`, {
        token: ctx.tokDocente,
        cuerpo: { fecha_limite: new Date(ahora - DIA).toISOString() },
      });
      assert.equal(cierre.status, 200, JSON.stringify(cierre.body));

      ctx.actMultiple = await crear("Quiz de opción múltiple", "MULTIPLE_CHOICE", ahora + 7 * DIA, {
        opciones_mc: [
          { texto: "Es un conjunto de dispositivos conectados", correcta: true },
          { texto: "Es un tipo de impresora", correcta: false },
        ],
      });
    });

    it("CU-P03 (E1): no se publica una actividad con la fecha límite en el pasado", async () => {
      const r = await llamar("POST", `/api/materias/${ctx.materiaId}/actividades`, {
        token: ctx.tokDocente,
        cuerpo: {
          seccion_id: ctx.seccionId,
          nombre: "Ya vencida",
          consigna: "x",
          tipo: "DESARROLLO",
          fecha_limite: new Date(ahora - DIA).toISOString(),
        },
      });
      assert.equal(r.status, 400);
    });
  });

  describe("Alumno: contenido y entregas (CU-A02, CU-A03)", () => {
    it("CU-A02: ve la sección y el material de su materia", async () => {
      const secciones = lista((await llamar("GET", `/api/materias/${ctx.materiaId}/secciones`, { token: ctx.tokA })).body, "secciones");
      assert.ok(secciones.some((s) => s.id === ctx.seccionId));
      const contenidos = lista((await llamar("GET", `/api/secciones/${ctx.seccionId}/contenidos`, { token: ctx.tokA })).body, "contenidos");
      assert.equal(contenidos[0].titulo, "Apunte de la Unidad 1");
    });

    it("CU-A02: al abrir el material queda registrado y el docente lo ve en sus estadísticas", async () => {
      const abrir = await llamar("POST", `/api/contenidos/${ctx.contenidoId}/acceso`, { token: ctx.tokA });
      assert.equal(abrir.body.registrado, true);
      const repetido = await llamar("POST", `/api/contenidos/${ctx.contenidoId}/acceso`, { token: ctx.tokA });
      assert.equal(repetido.body.registrado, false, "recargar no infla las estadísticas");

      const stats = (await llamar("GET", `/api/materias/${ctx.materiaId}/accesos`, { token: ctx.tokDocente })).body;
      const fila = stats.contenidos.find((c) => c.contenido_id === ctx.contenidoId);
      assert.equal(fila.alumnos_distintos, 1);
      assert.equal(stats.inscriptos, 2);
    });

    it("CU-A03: entrega la actividad vigente", async () => {
      const r = await llamar("POST", `/api/actividades/${ctx.actVigente}/entrega`, {
        token: ctx.tokA,
        cuerpo: { respuesta_texto: "Una red conecta equipos para compartir recursos." },
      });
      assert.equal(r.status, 201, JSON.stringify(r.body));
      ctx.entregaId = r.body.entrega?.id ?? r.body.id;
    });

    it("CU-A03 (A4): no puede entregar después de la fecha límite", async () => {
      const r = await llamar("POST", `/api/actividades/${ctx.actVencida}/entrega`, {
        token: ctx.tokA,
        cuerpo: { respuesta_texto: "tarde" },
      });
      assert.equal(r.status, 409);
    });

    it("seguridad: un archivo .html subido se descarga aislado y no se ejecuta", async () => {
      const limite = `----e2e${SUFIJO}`;
      const cuerpo = Buffer.from(
        `--${limite}\r\nContent-Disposition: form-data; name="archivo"; filename="malicioso.html"\r\nContent-Type: text/html\r\n\r\n<script>alert(1)</script>\r\n--${limite}--\r\n`
      );
      const subida = await llamar("POST", `/api/actividades/${ctx.actArchivo}/entrega/archivo`, {
        token: ctx.tokA,
        crudo: cuerpo,
        contentType: `multipart/form-data; boundary=${limite}`,
      });
      assert.equal(subida.status, 201, JSON.stringify(subida.body));
      const url = subida.body.archivo.archivo_url;
      if (url.startsWith("/")) {
        const res = await fetch(BASE + url);
        assert.equal(res.headers.get("content-disposition"), "attachment");
        assert.match(res.headers.get("content-security-policy") ?? "", /sandbox/);
      }

      // Subir el archivo no entrega: el alumno tiene que confirmar la entrega, como en la pantalla.
      const entrega = await llamar("POST", `/api/actividades/${ctx.actArchivo}/entrega`, {
        token: ctx.tokA,
        cuerpo: { archivo_url: url, archivo_nombre: subida.body.archivo.archivo_nombre },
      });
      assert.equal(entrega.status, 201, JSON.stringify(entrega.body));
    });
  });

  describe("Docente: corrección, notas y asistencia (CU-P05..P07)", () => {
    it("CU-P05: la entrega aparece en la cola de correcciones pendientes", async () => {
      const r = await llamar("GET", "/api/entregas/pendientes", { token: ctx.tokDocente });
      assert.equal(r.status, 200);
      const pendientes = lista(r.body, "entregas");
      const propia = pendientes.find((e) => e.id === ctx.entregaId);
      assert.ok(propia, "la entrega del alumno está pendiente");
    });

    it("CU-P05: una opción múltiple se corrige sola (10 si acierta) y queda como borrador", async () => {
      const entrega = await llamar("POST", `/api/actividades/${ctx.actMultiple}/entrega`, {
        token: ctx.tokA,
        cuerpo: { respuesta_texto: "Es un conjunto de dispositivos conectados" },
      });
      assert.equal(entrega.status, 201, JSON.stringify(entrega.body));
      const id = entrega.body.entrega?.id ?? entrega.body.id;

      let corregida;
      for (let intento = 0; intento < 20 && !corregida; intento++) {
        const pendientes = lista((await llamar("GET", "/api/entregas/pendientes", { token: ctx.tokDocente })).body, "entregas");
        const e = pendientes.find((x) => x.id === id);
        if (e && e.calificacion_ia !== null && e.calificacion_ia !== undefined) corregida = e;
        else await new Promise((resolve) => setTimeout(resolve, 150));
      }
      assert.ok(corregida, "la entrega quedó corregida automáticamente");
      assert.equal(Number(corregida.calificacion_ia), 10);
      assert.equal(corregida.publicado, false, "el alumno no la ve hasta que el docente la publique");
    });

    it("CU-P05: corrige y publica; el alumno ve la nota y recibe el aviso", async () => {
      const r = await llamar("PATCH", `/api/entregas/${ctx.entregaId}/correccion`, {
        token: ctx.tokDocente,
        cuerpo: { calificacion_final: 8, feedback_final: "Buen trabajo, faltó un ejemplo.", revision_tipo: "MANUAL" },
      });
      assert.equal(r.status, 200, JSON.stringify(r.body));

      const acts = lista((await llamar("GET", `/api/materias/${ctx.materiaId}/actividades`, { token: ctx.tokA })).body, "actividades");
      const mia = acts.find((a) => a.id === ctx.actVigente);
      assert.equal(mia.estado_entrega, "PUBLICADA");
      assert.equal(mia.mi_entrega.feedback_final, "Buen trabajo, faltó un ejemplo.");

      const avisos = lista((await llamar("GET", "/api/notificaciones", { token: ctx.tokA })).body, "notificaciones", "items");
      assert.ok(avisos.some((n) => n.tipo === "FEEDBACK"));
    });

    it("CU-P06: registra una nota", async () => {
      const r = await llamar("POST", `/api/materias/${ctx.materiaId}/notas`, {
        token: ctx.tokDocente,
        cuerpo: { alumno_id: ctx.alumnoA.id, periodo: "2026-1", calificacion: 8, observaciones: "Parcial 1" },
      });
      assert.equal(r.status, 201, JSON.stringify(r.body));
    });

    it("CU-P07: registra la asistencia de la clase", async () => {
      const r = await llamar("POST", `/api/materias/${ctx.materiaId}/asistencias`, {
        token: ctx.tokDocente,
        cuerpo: {
          fecha_clase: "2026-10-01",
          registros: [
            { alumno_id: ctx.alumnoA.id, estado: "PRESENTE" },
            { alumno_id: ctx.alumnoB.id, estado: "AUSENTE" },
          ],
        },
      });
      assert.ok([200, 201].includes(r.status), JSON.stringify(r.body));
    });
  });

  describe("Estadísticas y vistas (CU-A10, CU-P08)", () => {
    it("CU-A10: el dashboard del alumno refleja progreso, promedio y pendientes reales", async () => {
      const r = await llamar("GET", "/api/dashboard/alumno", { token: ctx.tokA });
      assert.equal(r.status, 200, JSON.stringify(r.body));
      const m = r.body.materias.find((x) => x.id === ctx.materiaId);
      assert.equal(m.promedio, 8);
      assert.equal(m.progreso, 75, "3 de 4 actividades entregadas (TP vigente, archivo y quiz)");
      assert.ok(r.body.proximasActividades.some((a) => a.id === ctx.actVencida));
    });

    it("el docente ve el perfil del alumno con notas, asistencia y entregas", async () => {
      const r = await llamar("GET", `/api/materias/${ctx.materiaId}/alumnos/${ctx.alumnoA.id}/perfil`, {
        token: ctx.tokDocente,
      });
      assert.equal(r.status, 200, JSON.stringify(r.body));
      const p = r.body.perfil;
      assert.equal(p.notas.promedio, 8);
      assert.equal(p.asistencia.porcentaje, 100);
      assert.equal(p.entregas.entregadas, 3);
      assert.equal(p.material.vistos, 1);
    });
  });

  describe("Permisos entre roles", () => {
    it("un alumno no ve el listado de compañeros ni el perfil de otro alumno", async () => {
      assert.equal((await llamar("GET", `/api/materias/${ctx.materiaId}/inscriptos`, { token: ctx.tokA })).status, 403);
      assert.equal(
        (await llamar("GET", `/api/materias/${ctx.materiaId}/alumnos/${ctx.alumnoB.id}/perfil`, { token: ctx.tokA })).status,
        403
      );
    });

    it("un docente ajeno a la materia no accede a sus estadísticas", async () => {
      assert.equal((await llamar("GET", `/api/materias/${ctx.materiaId}/accesos`, { token: ctx.profeSeed })).status, 403);
    });

    it("solo el administrador entra al panel de administración", async () => {
      assert.equal((await llamar("GET", "/api/admin/users", { token: ctx.tokA })).status, 403);
      assert.equal((await llamar("GET", "/api/admin/users", { token: ctx.tokDocente })).status, 403);
    });
  });

  describe("Reportes del administrador (datos reales)", () => {
    it("cada reporte se exporta como PDF válido y como CSV, y los docentes no pueden", async () => {
      const lista = await llamar("GET", "/api/admin/reports", { token: ctx.admin });
      assert.equal(lista.status, 200, JSON.stringify(lista.body));
      assert.ok(lista.body.reports.length > 0, "hay reportes");

      for (const reporte of lista.body.reports) {
        const tipo = reporte.type ?? reporte.id ?? reporte.key;
        const pdf = await llamar("GET", `/api/admin/reports/${tipo}/export?format=pdf`, { token: ctx.admin });
        assert.equal(pdf.status, 200, `PDF de ${tipo}: ${JSON.stringify(pdf.body)}`);
        const bytes = Buffer.from(pdf.body.pdf, "base64");
        assert.equal(bytes.subarray(0, 5).toString(), "%PDF-", `${tipo} no es un PDF`);
        assert.ok(bytes.length > 1000, `${tipo}: PDF demasiado chico`);
        assert.match(pdf.body.filename, /\.pdf$/);

        const csv = await llamar("GET", `/api/admin/reports/${tipo}/export`, { token: ctx.admin });
        assert.equal(csv.status, 200, `CSV de ${tipo}`);
      }

      const tipo = lista.body.reports[0].type ?? lista.body.reports[0].id ?? lista.body.reports[0].key;
      const ajeno = await llamar("GET", `/api/admin/reports/${tipo}/export?format=pdf`, { token: ctx.tokDocente });
      assert.equal(ajeno.status, 403);
    });
  });

  describe("Cuenta: cambio de contraseña", () => {
    it("cambia la contraseña, la anterior deja de servir y se puede volver a ingresar", async () => {
      const mala = await llamar("POST", "/api/auth/password", {
        token: ctx.tokB,
        cuerpo: { password_actual: "incorrecta", password_nueva: CLAVE_NUEVA },
      });
      assert.equal(mala.status, 400);

      const ok = await llamar("POST", "/api/auth/password", {
        token: ctx.tokB,
        cuerpo: { password_actual: PASSWORD, password_nueva: CLAVE_NUEVA },
      });
      assert.equal(ok.status, 200);

      const vieja = await llamar("POST", "/api/auth/login", { cuerpo: { email: ctx.alumnoB.email, password: PASSWORD } });
      assert.equal(vieja.status, 401);
      assert.ok(await login(ctx.alumnoB.email, CLAVE_NUEVA));
    });
  });

  describe("Recuperación de contraseña y enlace del administrador (CU-AD03)", () => {
    it("el pedido de recuperación responde igual exista o no la cuenta", async () => {
      const email = `e2e-alumno-C-${SUFIJO}@ies.edu`;
      const alta = await llamar("POST", "/api/admin/users", {
        token: ctx.admin,
        cuerpo: { nombre: "E2E AlumnoC", email, password: PASSWORD, rol: "ALUMNO" },
      });
      assert.equal(alta.status, 201, JSON.stringify(alta.body));
      ctx.alumnoC = { id: alta.body.usuario.id, email };

      const real = await llamar("POST", "/api/auth/password/olvide", { cuerpo: { email } });
      const falsa = await llamar("POST", "/api/auth/password/olvide", { cuerpo: { email: `nadie-${SUFIJO}@ies.edu` } });
      assert.equal(real.status, 200, JSON.stringify(real.body));
      assert.equal(falsa.status, 200);
      assert.deepEqual(real.body, falsa.body, "no debe revelar si el correo existe");
    });

    it("solo el administrador puede emitir un enlace de recuperación", async () => {
      assert.equal((await llamar("POST", `/api/admin/users/${ctx.alumnoC.id}/recuperacion-token`, { token: ctx.tokA })).status, 403);
      assert.equal((await llamar("POST", `/api/admin/users/${ctx.alumnoC.id}/recuperacion-token`, { token: ctx.tokDocente })).status, 403);
      assert.equal((await llamar("POST", `/api/admin/users/${ctx.alumnoC.id}/recuperacion-token`)).status, 401);
    });

    it("el administrador emite un enlace de un solo uso y el usuario cambia su contraseña con él", async () => {
      // Una sesión abierta antes del cambio: tiene que quedar cerrada.
      const antes = await fetch(`${BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: ctx.alumnoC.email, password: PASSWORD }),
      });
      assert.equal(antes.status, 200);
      const cookieVieja = (antes.headers.get("set-cookie") ?? "").split(";")[0];
      assert.match(cookieVieja, /^eduai_refresh=/);

      const emitido = await llamar("POST", `/api/admin/users/${ctx.alumnoC.id}/recuperacion-token`, { token: ctx.admin });
      assert.equal(emitido.status, 201, JSON.stringify(emitido.body));
      assert.match(emitido.headers.get("cache-control") ?? "", /no-store/);
      assert.ok(new Date(emitido.body.expira_en).getTime() > Date.now(), "el enlace vence en el futuro");
      const token = new URL(emitido.body.enlace).searchParams.get("token");
      assert.match(token ?? "", /^[0-9a-f]{64}$/, "el enlace lleva un token de 256 bits");
      assert.equal(new URL(emitido.body.enlace).pathname, "/restablecer");

      const nueva = "ClaveRecuperada2026";
      const corta = await llamar("POST", "/api/auth/password/restablecer", { cuerpo: { token, password_nueva: "corta" } });
      assert.equal(corta.status, 400, "una contraseña corta no consume el enlace");

      const ok = await llamar("POST", "/api/auth/password/restablecer", { cuerpo: { token, password_nueva: nueva } });
      assert.equal(ok.status, 200, JSON.stringify(ok.body));

      assert.equal((await llamar("POST", "/api/auth/login", { cuerpo: { email: ctx.alumnoC.email, password: PASSWORD } })).status, 401);
      assert.ok(await login(ctx.alumnoC.email, nueva), "entra con la contraseña nueva");

      const refresco = await fetch(`${BASE}/api/auth/refresh`, { method: "POST", headers: { Cookie: cookieVieja } });
      assert.equal(refresco.status, 401, "la sesión anterior al cambio quedó cerrada");

      const reuso = await llamar("POST", "/api/auth/password/restablecer", { cuerpo: { token, password_nueva: "OtraMas2026Clave" } });
      assert.equal(reuso.status, 400, "el enlace sirve una sola vez");
    });

    it("un token inventado se rechaza", async () => {
      const r = await llamar("POST", "/api/auth/password/restablecer", {
        cuerpo: { token: "a".repeat(64), password_nueva: "ClaveInventada2026" },
      });
      assert.equal(r.status, 400);
    });

    it("no emite enlaces para un usuario inexistente", async () => {
      const r = await llamar("POST", "/api/admin/users/00000000-0000-4000-8000-000000000000/recuperacion-token", { token: ctx.admin });
      assert.equal(r.status, 404);
    });
  });

  describe("Docente: asistente con conversaciones persistentes (CU-P10)", () => {
    it("crea una conversación y aparece en el listado de la materia", async () => {
      const r = await llamar("POST", "/api/asistente/sesiones", { token: ctx.tokDocente, cuerpo: { materia_id: ctx.materiaId } });
      assert.equal(r.status, 200, JSON.stringify(r.body));
      assert.equal(r.body.materia_id, ctx.materiaId);
      assert.equal(r.body.mensajes, 0);
      ctx.sesionAsistente = r.body.id;

      const lista = await llamar("GET", `/api/asistente/sesiones?materia_id=${ctx.materiaId}`, { token: ctx.tokDocente });
      assert.equal(lista.status, 200);
      assert.ok(lista.body.some((s) => s.id === ctx.sesionAsistente), "la conversación figura en la lista");

      const mensajes = await llamar("GET", `/api/asistente/sesiones/${ctx.sesionAsistente}/mensajes`, { token: ctx.tokDocente });
      assert.equal(mensajes.status, 200);
      assert.deepEqual(mensajes.body, [], "una conversación nueva no tiene mensajes");
    });

    it("las conversaciones son del docente: otro docente y los alumnos no entran", async () => {
      // profe1 (del seed) no está asignado a esta materia.
      const ajena = await llamar("POST", "/api/asistente/sesiones", { token: ctx.profeSeed, cuerpo: { materia_id: ctx.materiaId } });
      assert.equal(ajena.status, 403, "un docente no asignado no puede abrir conversaciones en la materia");
      assert.equal((await llamar("GET", `/api/asistente/sesiones?materia_id=${ctx.materiaId}`, { token: ctx.profeSeed })).status, 403);
      assert.equal((await llamar("GET", `/api/asistente/sesiones/${ctx.sesionAsistente}/mensajes`, { token: ctx.profeSeed })).status, 404);
      assert.equal(
        (await llamar("POST", `/api/asistente/sesiones/${ctx.sesionAsistente}/mensajes`, { token: ctx.profeSeed, cuerpo: { prompt: "Hola, armame una clase" } })).status,
        404
      );

      assert.equal((await llamar("POST", "/api/asistente/sesiones", { token: ctx.tokA, cuerpo: { materia_id: ctx.materiaId } })).status, 403);
      assert.equal((await llamar("GET", `/api/asistente/sesiones/${ctx.sesionAsistente}/mensajes`, { token: ctx.tokA })).status, 403);
    });

    it("rechaza materiales que no son de la materia, sin llamar a la IA", async () => {
      const r = await llamar("POST", `/api/asistente/sesiones/${ctx.sesionAsistente}/mensajes`, {
        token: ctx.tokDocente,
        cuerpo: { prompt: "Armame una clase sobre este material", content_ids: ["00000000-0000-4000-8000-000000000000"] },
      });
      assert.equal(r.status, 400, JSON.stringify(r.body));

      const sinEstructura = await llamar("POST", `/api/asistente/sesiones/${ctx.sesionAsistente}/mensajes`, {
        token: ctx.tokDocente,
        cuerpo: { prompt: "Armame una clase", content_ids: ["no-es-un-uuid"] },
      });
      assert.equal(sinEstructura.status, 400);

      const mensajes = await llamar("GET", `/api/asistente/sesiones/${ctx.sesionAsistente}/mensajes`, { token: ctx.tokDocente });
      assert.deepEqual(mensajes.body, [], "un pedido rechazado no deja mensajes guardados");
    });

    it(CON_LLM ? "una consulta real queda guardada en la conversación (consume tokens)" : "una consulta real queda guardada (omitido: definí E2E_AI=1 y E2E_LLM=1)", { skip: !CON_LLM }, async () => {
      const r = await llamar("POST", `/api/asistente/sesiones/${ctx.sesionAsistente}/mensajes`, {
        token: ctx.tokDocente,
        cuerpo: { prompt: "Armame una actividad breve de repaso de dos preguntas" },
      });
      assert.equal(r.status, 200, JSON.stringify(r.body));
      assert.equal(r.body.rol, "ASSISTANT");
      assert.ok(r.body.contenido.length > 20, "el asistente respondió");

      const mensajes = await llamar("GET", `/api/asistente/sesiones/${ctx.sesionAsistente}/mensajes`, { token: ctx.tokDocente });
      assert.deepEqual(mensajes.body.map((m) => m.rol), ["USER", "ASSISTANT"]);

      const lista = await llamar("GET", `/api/asistente/sesiones?materia_id=${ctx.materiaId}`, { token: ctx.tokDocente });
      const sesion = lista.body.find((s) => s.id === ctx.sesionAsistente);
      assert.equal(sesion.mensajes, 2);
      assert.match(sesion.titulo ?? "", /actividad breve/i, "el título sale de la primera consulta");
    });
  });

  describe(CON_IA ? "Tutor IA (sin consumir tokens)" : "Tutor IA (omitido: definí E2E_AI=1)", { skip: !CON_IA }, () => {
    it("CU-SYS01: un saludo se responde sin llamar al LLM", async () => {
      const sesion = await llamar("POST", `/api/materias/${ctx.materiaId}/tutor/sesiones`, {
        token: ctx.tokA,
        cuerpo: { modo: "NORMAL" },
      });
      assert.equal(sesion.status, 201, JSON.stringify(sesion.body));
      const id = sesion.body.sesion.id;

      const r = await llamar("POST", `/api/tutor/sesiones/${id}/mensajes`, {
        token: ctx.tokA,
        cuerpo: { contenido: "Hola, ¿cómo estás?" },
      });
      assert.equal(r.status, 200, JSON.stringify(r.body));
      const texto = JSON.stringify(r.body);
      assert.match(texto, /Contame qu/);
    });

    it("OCR: extrae el texto de un PDF escaneado (solo imagen) sin guardarlo", async () => {
      const pdf = readFileSync(new URL("./fixtures/escaneado.pdf", import.meta.url));
      const form = new FormData();
      form.append("archivo", new Blob([pdf], { type: "application/pdf" }), "escaneado.pdf");
      const res = await fetch(`${AI_URL}/tutor/extraer-texto`, { method: "POST", body: form });
      const cuerpo = await res.json();
      assert.equal(res.status, 200, JSON.stringify(cuerpo));
      assert.match(cuerpo.texto, /fotos[ií]ntesis/i);
      assert.match(cuerpo.texto, /cloroplastos/i);
    });

    it("CU-A11: corrige un simulacro de opción múltiple y lo guarda en el historial", async () => {
      const preguntas = [
        { tipo: "multiple_choice", enunciado: "¿Capital de Francia?", opciones: ["Madrid", "París", "Roma", "Lima"], respuesta_modelo: "París", respuesta_alumno: "París" },
        { tipo: "multiple_choice", enunciado: "2 + 2", opciones: ["3", "4", "5"], respuesta_modelo: "4", respuesta_alumno: "3" },
        { tipo: "multiple_choice", enunciado: "¿Color del cielo?", opciones: ["Azul", "Verde"], respuesta_modelo: "Azul", respuesta_alumno: "" },
      ];
      const r = await llamar("POST", `/api/materias/${ctx.materiaId}/tutor/examen/corregir`, {
        token: ctx.tokA,
        cuerpo: { titulo: "Simulacro E2E", dificultad: "facil", preguntas, registrar: true },
      });
      assert.equal(r.status, 200, JSON.stringify(r.body));
      assert.equal(r.body.correctas, 1);
      assert.equal(r.body.incorrectas, 1);
      assert.equal(r.body.sin_responder, 1);
      assert.equal(r.body.puntaje, 3.33);

      const hist = await llamar("GET", `/api/materias/${ctx.materiaId}/tutor/simulacros`, { token: ctx.tokA });
      assert.ok(hist.body.simulacros.some((s) => s.titulo === "Simulacro E2E"));
    });

    it("la métrica de latencia del tutor está disponible para el docente y el administrador", async () => {
      const doc = await llamar("GET", `/api/materias/${ctx.materiaId}/tutor/latencia`, { token: ctx.tokDocente });
      const adm = await llamar("GET", "/api/admin/tutor/latencia", { token: ctx.admin });
      assert.equal(doc.status, 200);
      assert.equal(adm.status, 200);
      assert.equal(doc.body.umbral_ms, 3000);
    });
  });

  describe("Revisión del proyecto (Fase 6): licencia única, reportes, notas y baja de docente", () => {
    it("6.1: la licencia es una sola, sin planes ni topes, y solo la ve el administrador", async () => {
      const r = await llamar("GET", "/api/admin/license", { token: ctx.admin });
      assert.equal(r.status, 200, JSON.stringify(r.body));
      assert.equal(r.body.licencia.tipo, "UNICA");
      assert.equal(r.body.licencia.estado, "ACTIVA");
      assert.ok(r.body.licencia.incluye.length > 3, "lista lo que incluye");
      assert.ok(Number.isInteger(r.body.uso.alumnos) && r.body.uso.alumnos >= 2, "informa el uso");
      assert.ok(!("planes" in r.body), "ya no hay planes");
      assert.doesNotMatch(JSON.stringify(r.body), /MAU|limit|Starter|Enterprise/i);
      assert.equal((await llamar("GET", "/api/admin/license", { token: ctx.tokDocente })).status, 403);
    });

    it("6.4: el dashboard del alumno trae sus propias notas agrupadas por materia", async () => {
      const a = await llamar("GET", "/api/dashboard/alumno", { token: ctx.tokA });
      assert.equal(a.status, 200);
      const materia = a.body.materias.find((m) => m.id === ctx.materiaId);
      assert.ok(materia, "ve su materia");
      assert.ok(materia.total_notas >= 1, "tiene al menos la nota que cargó el docente");
      assert.ok(materia.notas.some((n) => Number(n.calificacion) === 8), "aparece la nota de 8");
      assert.ok(materia.notas.length <= 5, "como máximo las 5 últimas");
      for (const n of materia.notas) assert.ok(n.id && n.evaluacion && n.fecha, "cada nota trae evaluación y fecha");

      // El otro alumno no ve notas ajenas: la nota de 8 es de A.
      const b = await llamar("GET", "/api/dashboard/alumno", { token: ctx.tokB });
      const deB = b.body.materias.find((m) => m.id === ctx.materiaId);
      assert.ok(!deB.notas.some((n) => Number(n.calificacion) === 8 && n.id === materia.notas[0].id), "no ve notas de otro alumno");
    });

    it("6.2: los reportes respetan los filtros y las cifras coinciden con lo cargado", async () => {
      const pedir = (consulta) => llamar("GET", `/api/admin/reports${consulta}`, { token: ctx.admin });
      const stat = (res, tipo, label) =>
        res.body.reports.find((r) => r.type === tipo).stats.find((s) => s.label === label)?.value;

      // Asistencia cargada arriba: una clase (2026-10-01, período 2026-2), A presente y B ausente.
      const porMateria = await pedir(`?materia_id=${ctx.materiaId}`);
      assert.equal(porMateria.status, 200, JSON.stringify(porMateria.body));
      assert.equal(stat(porMateria, "asistencia", "Registros totales"), "2");
      assert.equal(stat(porMateria, "asistencia", "Presentes (incluye justificados)"), "1");
      assert.equal(stat(porMateria, "asistencia", "Ausencias"), "1");
      assert.equal(porMateria.body.reports.find((r) => r.type === "asistencia").headline, "50% de asistencia");
      assert.match(porMateria.body.reports.find((r) => r.type === "asistencia").description, new RegExp(`E2E Materia ${SUFIJO}`));

      const enPeriodo = await pedir(`?materia_id=${ctx.materiaId}&periodo=2026-2`);
      assert.equal(stat(enPeriodo, "asistencia", "Registros totales"), "2");
      const otroPeriodo = await pedir(`?materia_id=${ctx.materiaId}&periodo=2026-1`);
      assert.equal(stat(otroPeriodo, "asistencia", "Registros totales"), "0");

      // Notas: la materia tiene la nota de 8 y su promedio aparece en el desglose.
      assert.ok(Number(stat(porMateria, "notas", "Calificaciones cargadas")) >= 1);
      assert.ok(porMateria.body.reports.find((r) => r.type === "notas").stats.some((s) => s.label === `E2E Materia ${SUFIJO}`));

      // Sin MAU: el reporte nuevo es «uso» y la retención es la mensual real.
      const todos = await pedir("");
      const tipos = todos.body.reports.map((r) => r.type);
      assert.ok(tipos.includes("uso") && !tipos.includes("mau"));
      assert.match(todos.body.reports.find((r) => r.type === "retencion").headline, /retención mensual/);

      // Filtros inválidos.
      assert.equal((await pedir("?periodo=2026-9")).status, 400);
      assert.equal((await pedir("?materia_id=no-es-uuid")).status, 404);
      assert.equal((await pedir("?materia_id=00000000-0000-4000-8000-000000000000")).status, 404);

      // La exportación lleva los mismos números.
      const csv = await llamar("GET", `/api/admin/reports/asistencia/export?materia_id=${ctx.materiaId}`, { token: ctx.admin });
      assert.equal(csv.status, 200);
      assert.match(csv.body.csv, /"Registros totales";"2"/);
    });

    it("6.3: se quita al docente de la materia sin borrar su usuario; pierde el acceso y se le avisa", async () => {
      const listado = await llamar("GET", "/api/admin/materias?pageSize=100", { token: ctx.admin });
      const materia = listado.body.items.find((m) => m.id === ctx.materiaId);
      const asignado = materia.profesores.find((p) => p.profesor_id === ctx.docente.perfilId);
      assert.ok(asignado, "el listado trae el id del perfil docente");

      const quitar = () =>
        llamar("DELETE", `/api/admin/materias/${ctx.materiaId}/profesores/${ctx.docente.perfilId}`, { token: ctx.admin });
      assert.equal((await quitar()).status, 200);
      assert.equal((await quitar()).status, 404, "quitarlo dos veces no es válido");

      // El usuario sigue activo, pero ya no entra a la materia.
      assert.equal((await llamar("POST", "/api/auth/login", { cuerpo: { email: ctx.docente.email, password: PASSWORD } })).status, 200);
      assert.equal((await llamar("GET", `/api/materias/${ctx.materiaId}/notas`, { token: ctx.tokDocente })).status, 403);

      const despues = await llamar("GET", "/api/admin/materias?pageSize=100", { token: ctx.admin });
      assert.ok(!despues.body.items.find((m) => m.id === ctx.materiaId).profesores.some((p) => p.profesor_id === ctx.docente.perfilId));

      const avisos = lista((await llamar("GET", "/api/notificaciones", { token: ctx.tokDocente })).body, "notificaciones", "items");
      assert.ok(avisos.some((n) => /materia desasignada/i.test(n.titulo)));

      // No se perdió nada: la nota que había cargado sigue en el dashboard del alumno.
      const a = await llamar("GET", "/api/dashboard/alumno", { token: ctx.tokA });
      assert.ok(a.body.materias.find((m) => m.id === ctx.materiaId).notas.some((n) => Number(n.calificacion) === 8));

      // Se puede volver a asignar.
      const otra = await llamar("POST", `/api/admin/materias/${ctx.materiaId}/profesores`, {
        token: ctx.admin,
        cuerpo: { profesor_id: ctx.docente.perfilId, activo: true },
      });
      assert.equal(otra.status, 201);
      assert.equal((await llamar("GET", `/api/materias/${ctx.materiaId}/notas`, { token: ctx.tokDocente })).status, 200);
    });
  });

  describe("Segunda revisión (Fase 7): exportar asistencia", () => {
    it("7.6: el docente exporta la asistencia de su materia y el archivo trae los registros cargados", async () => {
      const r = await llamar("GET", `/api/materias/${ctx.materiaId}/asistencias/export`, { token: ctx.tokDocente });
      assert.equal(r.status, 200, JSON.stringify(r.body));
      assert.match(r.body.filename, /^asistencia-.*\.csv$/);
      assert.ok(r.body.csv.startsWith("\uFEFF"), "lleva BOM para que Excel respete los acentos");

      const lineas = r.body.csv.replace("\uFEFF", "").split("\r\n");
      assert.match(lineas[0], /^"Alumno";"Email";"2026-10-01";"Presentes"/);
      const ana = lineas.find((l) => l.includes(ctx.alumnoA.email.toLowerCase()));
      const beto = lineas.find((l) => l.includes(ctx.alumnoB.email.toLowerCase()));
      assert.match(ana, /;"P";"1";"0";"0";"0";"100%"$/, ana);
      assert.match(beto, /;"A";"0";"1";"0";"0";"0%"$/, beto);

      const acotado = await llamar("GET", `/api/materias/${ctx.materiaId}/asistencias/export?desde=2026-11-01`, { token: ctx.tokDocente });
      assert.equal(acotado.status, 404, "sin registros en ese rango no se genera un archivo vacío");
      assert.equal((await llamar("GET", `/api/materias/${ctx.materiaId}/asistencias/export?desde=ayer`, { token: ctx.tokDocente })).status, 400);
    });

    it("7.6: solo exporta el docente asignado a la materia", async () => {
      assert.equal((await llamar("GET", `/api/materias/${ctx.materiaId}/asistencias/export`, { token: ctx.tokA })).status, 403);
      assert.equal((await llamar("GET", `/api/materias/${ctx.materiaId}/asistencias/export`, { token: ctx.profeSeed })).status, 403);
    });

    it("7.7: la tardanza cuenta como media falta y el justificado no resta, en todas las vistas", async () => {
      // Segunda clase: A llega tarde y B está presente. Con la primera (A presente, B ausente):
      //   A: P + T  → 0,5 faltas de 2 → 75 %      B: A + P → 1 falta de 2 → 50 %
      const clase = await llamar("POST", `/api/materias/${ctx.materiaId}/asistencias`, {
        token: ctx.tokDocente,
        cuerpo: {
          fecha_clase: "2026-10-08",
          registros: [
            { alumno_id: ctx.alumnoA.id, estado: "TARDANZA" },
            { alumno_id: ctx.alumnoB.id, estado: "PRESENTE" },
          ],
        },
      });
      assert.ok([200, 201].includes(clase.status), JSON.stringify(clase.body));

      const exp = await llamar("GET", `/api/materias/${ctx.materiaId}/asistencias/export`, { token: ctx.tokDocente });
      const lineas = exp.body.csv.replace("\uFEFF", "").split("\r\n");
      assert.match(lineas.find((l) => l.includes(ctx.alumnoA.email.toLowerCase())), /;"P";"T";"1";"0";"1";"0";"75%"$/);
      assert.match(lineas.find((l) => l.includes(ctx.alumnoB.email.toLowerCase())), /;"A";"P";"1";"1";"0";"0";"50%"$/);

      // Reporte de la materia: 4 registros, 1 ausencia + 1 tardanza = 1,5 faltas → 63 %.
      const rep = await llamar("GET", `/api/admin/reports?materia_id=${ctx.materiaId}`, { token: ctx.admin });
      const asistencia = rep.body.reports.find((r) => r.type === "asistencia");
      assert.equal(asistencia.headline, "63% de asistencia");
      assert.equal(asistencia.stats.find((s) => s.label === "Faltas equivalentes").value, "1,50");

      // Perfil del alumno visto por el docente: el mismo 75 % de A.
      const perfil = await llamar("GET", `/api/materias/${ctx.materiaId}/alumnos/${ctx.alumnoA.id}/perfil`, { token: ctx.tokDocente });
      assert.equal(perfil.body.perfil.asistencia.porcentaje, 75);

      // Estadísticas del propio alumno: coincide con lo que ve el docente (75 %).
      const mias = await llamar("GET", "/api/analytics/progreso", { token: ctx.tokA });
      assert.equal(mias.status, 200, JSON.stringify(mias.body));
      assert.equal(mias.body.asistencia_global, 75);
    });
  });


  describe("Administrador: baja de materia (CU-AD01 A3.1)", () => {
    it("no se puede dar de baja una materia con alumnos inscriptos", async () => {
      const r = await llamar("PUT", `/api/admin/materias/${ctx.materiaId}`, { token: ctx.admin, cuerpo: { activa: false } });
      assert.equal(r.status, 409);
      assert.match(r.body.error, /alumnos inscriptos/);
    });

    it("desmatricula a un alumno (se le avisa) y luego a todos los demás", async () => {
      const uno = await llamar("DELETE", `/api/admin/materias/${ctx.materiaId}/inscripciones/${ctx.alumnoA.id}`, {
        token: ctx.admin,
      });
      assert.equal(uno.status, 200);

      const avisos = lista((await llamar("GET", "/api/notificaciones", { token: ctx.tokA })).body, "notificaciones", "items");
      assert.ok(avisos.some((n) => /baja de matr/i.test(n.titulo)));

      const dashboard = await llamar("GET", "/api/dashboard/alumno", { token: ctx.tokA });
      assert.ok(!dashboard.body.materias.some((m) => m.id === ctx.materiaId), "ya no ve la materia");

      const resto = await llamar("DELETE", `/api/admin/materias/${ctx.materiaId}/inscripciones`, { token: ctx.admin });
      assert.equal(resto.status, 200);
      assert.equal(resto.body.cantidad, 1);
    });

    it("sin inscriptos la materia se puede dar de baja", async () => {
      const r = await llamar("PUT", `/api/admin/materias/${ctx.materiaId}`, { token: ctx.admin, cuerpo: { activa: false } });
      assert.equal(r.status, 200, JSON.stringify(r.body));
    });
  });
});
