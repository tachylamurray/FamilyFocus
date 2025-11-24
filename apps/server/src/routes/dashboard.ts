import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";

const router = Router();

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
}

function addDays(date: Date, days: number) {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + days);
  return newDate;
}

const categoryOrder = [
  "Mortgage",
  "Property Taxes",
  "Electricity",
  "Water",
  "Gas",
  "Groceries",
  "Insurance",
  "Therapy Expenses"
];

router.get("/", requireAuth, async (_req, res) => {
  const now = new Date();
  const start = startOfMonth(now);
  const end = endOfMonth(now);

  const [incomes, expenses] = await Promise.all([
    prisma.income.findMany({
      where: {
        receivedDate: {
          gte: start,
          lte: end
        }
      }
    }),
    prisma.expense.findMany({
      where: {
        dueDate: {
          gte: start,
          lte: end
        },
        deletedAt: null // Exclude deleted expenses
      }
    })
  ]);

  const totalIncome = incomes.reduce(
    (sum, income) => sum + Number(income.amount),
    0
  );
  const totalSpending = expenses.reduce(
    (sum, expense) => sum + Number(expense.amount),
    0
  );

  const spendingByCategory = categoryOrder.reduce(
    (acc, category) => ({
      ...acc,
      [category]: expenses
        .filter((expense) => expense.category === category)
        .reduce((sum, expense) => sum + Number(expense.amount), 0)
    }),
    {} as Record<string, number>
  );

  const upcomingBills = await prisma.expense.findMany({
    where: {
      dueDate: {
        gte: now,
        lte: addDays(now, 30)
      },
      deletedAt: null // Exclude deleted expenses
    },
    orderBy: { dueDate: "asc" },
    include: {
      createdBy: true
    },
    take: 10
  });

  return res.json({
    overview: {
      month: now.toLocaleString("default", { month: "long", year: "numeric" }),
      monthlyIncome: totalIncome,
      totalSpending,
      netSavings: totalIncome - totalSpending,
      spendingByCategory,
      upcomingBills: upcomingBills.map((expense) => ({
        id: expense.id,
        category: expense.category,
        amount: Number(expense.amount),
        dueDate: expense.dueDate,
        notes: expense.notes,
        createdBy: expense.createdBy
          ? {
              id: expense.createdBy.id,
              name: expense.createdBy.name,
              email: expense.createdBy.email,
              relationship: expense.createdBy.relationship,
              role: expense.createdBy.role
            }
          : null,
        createdAt: expense.createdAt,
        updatedAt: expense.updatedAt
      }))
    }
  });
});

export default router;

