import { Request } from "express";
import type { User } from "../db/prisma";

export interface RequestWithUser extends Request {
  user: User;
}
