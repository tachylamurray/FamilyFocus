import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { signToken } from "../utils/jwt";
import { requireAuth } from "../middleware/auth";

const router = Router();

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  relationship: z.string().min(2),
  role: z.enum(["ADMIN", "MEMBER", "VIEW_ONLY"]).optional()
});

router.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid request", errors: parsed.error.errors });
  }

  const { name, email, password, relationship, role } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ message: "Email already registered" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      relationship,
      role: role ?? "MEMBER",
      passwordHash
    },
    select: {
      id: true,
      name: true,
      email: true,
      relationship: true,
      role: true
    }
  });

  return res.status(201).json({ user });
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid credentials" });
  }
  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = signToken({ userId: user.id });
  const isProduction = process.env.NODE_ENV === "production" || process.env.RAILWAY_ENVIRONMENT === "production";
  res.cookie("family_finance_token", token, {
    httpOnly: true,
    sameSite: isProduction ? "none" : "lax",
    secure: isProduction,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    domain: isProduction ? undefined : undefined // Let browser handle domain for cross-origin
  });

  return res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      relationship: user.relationship,
      role: user.role,
      canDelete: user.canDelete
    }
  });
});

router.post("/logout", (_req, res) => {
  const isProduction = process.env.NODE_ENV === "production" || process.env.RAILWAY_ENVIRONMENT === "production";
  res.clearCookie("family_finance_token", {
    httpOnly: true,
    sameSite: isProduction ? "none" : "lax",
    secure: isProduction
  });
  return res.json({ success: true });
});

router.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true,
      name: true,
      email: true,
      relationship: true,
      role: true,
      canDelete: true
    }
  });
  return res.json({ user });
});

const updateProfileSchema = z.object({
  name: z.string().min(2).max(100)
});

router.put("/profile", requireAuth, async (req, res) => {
  const parsed = updateProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid request", errors: parsed.error.errors });
  }

  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: {
      name: parsed.data.name
    },
    select: {
      id: true,
      name: true,
      email: true,
      relationship: true,
      role: true,
      canDelete: true
    }
  });

  return res.json({ user });
});

export default router;

