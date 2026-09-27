import type { Rol } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        rol: Rol;
      };
    }
  }
}

export {};
