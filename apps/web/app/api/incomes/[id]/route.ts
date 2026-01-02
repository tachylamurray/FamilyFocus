import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { requireAuth } from "@/lib/server/middleware/auth";

// Mark route as dynamic (uses cookies)
export const dynamic = 'force-dynamic';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const { id } = params;

    const income = await prisma.income.findUnique({ where: { id } });
    
    if (!income) {
      return NextResponse.json(
        { message: "Income not found" },
        { status: 404 }
      );
    }

    if (user.role !== "ADMIN" && income.createdById !== user.id) {
      return NextResponse.json(
        { message: "Not allowed to delete this income" },
        { status: 403 }
      );
    }

    await prisma.income.delete({ where: { id } });
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === "Unauthenticated") {
      return NextResponse.json(
        { message: "Unauthenticated" },
        { status: 401 }
      );
    }
    console.error("Delete income error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

