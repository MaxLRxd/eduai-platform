import { EventEmitter } from "node:events";
import type { NextFunction, Request, Response } from "express";
import { rateLimit } from "../middlewares/security";

type Opciones = Parameters<typeof rateLimit>[0];

/** Simula una peticion que termina con el status dado y devuelve el error que recibio next(). */
function pedir(limite: ReturnType<typeof rateLimit>, email: string, status: number, ip = "10.0.0.1") {
  const req = { ip, baseUrl: "/api/auth", path: "/login", body: { email } } as unknown as Request;
  const res = Object.assign(new EventEmitter(), {
    statusCode: status,
    setHeader: jest.fn(),
  }) as unknown as Response;
  let error: unknown;
  const next = ((e?: unknown) => {
    error = e;
  }) as NextFunction;

  limite(req, res, next);
  res.emit("finish");
  return error as { statusCode: number } | undefined;
}

describe("rateLimit", () => {
  const entorno = process.env.NODE_ENV;

  beforeEach(() => {
    // El limitador se apaga bajo NODE_ENV=test; aca se prueba el comportamiento real.
    process.env.NODE_ENV = "development";
  });

  afterEach(() => {
    process.env.NODE_ENV = entorno;
  });

  const limite = (extra: Partial<Opciones> = {}) =>
    rateLimit({ max: 3, ventanaMs: 60_000, soloFallos: true, porEmail: true, ...extra });

  it("bloquea una cuenta despues de superar los intentos fallidos", () => {
    const l = limite();
    for (let i = 0; i < 3; i++) expect(pedir(l, "a@edu.ai", 401)).toBeUndefined();

    expect(pedir(l, "a@edu.ai", 401)?.statusCode).toBe(429);
  });

  it("los logins correctos no gastan cupo: un aula completa puede ingresar", () => {
    const l = limite();
    for (let i = 0; i < 40; i++) {
      expect(pedir(l, `alumno${i}@edu.ai`, 200)).toBeUndefined();
      expect(pedir(l, "mismo@edu.ai", 200)).toBeUndefined();
    }
  });

  it("los fallos de una cuenta no bloquean a otra desde la misma IP", () => {
    const l = limite();
    for (let i = 0; i < 4; i++) pedir(l, "victima@edu.ai", 401);

    expect(pedir(l, "otra@edu.ai", 200)).toBeUndefined();
  });

  it("el email se compara sin distinguir mayusculas", () => {
    const l = limite();
    for (let i = 0; i < 3; i++) pedir(l, "Ana@Edu.ai", 401);

    expect(pedir(l, "ana@edu.ai", 401)?.statusCode).toBe(429);
  });

  it("sin porEmail el contador es por IP", () => {
    const l = limite({ porEmail: false });
    for (let i = 0; i < 3; i++) pedir(l, `x${i}@edu.ai`, 401);

    expect(pedir(l, "otro@edu.ai", 401)?.statusCode).toBe(429);
    expect(pedir(l, "otro@edu.ai", 401, "10.0.0.2")).toBeUndefined();
  });
});
