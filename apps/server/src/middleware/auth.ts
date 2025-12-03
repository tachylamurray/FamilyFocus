import { NextFunction, Request, Response } from "express";
import { verifyToken } from "../utils/jwt";
import { prisma } from "../lib/prisma";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
        canDelete: boolean;
      };
    }
  }
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const token = req.cookies["family_finance_token"];
    if (!token) {
      return res.status(401).json({ message: "Unauthenticated" });
    }
    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId }
    });
    if (!user) {
      return res.status(401).json({ message: "Unauthenticated" });
    }
    req.user = { id: user.id, role: user.role, canDelete: user.canDelete };
    next();
  } catch (error) {
    console.error(error);
    return res.status(401).json({ message: "Invalid authentication token" });
  }
}

export function requireRole(roles: Array<"ADMIN" | "MEMBER" | "VIEW_ONLY">) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthenticated" });
    }
    if (!roles.includes(user.role as "ADMIN" | "MEMBER" | "VIEW_ONLY")) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    next();
  };
}

