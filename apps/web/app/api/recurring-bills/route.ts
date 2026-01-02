import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/server/prisma";
import { requireAuth } from "@/lib/server/middleware/auth";

// Mark route as dynamic (uses cookies)
export const dynamic = 'force-dynamic';

const recurringBillSchema = z.object({
  name: z.string().min(1),
  amount: z.number().min(0),
  firstDueDate: z.string(),
  frequency: z.enum(["MONTHLY", "QUARTERLY", "YEARLY", "ONE_TIME"])
});

function getDayOfMonth(date: Date): number {
  return date.getDate();
}

export async function GET() {
  try {
    await requireAuth();
    
    const bills = await prisma.recurringBill.findMany({
      orderBy: { nextDueDate: "asc" },
      include: {
        createdBy: true
      }
    });

    return NextResponse.json({
      bills: bills.map((bill) => ({
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
      }))
    });
  } catch (error: any) {
    if (error.message === "Unauthenticated") {
      return NextResponse.json(
        { message: "Unauthenticated" },
        { status: 401 }
      );
    }
    console.error("Get recurring bills error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    
    if (user.role === "VIEW_ONLY") {
      return NextResponse.json(
        { message: "View-only members cannot add recurring bills" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = recurringBillSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid bill data", errors: parsed.error.errors },
        { status: 400 }
      );
    }

    const { name, amount, firstDueDate, frequency } = parsed.data;
    const dueDate = new Date(firstDueDate);
    const dayOfMonth = getDayOfMonth(dueDate);

    const bill = await prisma.recurringBill.create({
      data: {
        name,
        amount,
        dayOfMonth,
        frequency,
        nextDueDate: dueDate,
        createdBy: {
          connect: { id: user.id }
        }
      },
      include: {
        createdBy: true
      }
    });

    return NextResponse.json(
      {
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
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.message === "Unauthenticated") {
      return NextResponse.json(
        { message: "Unauthenticated" },
        { status: 401 }
      );
    }
    console.error("Create recurring bill error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

