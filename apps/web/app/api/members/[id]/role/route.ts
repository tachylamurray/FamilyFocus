import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/server/prisma";
import { requireRole } from "@/lib/server/middleware/auth";

// Mark route as dynamic (uses cookies)
export const dynamic = 'force-dynamic';

const updateRoleSchema = z.object({
  role: z.enum(["ADMIN", "MEMBER", "VIEW_ONLY"])
});

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireRole(["ADMIN"]);
    const { id } = params;
    
    // Prevent admins from changing their own role
    if (id === user.id) {
      return NextResponse.json(
        { message: "Cannot change your own role" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const parsed = updateRoleSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid request", errors: parsed.error.errors },
        { status: 400 }
      );
    }

    const userToUpdate = await prisma.user.findUnique({ where: { id } });
    if (!userToUpdate) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role: parsed.data.role },
      select: {
        id: true,
        name: true,
        email: true,
        relationship: true,
        role: true,
        canDelete: true
      }
    });

    return NextResponse.json({ member: updatedUser });
  } catch (error: any) {
    if (error.message === "Unauthenticated" || error.message === "Insufficient permissions") {
      return NextResponse.json(
        { message: error.message },
        { status: error.message === "Unauthenticated" ? 401 : 403 }
      );
    }
    console.error("Update member role error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

