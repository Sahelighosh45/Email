import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../db/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "reachinbox-dev-secret-key";

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Invalid token format" });
    }

    const decoded = jwt.verify(
      token,
      JWT_SECRET
    ) as jwt.JwtPayload;

    if (
      !decoded ||
      typeof decoded !== "object" ||
      typeof decoded.userId !== "string"
    ) {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    let user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user && typeof decoded.email === "string") {
      user = await prisma.user.findUnique({
        where: { googleId: typeof decoded.googleId === "string" ? decoded.googleId : decoded.userId },
      });
      if (!user) {
        user = await prisma.user.create({
          data: {
            id: decoded.userId,
            googleId: typeof decoded.googleId === "string" ? decoded.googleId : decoded.userId,
            email: decoded.email,
            name: typeof decoded.name === "string" ? decoded.name : "ReachInbox User",
            avatar: typeof decoded.avatar === "string" ? decoded.avatar : "",
          },
        });
      }
    }

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // @ts-ignore
    req.user = user;

    next();
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized" });
  }
};