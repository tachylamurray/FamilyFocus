import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { upload } from "../middleware/upload";

const router = Router();

const expenseSchema = z.object({
  category: z.string(),
  amount: z.number(),
  dueDate: z.string(),
  notes: z.string().optional()
});

// Schema for form data (multipart/form-data sends everything as strings)
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

router.get("/", requireAuth, async (req, res) => {
  const expenses = await prisma.expense.findMany({
    where: {
      deletedAt: null // Only get non-deleted expenses
    },
    orderBy: { dueDate: "asc" },
    include: {
      createdBy: true
    }
  });
  return res.json({ expenses: expenses.map(mapExpense) });
});

router.post("/", requireAuth, upload.single("image"), async (req, res) => {
  if (req.user?.role === "VIEW_ONLY") {
    return res.status(403).json({ message: "View-only members cannot add expenses" });
  }

  // Parse form data (amount comes as string from multipart/form-data)
  const parsed = expenseFormSchema.safeParse(req.body);
  if (!parsed.success) {
    console.error("Validation error:", parsed.error.errors);
    return res.status(400).json({ message: "Invalid expense data", errors: parsed.error.errors });
  }

  // Handle image upload
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

  const expense = await prisma.expense.create({
    data: {
      ...parsed.data,
      dueDate: new Date(parsed.data.dueDate),
      imageUrl,
      createdBy: {
        connect: { id: req.user!.id }
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
      changedBy: req.user!.id,
      newValues: { ...parsed.data, imageUrl }
    }
  });

  return res.status(201).json({ expense: mapExpense(expense) });
});

router.put("/:id", requireAuth, upload.single("image"), async (req, res) => {
  const { id } = req.params;
  const existing = await prisma.expense.findUnique({
    where: { id },
    include: {
      createdBy: true
    }
  });
  if (!existing) {
    return res.status(404).json({ message: "Expense not found" });
  }
  if (existing.deletedAt) {
    return res.status(410).json({ message: "Expense has been deleted" });
  }
  const user = req.user!;
  const ownsExpense = existing.createdById === user.id;
  if (user.role !== "ADMIN" && !ownsExpense) {
    return res.status(403).json({ message: "Not allowed to edit this expense" });
  }

  // Parse form data (fields come as strings from multipart/form-data)
  // Only validate fields that are present
  const updateData: any = {};
  if (req.body.category !== undefined) updateData.category = req.body.category;
  if (req.body.amount !== undefined) {
    const amount = parseFloat(req.body.amount);
    if (isNaN(amount)) {
      return res.status(400).json({ message: "Invalid amount" });
    }
    updateData.amount = amount;
  }
  if (req.body.dueDate !== undefined) updateData.dueDate = new Date(req.body.dueDate);
  if (req.body.notes !== undefined) updateData.notes = req.body.notes || null;

  // Handle image upload - if new image is uploaded, use it, otherwise keep existing
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : existing.imageUrl;
  if (imageUrl) {
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

  return res.json({ expense: mapExpense(expense) });
});

router.delete("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const existing = await prisma.expense.findUnique({
    where: { id },
    include: {
      createdBy: true
    }
  });
  if (!existing) {
    return res.status(404).json({ message: "Expense not found" });
  }
  if (existing.deletedAt) {
    return res.status(410).json({ message: "Expense has already been deleted" });
  }
  const user = req.user!;
  
  // Admins can always delete expenses, or users with canDelete permission
  if (user.role !== "ADMIN" && !user.canDelete) {
    return res.status(403).json({ message: "You do not have permission to delete expenses" });
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

  return res.json({ success: true });
});

// Get deleted expenses (admin only)
router.get("/deleted", requireAuth, async (req, res) => {
  if (req.user?.role !== "ADMIN") {
    return res.status(403).json({ message: "Admin access required" });
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

  return res.json({ expenses: deleted.map(mapExpense) });
});

// Restore a deleted expense (admin only)
router.post("/:id/restore", requireAuth, async (req, res) => {
  if (req.user?.role !== "ADMIN") {
    return res.status(403).json({ message: "Admin access required" });
  }

  const existing = await prisma.expense.findUnique({
    where: { id: req.params.id },
    include: {
      createdBy: true
    }
  });

  if (!existing) {
    return res.status(404).json({ message: "Expense not found" });
  }

  if (!existing.deletedAt) {
    return res.status(400).json({ message: "Expense is not deleted" });
  }

  const expense = await prisma.$transaction([
    prisma.expense.update({
      where: { id: req.params.id },
      data: { deletedAt: null },
      include: {
        createdBy: true
      }
    }),
    prisma.expenseAuditLog.create({
      data: {
        expenseId: req.params.id,
        action: "RESTORE",
        changedBy: req.user!.id
      }
    })
  ]);

  return res.json({ expense: mapExpense(expense[0]) });
});

export default router;

