import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/server/prisma";
import { requireAuth } from "@/lib/server/middleware/auth";

// Mark route as dynamic (uses cookies)
export const dynamic = 'force-dynamic';

const incomeSchema = z.object({
  source: z.string().min(2),
  amount: z.number(),
  receivedDate: z.string()
});

export async function GET() {
  try {
    await requireAuth();
    
    const incomes = await prisma.income.findMany({
      orderBy: { receivedDate: "desc" }
    });
    
    return NextResponse.json({
      incomes: incomes.map((income) => ({
        ...income,
        amount: Number(income.amount)
      }))
    });
  } catch (error: any) {
    if (error.message === "Unauthenticated") {
      return NextResponse.json(
        { message: "Unauthenticated" },
        { status: 401 }
      );
    }
    console.error("Get incomes error:", error);
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
        { message: "View-only members cannot add income" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = incomeSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid income data" },
        { status: 400 }
      );
    }

    const income = await prisma.income.create({
      data: {
        ...parsed.data,
        amount: parsed.data.amount,
        receivedDate: new Date(parsed.data.receivedDate),
        createdById: user.id
      }
    });

    return NextResponse.json(
      {
        income: {
          ...income,
          amount: Number(income.amount)
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
    console.error("Create income error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

