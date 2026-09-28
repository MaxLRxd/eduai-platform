#!/usr/bin/env node
// Crea el venv de ai-services y instala requirements.txt + requirements-dev.txt.
// Resuelve el path del interpretador segun la plataforma (Scripts vs bin).
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const aiDir = join(raiz, "ai-services");
const venvDir = join(aiDir, ".venv");
const subcarpeta = process.platform === "win32" ? "Scripts" : "bin";
const sufijo = process.platform === "win32" ? ".exe" : "";

function correr(comando, args) {
  console.log(`> ${comando} ${args.join(" ")}`);
  const r = spawnSync(comando, args, { cwd: aiDir, stdio: "inherit", shell: process.platform === "win32" });
  if (r.status !== 0) {
    process.exit(r.status ?? 1);
  }
}

const pythonSistema = process.platform === "win32" ? "python" : "python3";

if (!existsSync(venvDir)) {
  console.log("Creando el venv en ai-services/.venv ...");
  correr(pythonSistema, ["-m", "venv", venvDir]);
}

const pip = join(venvDir, subcarpeta, `pip${sufijo}`);
correr(pip, ["install", "-r", "requirements.txt", "-r", "requirements-dev.txt"]);

console.log("Listo. Levantá el servicio de IA con: npm run dev:local");
