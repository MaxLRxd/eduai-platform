/**
 * Benchmark del tutor IA: mide lo que ve el alumno al preguntar (CU-A04: "primera respuesta
 * visible en menos de 3 segundos").
 *
 *   npm run benchmark:tutor
 *
 * Variables:
 *   E2E_BASE_URL     backend (default http://127.0.0.1:3000)
 *   BENCH_EMAIL      alumno que pregunta (default alumno1@ies.edu)
 *   BENCH_PASSWORD   su contraseña (default Clave1234)
 *   BENCH_MATERIA    id de la materia (default: la primera en la que está inscripto)
 *   BENCH_N          cantidad de preguntas (default 10)
 *   BENCH_STRICT=1   termina con error si no se cumple el objetivo
 *
 * IMPORTANTE: la materia tiene que tener material ya indexado; si no, el tutor contesta
 * "no tengo información" sin llamar al modelo y la medición no representa nada.
 * Usa el LLM real: cada pregunta consume tokens.
 */
const BASE = (process.env.E2E_BASE_URL ?? "http://127.0.0.1:3000").replace(/\/+$/, "");
const EMAIL = process.env.BENCH_EMAIL ?? "alumno1@ies.edu";
const PASSWORD = process.env.BENCH_PASSWORD ?? "Clave1234";
const N = Number(process.env.BENCH_N ?? 10);
const UMBRAL_MS = 3000;
const OBJETIVO = 90;

const PREGUNTAS = [
  "¿Qué es una red de computadoras?",
  "¿Cuál es la diferencia entre una LAN y una WAN?",
  "Explicame para qué sirve el protocolo TCP.",
  "¿Qué función cumple un router?",
  "¿Qué es una dirección IP?",
  "Dame un ejemplo de topología de red.",
  "¿Qué es un switch y en qué se diferencia de un hub?",
  "¿Para qué sirve el DNS?",
  "¿Qué es el modelo OSI?",
  "¿Qué es el ancho de banda?",
];

async function api(metodo, ruta, token, cuerpo) {
  const res = await fetch(BASE + ruta, {
    method: metodo,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${metodo} ${ruta} -> ${res.status} ${JSON.stringify(json)}`);
  return json;
}

/** Hace una pregunta por streaming y devuelve { primerTokenMs, totalMs, caracteres }. */
async function preguntar(token, sesionId, contenido) {
  const inicio = performance.now();
  const res = await fetch(`${BASE}/api/tutor/sesiones/${sesionId}/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ contenido }),
  });
  if (!res.ok || !res.body) throw new Error(`stream -> ${res.status}`);

  const lector = res.body.getReader();
  const decoder = new TextDecoder();
  let primerTokenMs = null;
  let caracteres = 0;

  for (;;) {
    const { done, value } = await lector.read();
    if (done) break;
    const texto = decoder.decode(value, { stream: true });
    const tokens = [...texto.matchAll(/"type":\s*"token",\s*"text":\s*"((?:[^"\\]|\\.)*)"/g)];
    if (tokens.length > 0) {
      if (primerTokenMs === null) primerTokenMs = performance.now() - inicio;
      caracteres += tokens.reduce((s, m) => s + m[1].length, 0);
    }
  }
  return { primerTokenMs, totalMs: performance.now() - inicio, caracteres };
}

function percentil(ordenados, p) {
  if (ordenados.length === 0) return 0;
  return ordenados[Math.max(0, Math.min(ordenados.length - 1, Math.ceil((p / 100) * ordenados.length) - 1))];
}

const seg = (ms) => `${(ms / 1000).toFixed(2)} s`;

const token = (await api("POST", "/api/auth/login", null, { email: EMAIL, password: PASSWORD })).accessToken;
const materias = (await api("GET", "/api/materias/mias", token)).materias;
const materiaId = process.env.BENCH_MATERIA ?? materias[0]?.id;
if (!materiaId) throw new Error("El alumno no está inscripto en ninguna materia.");

console.log(`Benchmark del tutor · ${BASE} · ${N} preguntas · materia ${materiaId}\n`);

const sesion = (await api("POST", `/api/materias/${materiaId}/tutor/sesiones`, token, { modo: "NORMAL" })).sesion;
const filas = [];

for (let i = 0; i < N; i++) {
  const pregunta = PREGUNTAS[i % PREGUNTAS.length];
  const r = await preguntar(token, sesion.id, pregunta);
  filas.push(r);
  const sinMaterial = r.caracteres > 0 && r.caracteres < 140;
  console.log(
    `${String(i + 1).padStart(2)}. primera respuesta ${r.primerTokenMs === null ? "—" : seg(r.primerTokenMs)} · completa ${seg(r.totalMs)} · ${r.caracteres} caracteres${sinMaterial ? "  (¿sin material indexado?)" : ""}  ${pregunta}`
  );
}

const primeras = filas.map((f) => f.primerTokenMs).filter((v) => v !== null).sort((a, b) => a - b);
const totales = filas.map((f) => f.totalMs).sort((a, b) => a - b);
const bajo = primeras.filter((v) => v <= UMBRAL_MS).length;
const porcentaje = primeras.length ? Math.round((bajo / primeras.length) * 1000) / 10 : 0;
const cumple = primeras.length > 0 && porcentaje >= OBJETIVO;

console.log("\nPrimera respuesta visible");
console.log(`  mediana ${seg(percentil(primeras, 50))} · p95 ${seg(percentil(primeras, 95))} · máx ${seg(primeras.at(-1) ?? 0)}`);
console.log(`  ${porcentaje}% en menos de ${seg(UMBRAL_MS)} (objetivo ${OBJETIVO}%)  →  ${cumple ? "CUMPLE" : "NO CUMPLE"}`);
console.log("Respuesta completa");
console.log(`  mediana ${seg(percentil(totales, 50))} · p95 ${seg(percentil(totales, 95))}`);

if (process.env.BENCH_STRICT === "1" && !cumple) process.exit(1);
