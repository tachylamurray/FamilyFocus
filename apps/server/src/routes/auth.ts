import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { signToken } from "../utils/jwt";
import { requireAuth } from "../middleware/auth";
import { sendPasswordResetCode } from "../utils/email";

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

  // Check if this is the first user - make them admin automatically
  const userCount = await prisma.user.count();
  const isFirstUser = userCount === 0;
  
  // Determine role: use provided role, or ADMIN if first user, or MEMBER
  const finalRole = role ?? (isFirstUser ? "ADMIN" : "MEMBER");

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      relationship,
      role: finalRole,
      passwordHash,
      canDelete: finalRole === "ADMIN" // Admins can delete by default
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
    return res.status(400).json({ message: "Incorrect email or password. Please try again." });
  }
  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ message: "Incorrect email or password. Please try again." });
  }

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    return res.status(401).json({ message: "Incorrect email or password. Please try again." });
  }

  const token = signToken({ userId: user.id });
  const isProduction = process.env.NODE_ENV === "production" || process.env.RAILWAY_ENVIRONMENT === "production";
  res.cookie("family_finance_token", token, {
    httpOnly: true,
    sameSite: isProduction ? "none" : "lax",
    secure: isProduction,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/" // Ensure cookie is available for all routes
    // Don't set domain - let browser handle it for cross-origin
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
    secure: isProduction,
    path: "/"
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

// Password Reset Endpoints

const forgotPasswordSchema = z.object({
  email: z.string().email()
});

router.post("/forgot-password", async (req, res) => {
  const parsed = forgotPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid email address" });
  }

  const { email } = parsed.data;

  // Check if user exists
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return res.status(404).json({
      message: "The email you entered has never been associated with the application."
    });
  }

  // Generate 6-digit code (000000-999999)
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  // Set expiration to 15 minutes from now
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 15);

  // Invalidate any existing unused codes for this user
  await prisma.passwordResetToken.updateMany({
    where: {
      userId: user.id,
      usedAt: null,
      expiresAt: { gt: new Date() }
    },
    data: {
      usedAt: new Date() // Mark as used
    }
  });

  // Create new reset token
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      email: user.email,
      code,
      expiresAt
    }
  });

  // Send email with code
  await sendPasswordResetCode(email, code);

  return res.json({
    message: "A reset code has been sent to your email address."
  });
});

const verifyResetCodeSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6, "Code must be 6 digits")
});

router.post("/verify-reset-code", async (req, res) => {
  const parsed = verifyResetCodeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid request", errors: parsed.error.errors });
  }

  const { email, code } = parsed.data;

  // Find valid reset token
  const resetToken = await prisma.passwordResetToken.findFirst({
    where: {
      email,
      code,
      usedAt: null,
      expiresAt: { gt: new Date() }
    },
    include: {
      user: true
    }
  });

  if (!resetToken) {
    return res.status(400).json({ message: "Invalid or expired code" });
  }

  // Mark code as used
  await prisma.passwordResetToken.update({
    where: { id: resetToken.id },
    data: { usedAt: new Date() }
  });

  // Return success (code is verified, user can proceed to reset password)
  return res.json({
    message: "Code verified successfully",
    email: resetToken.email
  });
});

const resetPasswordSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6, "Code must be 6 digits"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/\d/, "Password must contain at least one number")
    .regex(/[!@#$%^&*(),.?":{}|<>]/, "Password must contain at least one special character")
});

router.post("/reset-password", async (req, res) => {
  const parsed = resetPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid request", errors: parsed.error.errors });
  }

  const { email, code, newPassword } = parsed.data;

  // Verify code is valid and not used
  const resetToken = await prisma.passwordResetToken.findFirst({
    where: {
      email,
      code,
      usedAt: null,
      expiresAt: { gt: new Date() }
    },
    include: {
      user: true
    }
  });

  if (!resetToken || !resetToken.user) {
    return res.status(400).json({ message: "Invalid or expired code" });
  }

  // Hash new password
  const passwordHash = await bcrypt.hash(newPassword, 10);

  // Update user password
  await prisma.user.update({
    where: { id: resetToken.user.id },
    data: { passwordHash }
  });

  // Invalidate all reset tokens for this user
  await prisma.passwordResetToken.updateMany({
    where: {
      userId: resetToken.user.id,
      usedAt: null
    },
    data: {
      usedAt: new Date()
    }
  });

  return res.json({
    message: "Password reset successfully"
  });
});

export default router;

