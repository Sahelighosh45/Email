import type { User } from "../db/prisma";

declare global {
  namespace Express {
    interface Request {
      user: User;
    }
  }
}

export {};
