import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/server/prisma";
import { sendPasswordResetCode } from "@/lib/server/email";

// Mark route as dynamic
export const dynamic = 'force-dynamic';

const forgotPasswordSchema = z.object({
  email: z.string().email()
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = forgotPasswordSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid email address" },
        { status: 400 }
      );
    }

    const { email } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json(
        {
          message: "The email you entered has never been associated with the application."
        },
        { status: 404 }
      );
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

    return NextResponse.json({
      message: "A reset code has been sent to your email address."
    });
  } catch (error: any) {
    console.error("Forgot password error:", error);
    console.error("Error name:", error?.name);
    console.error("Error message:", error?.message);
    console.error("Error stack:", error?.stack);
    console.error("Full error object:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    
    // Check for specific error types
    if (error?.message?.includes("DATABASE_URL")) {
      return NextResponse.json(
        { message: "Server configuration error: DATABASE_URL not set" },
        { status: 500 }
      );
    }
    if (error?.code === "P1001" || error?.message?.includes("Can't reach database")) {
      return NextResponse.json(
        { message: "Database connection error" },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { 
        message: "Internal server error",
        error: error?.message || "Unknown error"
      },
      { status: 500 }
    );
  }
}

