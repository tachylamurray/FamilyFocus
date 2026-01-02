import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { requireAuth } from "@/lib/server/middleware/auth";

export async function GET() {
  try {
    const user = await requireAuth();
    
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        relationship: true,
        role: true,
        canDelete: true
      }
    });

    if (!userData) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ user: userData });
  } catch (error: any) {
    if (error.message === "Unauthenticated") {
      return NextResponse.json(
        { message: "Unauthenticated" },
        { status: 401 }
      );
    }
    console.error("Get user error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

