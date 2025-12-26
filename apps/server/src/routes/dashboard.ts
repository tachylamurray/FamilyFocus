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

  const [incomes, expenses, recurringBills] = await Promise.all([
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
    }),
    prisma.recurringBill.findMany()
  ]);

  // Calculate income by source from database
  const incomeBySource = incomes.reduce(
    (acc, income) => {
      const source = income.source;
      acc[source] = (acc[source] || 0) + Number(income.amount);
      return acc;
    },
    {} as Record<string, number>
  );

  // Add default income sources if not present in database
  if (!incomeBySource["Social Security"]) {
    incomeBySource["Social Security"] = 1900;
  }
  if (!incomeBySource["401k/IRA"]) {
    incomeBySource["401k/IRA"] = 0;
  }

  // Calculate total income including defaults
  const totalIncome = Object.values(incomeBySource).reduce(
    (sum, amount) => sum + amount,
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

  const upcomingWindowEnd = addDays(now, 30);

  // Get regular expenses in upcoming window
  const upcomingExpenses = await prisma.expense.findMany({
    where: {
      dueDate: {
        gte: now,
        lte: upcomingWindowEnd
      },
      deletedAt: null // Exclude deleted expenses
    },
    orderBy: { dueDate: "asc" },
    include: {
      createdBy: true
    }
  });

  // Generate upcoming bills from recurring bills
  const recurringUpcoming: Array<{
    id: string;
    category: string;
    amount: number;
    dueDate: Date;
    notes: string | null;
    createdBy: any;
    createdAt: Date;
    updatedAt: Date;
  }> = [];

  for (const bill of recurringBills) {
    if (bill.frequency === "ONE_TIME") {
      // For one-time, just check if nextDueDate is in window
      if (bill.nextDueDate >= now && bill.nextDueDate <= upcomingWindowEnd) {
        recurringUpcoming.push({
          id: `recurring-${bill.id}`,
          category: bill.name,
          amount: Number(bill.amount),
          dueDate: bill.nextDueDate,
          notes: null,
          createdBy: null,
          createdAt: bill.createdAt,
          updatedAt: bill.updatedAt
        });
      }
    } else if (bill.frequency === "MONTHLY") {
      // For monthly, compute next occurrence on the dayOfMonth
      let nextDate = new Date(now);
      nextDate.setDate(bill.dayOfMonth);
      
      // If the day has passed this month, move to next month
      if (nextDate < now) {
        nextDate.setMonth(nextDate.getMonth() + 1);
        nextDate.setDate(bill.dayOfMonth);
      }
      
      // If within window, add it
      if (nextDate <= upcomingWindowEnd) {
        recurringUpcoming.push({
          id: `recurring-${bill.id}-${nextDate.toISOString()}`,
          category: bill.name,
          amount: Number(bill.amount),
          dueDate: nextDate,
          notes: null,
          createdBy: null,
          createdAt: bill.createdAt,
          updatedAt: bill.updatedAt
        });
      }
    } else if (bill.frequency === "QUARTERLY") {
      // For quarterly, compute next occurrence
      let nextDate = new Date(bill.nextDueDate);
      while (nextDate < now) {
        nextDate.setMonth(nextDate.getMonth() + 3);
        nextDate.setDate(bill.dayOfMonth);
      }
      
      if (nextDate <= upcomingWindowEnd) {
        recurringUpcoming.push({
          id: `recurring-${bill.id}-${nextDate.toISOString()}`,
          category: bill.name,
          amount: Number(bill.amount),
          dueDate: nextDate,
          notes: null,
          createdBy: null,
          createdAt: bill.createdAt,
          updatedAt: bill.updatedAt
        });
      }
    } else if (bill.frequency === "YEARLY") {
      // For yearly, compute next occurrence
      let nextDate = new Date(bill.nextDueDate);
      while (nextDate < now) {
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        nextDate.setDate(bill.dayOfMonth);
      }
      
      if (nextDate <= upcomingWindowEnd) {
        recurringUpcoming.push({
          id: `recurring-${bill.id}-${nextDate.toISOString()}`,
          category: bill.name,
          amount: Number(bill.amount),
          dueDate: nextDate,
          notes: null,
          createdBy: null,
          createdAt: bill.createdAt,
          updatedAt: bill.updatedAt
        });
      }
    }
  }

  // Combine regular expenses and recurring bills, sort by due date
  const upcomingBills = [...upcomingExpenses, ...recurringUpcoming]
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
    .slice(0, 10);

  return res.json({
    overview: {
      month: now.toLocaleString("default", { month: "long", year: "numeric" }),
      monthlyIncome: totalIncome,
      incomeBySource,
      totalSpending,
      netSavings: totalIncome - totalSpending,
      spendingByCategory,
      upcomingBills: upcomingBills.map((bill) => ({
        id: bill.id,
        category: bill.category,
        amount: bill.amount,
        dueDate: bill.dueDate.toISOString(),
        notes: bill.notes,
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
    }
  });
});

export default router;

