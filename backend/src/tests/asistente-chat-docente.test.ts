import request from "supertest";
import { createServer } from "http";
import { createApp } from "../app";
import { signAccessToken } from "../middlewares/auth";
import { prisma } from "../config/prisma";
import { generarMaterialDocente } from "../config/aiClient";
import { obtenerProfesorAsignado } from "../modules/materias/materias.service";

jest.mock("../config/prisma", () => ({
  prisma: {
    sesionAsistenteDocente: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    mensajeAsistenteDocente: { create: jest.fn(), findMany: jest.fn() },
    contenido: { findMany: jest.fn() },
    planningClase: { findUnique: jest.fn() },
  },
}));

jest.mock("../config/aiClient", () => ({
  generarMaterialDocente: jest.fn(),
}));

jest.mock("../modules/materias/materias.service", () => ({
  obtenerProfesorAsignado: jest.fn(),
}));

const prismaMock = prisma as unknown as {
  sesionAsistenteDocente: {
    create: jest.Mock;
    findMany: jest.Mock;
    findUnique: jest.Mock;
    update: jest.Mock;
  };
  mensajeAsistenteDocente: { create: jest.Mock; findMany: jest.Mock };
  contenido: { findMany: jest.Mock };
};

const generarMock = generarMaterialDocente as jest.Mock;
const asignadoMock = obtenerProfesorAsignado as jest.Mock;

const PROFESOR_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const MATERIA_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const SESION_ID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const CONTENIDO_ID = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";

const sesion = {
  id: SESION_ID,
  profesor_id: PROFESOR_ID,
  materia_id: MATERIA_ID,
  titulo: null,
  iniciada_en: new Date("2026-11-22T10:00:00.000Z"),
  cerrada_en: null,
};

describe("chat persistente del asistente docente", () => {
  let server: ReturnType<typeof createServer>;
  const token = (): string =>
    signAccessToken({ sub: PROFESOR_ID, email: "profe@edu.ai", rol: "PROFESOR" });

  beforeEach(() => {
    jest.clearAllMocks();
    server = createServer(createApp() as unknown as import("http").RequestListener);
    asignadoMock.mockResolvedValue({ id: "perfil-1" });
    prismaMock.sesionAsistenteDocente.create.mockResolvedValue(sesion);
    prismaMock.sesionAsistenteDocente.findUnique.mockResolvedValue(sesion);
    prismaMock.sesionAsistenteDocente.findMany.mockResolvedValue([sesion]);
    prismaMock.sesionAsistenteDocente.update.mockResolvedValue(sesion);
    prismaMock.mensajeAsistenteDocente.findMany.mockResolvedValue([]);
    prismaMock.contenido.findMany.mockResolvedValue([{ id: CONTENIDO_ID }]);
    generarMock.mockResolvedValue({
      material: "Material generado",
      sources: [{ material_id: CONTENIDO_ID, content: "Fragmento", score: 0.9 }],
    });
  });

  afterEach(() => {
    server.close();
  });

  it("crea una sesión para una materia asignada", async () => {
    const res = await request(server)
      .post("/api/asistente/sesiones")
      .set("Authorization", `Bearer ${token()}`)
      .send({ materia_id: MATERIA_ID });

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(SESION_ID);
    expect(prismaMock.sesionAsistenteDocente.create).toHaveBeenCalled();
  });

  it("rechaza un material que no pertenece a la materia", async () => {
    prismaMock.contenido.findMany.mockResolvedValueOnce([]);
    const otroId = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";

    const res = await request(server)
      .post(`/api/asistente/sesiones/${SESION_ID}/mensajes`)
      .set("Authorization", `Bearer ${token()}`)
      .send({ prompt: "Generá actividades", content_ids: [otroId] });

    expect(res.status).toBe(400);
    expect(generarMock).not.toHaveBeenCalled();
  });

  it("guarda el intercambio y restringe el RAG a los materiales elegidos", async () => {
    prismaMock.mensajeAsistenteDocente.create
      .mockResolvedValueOnce({ id: "mensaje-1", rol: "USER", contenido: "Generá actividades", sources: null, creado_en: new Date() })
      .mockResolvedValueOnce({
        id: "mensaje-2",
        rol: "ASSISTANT",
        contenido: "Material generado",
        sources: [{ material_id: CONTENIDO_ID, content: "Fragmento", score: 0.9 }],
        creado_en: new Date(),
      });

    const res = await request(server)
      .post(`/api/asistente/sesiones/${SESION_ID}/mensajes`)
      .set("Authorization", `Bearer ${token()}`)
      .send({ prompt: "Generá actividades", content_ids: [CONTENIDO_ID] });

    expect(res.status).toBe(200);
    expect(generarMock).toHaveBeenCalledWith(MATERIA_ID, "Generá actividades", [CONTENIDO_ID]);
    expect(res.body.contenido).toBe("Material generado");
    expect(prismaMock.mensajeAsistenteDocente.create).toHaveBeenCalledTimes(2);
  });
});
