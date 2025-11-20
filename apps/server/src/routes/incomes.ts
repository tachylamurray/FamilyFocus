import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";

const router = Router();

const incomeSchema = z.object({
  source: z.string().min(2),
  amount: z.number(),
  receivedDate: z.string()
});

router.get("/", requireAuth, async (_req, res) => {
  const incomes = await prisma.income.findMany({
    orderBy: { receivedDate: "desc" }
  });
  return res.json({
    incomes: incomes.map((income) => ({
      ...income,
      amount: Number(income.amount)
    }))
  });
});

router.post("/", requireAuth, async (req, res) => {
  if (req.user?.role === "VIEW_ONLY") {
    return res.status(403).json({ message: "View-only members cannot add income" });
  }
  const parsed = incomeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid income data" });
  }

  const income = await prisma.income.create({
    data: {
      ...parsed.data,
      amount: parsed.data.amount,
      receivedDate: new Date(parsed.data.receivedDate),
      createdById: req.user!.id
    }
  });

  return res.status(201).json({
    income: {
      ...income,
      amount: Number(income.amount)
    }
  });
});

router.delete("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const income = await prisma.income.findUnique({ where: { id } });
  if (!income) {
    return res.status(404).json({ message: "Income not found" });
  }
  const user = req.user!;
  if (user.role !== "ADMIN" && income.createdById !== user.id) {
    return res.status(403).json({ message: "Not allowed to delete this income" });
  }
  await prisma.income.delete({ where: { id } });
  return res.json({ success: true });
});

export default router;

