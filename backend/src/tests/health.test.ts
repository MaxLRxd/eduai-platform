import request from "supertest";
import { createApp } from "../app";
import { createServer } from "http";
import { prisma } from "../config/prisma";

jest.mock("../config/prisma", () => ({
  prisma: {
    $queryRaw: jest.fn().mockResolvedValue([{ "?column?": 1 }]),
  },
}));

describe("health endpoint", () => {
  let server: ReturnType<typeof createServer>;
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    app = createApp();
    server = createServer(app as unknown as import("http").RequestListener);
  });

  afterEach(() => {
    server.close();
  });

  it("returns ok with db up", async () => {
    const res = await request(server).get("/api/healthz");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.db).toBe("ok");
  });

  it("returns 404 for unknown routes", async () => {
    const res = await request(server).get("/api/nonexistent");
    expect(res.status).toBe(404);
  });

  it("root returns service info", async () => {
    const res = await request(server).get("/");
    expect(res.status).toBe(200);
    expect(res.body.service).toBe("eduai-backend");
  });
});

void prisma;