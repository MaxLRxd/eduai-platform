#!/usr/bin/env node
// Ejecuta un binario del venv de ai-services resolviendo el path segun la
// plataforma: .venv\Scripts\ en Windows, .venv/bin/ en Linux/macOS.
// Antes de resolver, ofrece crearlo con `npm run ai:setup` si falta.
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const venvDir = join(raiz, "ai-services", ".venv");
const subcarpeta = process.platform === "win32" ? "Scripts" : "bin";
const sufijo = process.platform === "win32" ? ".exe" : "";

const [binario, ...args] = process.argv.slice(2);

if (!binario) {
  console.error("uso: node scripts/venv.mjs <binario> [args...]");
  process.exit(1);
}

const ejecutable = join(venvDir, subcarpeta, `${binario}${sufijo}`);

if (!existsSync(ejecutable)) {
  console.error(
    `No existe ${ejecutable}.\nEl venv de ai-services no esta creado. Ejecuta: npm run ai:setup`
  );
  process.exit(1);
}

const resultado = spawnSync(ejecutable, args, {
  cwd: join(raiz, "ai-services"),
  stdio: "inherit",
});

process.exit(resultado.status ?? 1);
