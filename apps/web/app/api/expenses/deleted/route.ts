import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { requireAuth } from "@/lib/server/middleware/auth";

function mapExpense(expense: any) {
  return {
    ...expense,
    amount: Number(expense.amount),
    createdBy: expense.createdBy
      ? {
          id: expense.createdBy.id,
          name: expense.createdBy.name,
          email: expense.createdBy.email,
          relationship: expense.createdBy.relationship,
          role: expense.createdBy.role
        }
      : null
  };
}

export async function GET() {
  try {
    const user = await requireAuth();
    
    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Admin access required" },
        { status: 403 }
      );
    }

    const deleted = await prisma.expense.findMany({
      where: {
        deletedAt: { not: null }
      },
      orderBy: { deletedAt: "desc" },
      include: {
        createdBy: true
      }
    });

    return NextResponse.json({ expenses: deleted.map(mapExpense) });
  } catch (error: any) {
    if (error.message === "Unauthenticated") {
      return NextResponse.json(
        { message: "Unauthenticated" },
        { status: 401 }
      );
    }
    console.error("Get deleted expenses error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

