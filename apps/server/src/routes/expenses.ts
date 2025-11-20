import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";

const router = Router();

const expenseSchema = z.object({
  category: z.string(),
  amount: z.number(),
  dueDate: z.string(),
  notes: z.string().optional()
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
    orderBy: { dueDate: "asc" },
    include: {
      createdBy: true
    }
  });
  return res.json({ expenses: expenses.map(mapExpense) });
});

router.post("/", requireAuth, async (req, res) => {
  if (req.user?.role === "VIEW_ONLY") {
    return res.status(403).json({ message: "View-only members cannot add expenses" });
  }

  const parsed = expenseSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid expense data" });
  }

  const expense = await prisma.expense.create({
    data: {
      ...parsed.data,
      dueDate: new Date(parsed.data.dueDate),
      createdBy: {
        connect: { id: req.user!.id }
      }
    },
    include: {
      createdBy: true
    }
  });
  return res.status(201).json({ expense: mapExpense(expense) });
});

router.put("/:id", requireAuth, async (req, res) => {
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
  const user = req.user!;
  const ownsExpense = existing.createdById === user.id;
  if (user.role !== "ADMIN" && !ownsExpense) {
    return res.status(403).json({ message: "Not allowed to edit this expense" });
  }

  const parsed = expenseSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid expense data" });
  }

  const expense = await prisma.expense.update({
    where: { id },
    data: {
      ...parsed.data,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : undefined
    },
    include: {
      createdBy: true
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
  const user = req.user!;
  const ownsExpense = existing.createdById === user.id;
  if (user.role !== "ADMIN" && !ownsExpense) {
    return res.status(403).json({ message: "Not allowed to delete this expense" });
  }

  await prisma.expense.delete({ where: { id } });
  return res.json({ success: true });
});

export default router;

