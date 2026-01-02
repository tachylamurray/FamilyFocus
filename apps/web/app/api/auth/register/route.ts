import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/server/prisma";

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  relationship: z.string().min(2),
  role: z.enum(["ADMIN", "MEMBER", "VIEW_ONLY"]).optional()
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid request", errors: parsed.error.errors },
        { status: 400 }
      );
    }

    const { name, email, password, relationship, role } = parsed.data;
    const existing = await prisma.user.findUnique({ where: { email } });
    
    if (existing) {
      return NextResponse.json(
        { message: "Email already registered" },
        { status: 409 }
      );
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

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

