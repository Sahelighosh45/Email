import { Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import { prisma, type User } from "../db/prisma";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const JWT_SECRET = process.env.JWT_SECRET || "reachinbox-dev-secret-key";
const client = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

/**
 * ============================
 * GOOGLE LOGIN
 * ============================
 */
export const googleLogin = async (req: Request, res: Response) => {
  try {
    const { idToken, email: demoEmail, name: demoName } = req.body as {
      idToken?: string;
      email?: string;
      name?: string;
    };

    if (!idToken) {
      return res.status(400).json({ message: "idToken missing" });
    }

    let sub: string | undefined;
    let email: string | undefined;
    let name: string | undefined;
    let picture: string | undefined;

    if (client && GOOGLE_CLIENT_ID && idToken !== "demo-google-token") {
      // Verify real Google token
      const ticket = await client.verifyIdToken({
        idToken,
        audience: GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        return res.status(401).json({ message: "Invalid Google token" });
      }

      sub = payload.sub;
      email = payload.email;
      name = payload.name;
      picture = payload.picture;
    } else {
      // Demo / local fallback when Google OAuth is not configured
      sub = "demo-google-user";
      email = demoEmail || "demo@reachinbox.ai";
      name = demoName || "ReachInbox User";
      picture = "";
    }

    if (!sub || !email) {
      return res.status(400).json({ message: "Incomplete Google profile" });
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { googleId: sub },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          googleId: sub,
          email,
          name: name ?? "",
          avatar: picture ?? "",
        },
      });
    }

    // Issue JWT
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        name: user.name,
        googleId: user.googleId,
        avatar: user.avatar,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
    });
  } catch (err) {
    console.error("Google auth error:", err);
    return res.status(500).json({ message: "Google auth failed" });
  }
};

/**
 * ============================
 * GET LOGGED IN USER
 * ============================
 */
export const getMe = async (req: Request, res: Response) => {
  const user = req.user as User | undefined;

  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  return res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
  });
};
