/**
 * Genera docs/API_ENDPOINTS.md leyendo las rutas reales del backend, para que el listado
 * de endpoints de la documentación técnica nunca quede desactualizado.
 *
 *   npm run docs:api
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(RAIZ, "backend", "src");

const app = fs.readFileSync(path.join(SRC, "app.ts"), "utf8");

// archivo de rutas -> prefijo con el que app.ts lo monta
const importaciones = new Map(
  [...app.matchAll(/import (\w+) from "\.\/((?:modules|routes)\/[^"]+)"/g)].map((m) => [m[1], m[2]])
);
const montajes = [...app.matchAll(/app\.use\("([^"]+)",\s*(\w+)\)/g)]
  .map((m) => ({ prefijo: m[1], archivo: importaciones.get(m[2]) }))
  .filter((m) => m.archivo);

const NOMBRES = {
  auth: "Autenticación",
  materias: "Materias e inscripción",
  notas: "Notas",
  asistencias: "Asistencia",
  actividades: "Actividades, entregas y rúbricas",
  secciones: "Secciones",
  contenidos: "Contenidos y accesos",
  notificaciones: "Notificaciones",
  tutor: "Tutor IA",
  analytics: "Analytics",
  admin: "Administración",
  correccion: "Corrección IA (alternativa)",
  asistente: "Asistente docente",
  dashboard: "Dashboards",
  planning: "Planificación",
  messages: "Mensajes",
  config: "Configuración e institución",
  health: "Salud",
};

const filas = [];

for (const { prefijo, archivo } of montajes) {
  const modulo = archivo.split("/")[1]?.replace(".routes", "") ?? archivo;
  const texto = fs.readFileSync(path.join(SRC, `${archivo}.ts`), "utf8");
  const sentencias = texto.split(/(?=\brouter\.(?:get|post|put|patch|delete)\()/).slice(1);

  for (const s of sentencias) {
    const cabecera = /^router\.(get|post|put|patch|delete)\(\s*"([^"]+)"/.exec(s);
    if (!cabecera) continue;
    const [, metodo, ruta] = cabecera;
    const roles = /requireRole\(([^)]*)\)/.exec(s)?.[1].replace(/["\s]/g, "").split(",").filter(Boolean);
    const acceso = roles?.length ? roles.join(" · ") : /requireAuth/.test(s) ? "Autenticado" : "Público";
    const validacion = /validateBody\((\w+)\)/.exec(s)?.[1] ?? "";
    const limite = /limite\w*|rateLimit/.test(s) ? "sí" : "";
    const rutaCompleta = (prefijo + (ruta === "/" ? "" : ruta)).replace(/\/+$/, "") || "/";
    filas.push({ modulo, metodo: metodo.toUpperCase(), ruta: rutaCompleta, acceso, validacion, limite });
  }
}

const porModulo = Map.groupBy(filas, (f) => f.modulo);
const lineas = [
  "# Endpoints de la API",
  "",
  "> Generado automáticamente desde `backend/src/**/*.routes.ts` con `npm run docs:api`. No editar a mano.",
  "",
  `Total: **${filas.length} endpoints** en ${porModulo.size} módulos.`,
  "",
  "**Acceso:** *Público* no pide sesión; *Autenticado* cualquier rol con sesión; los demás exigen ese rol.",
  "**Validación:** esquema Zod que valida el cuerpo antes de llegar al controlador. **Límite:** limitador de intentos.",
  "",
];

for (const [modulo, rutas] of porModulo) {
  lineas.push(`## ${NOMBRES[modulo] ?? modulo}`, "", "| Método | Ruta | Acceso | Validación | Límite |", "| --- | --- | --- | --- | --- |");
  for (const r of rutas) {
    lineas.push(`| ${r.metodo} | \`${r.ruta}\` | ${r.acceso} | ${r.validacion ? `\`${r.validacion}\`` : ""} | ${r.limite} |`);
  }
  lineas.push("");
}

const destino = path.join(RAIZ, "docs", "API_ENDPOINTS.md");
fs.mkdirSync(path.dirname(destino), { recursive: true });
fs.writeFileSync(destino, lineas.join("\n"), "utf8");
console.log(`docs/API_ENDPOINTS.md: ${filas.length} endpoints en ${porModulo.size} módulos`);
