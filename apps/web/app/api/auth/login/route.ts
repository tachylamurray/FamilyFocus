import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/server/prisma";
import { signToken } from "@/lib/server/jwt";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export async function POST(req: NextRequest) {
  try {
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
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

