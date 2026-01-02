import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/server/prisma";

const verifyResetCodeSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6, "Code must be 6 digits")
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = verifyResetCodeSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid request", errors: parsed.error.errors },
        { status: 400 }
      );
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
      return NextResponse.json(
        { message: "Invalid or expired code" },
        { status: 400 }
      );
    }

    // Mark code as used
    await prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() }
    });

    // Return success (code is verified, user can proceed to reset password)
    return NextResponse.json({
      message: "Code verified successfully",
      email: resetToken.email
    });
  } catch (error) {
    console.error("Verify reset code error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

