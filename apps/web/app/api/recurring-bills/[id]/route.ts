import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/server/prisma";
import { requireAuth } from "@/lib/server/middleware/auth";

const recurringBillSchema = z.object({
  name: z.string().min(1),
  amount: z.number().min(0),
  firstDueDate: z.string(),
  frequency: z.enum(["MONTHLY", "QUARTERLY", "YEARLY", "ONE_TIME"])
});

function getDayOfMonth(date: Date): number {
  return date.getDate();
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const { id } = params;

    const body = await req.json();
    const parsed = recurringBillSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid bill data", errors: parsed.error.errors },
        { status: 400 }
      );
    }

    const existing = await prisma.recurringBill.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { message: "Recurring bill not found" },
        { status: 404 }
      );
    }

    const { name, amount, firstDueDate, frequency } = parsed.data;
    const dueDate = new Date(firstDueDate);
    const dayOfMonth = getDayOfMonth(dueDate);

    const bill = await prisma.recurringBill.update({
      where: { id },
      data: {
        name,
        amount,
        dayOfMonth,
        frequency,
        nextDueDate: dueDate
      },
      include: {
        createdBy: true
      }
    });

    return NextResponse.json({
      bill: {
        id: bill.id,
        name: bill.name,
        amount: Number(bill.amount),
        dayOfMonth: bill.dayOfMonth,
        frequency: bill.frequency,
        nextDueDate: bill.nextDueDate.toISOString(),
        createdBy: bill.createdBy
          ? {
              id: bill.createdBy.id,
              name: bill.createdBy.name,
              email: bill.createdBy.email,
              relationship: bill.createdBy.relationship,
              role: bill.createdBy.role
            }
          : null,
        createdAt: bill.createdAt.toISOString(),
        updatedAt: bill.updatedAt.toISOString()
      }
    });
  } catch (error: any) {
    if (error.message === "Unauthenticated") {
      return NextResponse.json(
        { message: "Unauthenticated" },
        { status: 401 }
      );
    }
    console.error("Update recurring bill error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const { id } = params;

    const existing = await prisma.recurringBill.findUnique({ where: { id } });
    
    if (!existing) {
      return NextResponse.json(
        { message: "Recurring bill not found" },
        { status: 404 }
      );
    }

    if (user.role !== "ADMIN" && existing.createdById !== user.id) {
      return NextResponse.json(
        { message: "Not allowed to delete this bill" },
        { status: 403 }
      );
    }

    await prisma.recurringBill.delete({ where: { id } });
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === "Unauthenticated") {
      return NextResponse.json(
        { message: "Unauthenticated" },
        { status: 401 }
      );
    }
    console.error("Delete recurring bill error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

