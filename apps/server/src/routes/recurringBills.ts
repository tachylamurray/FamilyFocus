import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";

const router = Router();

const recurringBillSchema = z.object({
  name: z.string().min(1),
  amount: z.number().min(0),
  firstDueDate: z.string(),
  frequency: z.enum(["MONTHLY", "QUARTERLY", "YEARLY", "ONE_TIME"])
});

function getDayOfMonth(date: Date): number {
  return date.getDate();
}

function computeNextDueDate(
  currentDate: Date,
  dayOfMonth: number,
  frequency: "MONTHLY" | "QUARTERLY" | "YEARLY" | "ONE_TIME"
): Date {
  const next = new Date(currentDate);
  
  if (frequency === "MONTHLY") {
    next.setMonth(next.getMonth() + 1);
    next.setDate(dayOfMonth);
  } else if (frequency === "QUARTERLY") {
    next.setMonth(next.getMonth() + 3);
    next.setDate(dayOfMonth);
  } else if (frequency === "YEARLY") {
    next.setFullYear(next.getFullYear() + 1);
    next.setDate(dayOfMonth);
  }
  // ONE_TIME doesn't recur, so return the original date
  
  return next;
}

router.get("/", requireAuth, async (_req, res) => {
  const bills = await prisma.recurringBill.findMany({
    orderBy: { nextDueDate: "asc" },
    include: {
      createdBy: true
    }
  });

  return res.json({
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
});

router.post("/", requireAuth, async (req, res) => {
  if (req.user?.role === "VIEW_ONLY") {
    return res.status(403).json({ message: "View-only members cannot add recurring bills" });
  }

  const parsed = recurringBillSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid bill data", errors: parsed.error.errors });
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
        connect: { id: req.user!.id }
      }
    },
    include: {
      createdBy: true
    }
  });

  return res.status(201).json({
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
});

router.put("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const parsed = recurringBillSchema.safeParse(req.body);
  
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid bill data", errors: parsed.error.errors });
  }

  const existing = await prisma.recurringBill.findUnique({ where: { id } });
  if (!existing) {
    return res.status(404).json({ message: "Recurring bill not found" });
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

  return res.json({
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
});

router.delete("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const existing = await prisma.recurringBill.findUnique({ where: { id } });
  
  if (!existing) {
    return res.status(404).json({ message: "Recurring bill not found" });
  }

  const user = req.user!;
  if (user.role !== "ADMIN" && existing.createdById !== user.id) {
    return res.status(403).json({ message: "Not allowed to delete this bill" });
  }

  await prisma.recurringBill.delete({ where: { id } });
  return res.json({ success: true });
});

export default router;

