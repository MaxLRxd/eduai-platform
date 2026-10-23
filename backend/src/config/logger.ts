import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  // El Set-Cookie de la respuesta lleva el refresh token: nunca debe llegar a los logs.
  redact: ["req.headers.authorization", "req.headers.cookie", 'res.headers["set-cookie"]'],
});