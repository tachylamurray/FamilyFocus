import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/server/prisma";
import { requireAuth } from "@/lib/server/middleware/auth";
import { uploadToCloudinary } from "@/lib/server/cloudinary";

// Mark route as dynamic (uses cookies)
export const dynamic = 'force-dynamic';

const expenseFormSchema = z.object({
  category: z.string(),
  amount: z.string().transform((val) => {
    const num = parseFloat(val);
    if (isNaN(num)) throw new Error("Amount must be a valid number");
    return num;
  }),
  dueDate: z.string(),
  notes: z.string().optional().transform((val) => val || undefined)
});

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
    
    const expenses = await prisma.expense.findMany({
      where: {
        deletedAt: null // Only get non-deleted expenses
      },
      orderBy: { dueDate: "asc" },
      include: {
        createdBy: true
      }
    });
    
    return NextResponse.json({ expenses: expenses.map(mapExpense) });
  } catch (error: any) {
    if (error.message === "Unauthenticated") {
      return NextResponse.json(
        { message: "Unauthenticated" },
        { status: 401 }
      );
    }
    console.error("Get expenses error:", error);
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
        { message: "View-only members cannot add expenses" },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    
    // Parse form data (amount comes as string from multipart/form-data)
    const body: any = {};
    formData.forEach((value, key) => {
      if (key !== "image") {
        body[key] = value.toString();
      }
    });
    
    const parsed = expenseFormSchema.safeParse(body);
    if (!parsed.success) {
      console.error("Validation error:", parsed.error.errors);
      return NextResponse.json(
        { message: "Invalid expense data", errors: parsed.error.errors },
        { status: 400 }
      );
    }

    // Handle image upload to Cloudinary
    let imageUrl: string | null = null;
    const file = formData.get("image") as File | null;
    if (file && file.size > 0) {
      try {
        const buffer = Buffer.from(await file.arrayBuffer());
        const result = await uploadToCloudinary(buffer);
        imageUrl = result.url;
      } catch (error) {
        console.error("Failed to upload image:", error);
        return NextResponse.json(
          { message: "Failed to upload image" },
          { status: 500 }
        );
      }
    }

    const expense = await prisma.expense.create({
      data: {
        ...parsed.data,
        dueDate: new Date(parsed.data.dueDate),
        imageUrl,
        createdBy: {
          connect: { id: user.id }
        }
      },
      include: {
        createdBy: true
      }
    });

    // Log the creation
    await prisma.expenseAuditLog.create({
      data: {
        expenseId: expense.id,
        action: "CREATE",
        changedBy: user.id,
        newValues: { ...parsed.data, imageUrl }
      }
    });

    return NextResponse.json({ expense: mapExpense(expense) }, { status: 201 });
  } catch (error: any) {
    if (error.message === "Unauthenticated") {
      return NextResponse.json(
        { message: "Unauthenticated" },
        { status: 401 }
      );
    }
    console.error("Create expense error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

