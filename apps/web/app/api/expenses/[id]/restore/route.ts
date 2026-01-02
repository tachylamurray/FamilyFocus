import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { requireAuth } from "@/lib/server/middleware/auth";

// Mark route as dynamic (uses cookies)
export const dynamic = 'force-dynamic';

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

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    
    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Admin access required" },
        { status: 403 }
      );
    }

    const { id } = params;

    const existing = await prisma.expense.findUnique({
      where: { id },
      include: {
        createdBy: true
      }
    });

    if (!existing) {
      return NextResponse.json(
        { message: "Expense not found" },
        { status: 404 }
      );
    }

    if (!existing.deletedAt) {
      return NextResponse.json(
        { message: "Expense is not deleted" },
        { status: 400 }
      );
    }

    const expense = await prisma.$transaction([
      prisma.expense.update({
        where: { id },
        data: { deletedAt: null },
        include: {
          createdBy: true
        }
      }),
      prisma.expenseAuditLog.create({
        data: {
          expenseId: id,
          action: "RESTORE",
          changedBy: user.id
        }
      })
    ]);

    return NextResponse.json({ expense: mapExpense(expense[0]) });
  } catch (error: any) {
    if (error.message === "Unauthenticated") {
      return NextResponse.json(
        { message: "Unauthenticated" },
        { status: 401 }
      );
    }
    console.error("Restore expense error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

