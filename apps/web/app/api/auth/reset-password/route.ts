import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/server/prisma";

const resetPasswordSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6, "Code must be 6 digits"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/\d/, "Password must contain at least one number")
    .regex(/[!@#$%^&*(),.?":{}|<>]/, "Password must contain at least one special character")
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = resetPasswordSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid request", errors: parsed.error.errors },
        { status: 400 }
      );
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
      return NextResponse.json(
        { message: "Invalid or expired code" },
        { status: 400 }
      );
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

    return NextResponse.json({
      message: "Password reset successfully"
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

