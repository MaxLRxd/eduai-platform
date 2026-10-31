/**
 * Suite E2E de EduAI: recorre los tres roles contra el stack real (backend + base de datos).
 *
 * Requisitos: stack levantado y base sembrada (`npm run db:seed --workspace backend`).
 *   E2E_BASE_URL   URL del backend (default http://127.0.0.1:3000)
 *   E2E_PASSWORD   contraseña de los usuarios del seed (default Clave1234)
 *   E2E_AI=1       además prueba lo que pasa por el ai-service (saludo, corrección de opción
 *                  múltiple). No consume tokens del LLM, pero el ai-service tiene que estar arriba.
 *
 * Uso: npm run e2e
 *
 * Cada corrida crea su propia materia y sus propios usuarios (sufijo único): se puede repetir
 * sin limpiar la base.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

const BASE = (process.env.E2E_BASE_URL ?? "http://127.0.0.1:3000").replace(/\/+$/, "");
const PASSWORD = process.env.E2E_PASSWORD ?? "Clave1234";
const CON_IA = process.env.E2E_AI === "1";
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
