import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { requireAuth } from "@/lib/server/middleware/auth";
import { uploadToCloudinary } from "@/lib/server/cloudinary";

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

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
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

    if (existing.deletedAt) {
      return NextResponse.json(
        { message: "Expense has been deleted" },
        { status: 410 }
      );
    }

    const ownsExpense = existing.createdById === user.id;
    if (user.role !== "ADMIN" && !ownsExpense) {
      return NextResponse.json(
        { message: "Not allowed to edit this expense" },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    
    // Parse form data (fields come as strings from multipart/form-data)
    const updateData: any = {};
    const body: any = {};
    formData.forEach((value, key) => {
      if (key !== "image") {
        body[key] = value.toString();
      }
    });

    if (body.category !== undefined) updateData.category = body.category;
    if (body.amount !== undefined) {
      const amount = parseFloat(body.amount);
      if (isNaN(amount)) {
        return NextResponse.json(
          { message: "Invalid amount" },
          { status: 400 }
        );
      }
      updateData.amount = amount;
    }
    if (body.dueDate !== undefined) updateData.dueDate = new Date(body.dueDate);
    if (body.notes !== undefined) updateData.notes = body.notes || null;

    // Handle image upload to Cloudinary - if new image is uploaded, use it, otherwise keep existing
    let imageUrl = existing.imageUrl;
    const file = formData.get("image") as File | null;
    if (file && file.size > 0) {
      try {
        const buffer = Buffer.from(await file.arrayBuffer());
        const result = await uploadToCloudinary(buffer);
        imageUrl = result.url;
        updateData.imageUrl = imageUrl;
      } catch (error) {
        console.error("Failed to upload image:", error);
        return NextResponse.json(
          { message: "Failed to upload image" },
          { status: 500 }
        );
      }
    } else if (imageUrl) {
      updateData.imageUrl = imageUrl;
    }

    // Store old values for audit log
    const oldValues = {
      category: existing.category,
      amount: Number(existing.amount),
      dueDate: existing.dueDate.toISOString(),
      notes: existing.notes,
      imageUrl: existing.imageUrl
    };

    const expense = await prisma.expense.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: true
      }
    });

    // Log the update
    await prisma.expenseAuditLog.create({
      data: {
        expenseId: id,
        action: "UPDATE",
        changedBy: user.id,
        oldValues,
        newValues: updateData
      }
    });

    return NextResponse.json({ expense: mapExpense(expense) });
  } catch (error: any) {
    if (error.message === "Unauthenticated") {
      return NextResponse.json(
        { message: "Unauthenticated" },
        { status: 401 }
      );
    }
    console.error("Update expense error:", error);
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

    if (existing.deletedAt) {
      return NextResponse.json(
        { message: "Expense has already been deleted" },
        { status: 410 }
      );
    }

    // Admins can always delete expenses, or users with canDelete permission
    if (user.role !== "ADMIN" && !user.canDelete) {
      return NextResponse.json(
        { message: "You do not have permission to delete expenses" },
        { status: 403 }
      );
    }

    // Soft delete instead of hard delete
    await prisma.$transaction([
      prisma.expense.update({
        where: { id },
        data: { deletedAt: new Date() }
      }),
      // Log the deletion
      prisma.expenseAuditLog.create({
        data: {
          expenseId: id,
          action: "DELETE",
          changedBy: user.id,
          oldValues: {
            category: existing.category,
            amount: Number(existing.amount),
            dueDate: existing.dueDate.toISOString(),
            notes: existing.notes
          }
        }
      })
    ]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === "Unauthenticated") {
      return NextResponse.json(
        { message: "Unauthenticated" },
        { status: 401 }
      );
    }
    console.error("Delete expense error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

