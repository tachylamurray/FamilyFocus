import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/server/prisma";
import { signToken } from "@/lib/server/jwt";

// Mark route as dynamic (uses cookies)
export const dynamic = 'force-dynamic';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export async function POST(req: NextRequest) {
  try {
    // Verify environment variables are set
    if (!process.env.DATABASE_URL) {
      console.error("DATABASE_URL is not set");
      return NextResponse.json(
        { message: "Server configuration error" },
        { status: 500 }
      );
    }
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not set");
      return NextResponse.json(
        { message: "Server configuration error" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Incorrect email or password. Please try again." },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      return NextResponse.json(
        { message: "Incorrect email or password. Please try again." },
        { status: 401 }
      );
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return NextResponse.json(
        { message: "Incorrect email or password. Please try again." },
        { status: 401 }
      );
    }

    const token = signToken({ userId: user.id });
    const isProduction = process.env.NODE_ENV === "production";
    
    const response = NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        relationship: user.relationship,
        role: user.role,
        canDelete: user.canDelete
      }
    });

    response.cookies.set("family_finance_token", token, {
      httpOnly: true,
      sameSite: isProduction ? "none" : "lax",
      secure: isProduction,
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
      path: "/"
    });

    return response;
  } catch (error: any) {
    console.error("Login error:", error);
    // Log more details in production for debugging
    const errorMessage = error?.message || "Unknown error";
    const errorStack = process.env.NODE_ENV === "development" ? error?.stack : undefined;
    console.error("Error details:", { errorMessage, errorStack, error });
    
    return NextResponse.json(
      { 
        message: "Internal server error",
        // Only include error details in development
        ...(process.env.NODE_ENV === "development" && { error: errorMessage })
      },
      { status: 500 }
    );
  }
}

