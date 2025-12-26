export type Role = "ADMIN" | "MEMBER" | "VIEW_ONLY";

export type User = {
  id: string;
  name: string;
  email: string;
  relationship: string;
  role: Role;
  canDelete: boolean;
};

export type ExpenseCategory =
  | "Mortgage"
  | "Property Taxes"
  | "Electricity"
  | "Water"
  | "Gas"
  | "Groceries"
  | "Insurance"
  | "Therapy Expenses";

export type Expense = {
  id: string;
  category: ExpenseCategory;
  amount: number;
  dueDate: string;
  notes?: string | null;
  imageUrl?: string | null;
  createdBy: User;
  createdAt: string;
  updatedAt: string;
};

export type Notification = {
  id: string;
  message: string;
  sender: User;
  recipientIds: string[] | null;
  createdAt: string;
};

export type DashboardOverview = {
  month: string;
  monthlyIncome: number;
  incomeBySource: Record<string, number>;
  totalSpending: number;
  netSavings: number;
  spendingByCategory: Record<ExpenseCategory, number>;
  upcomingBills: Expense[];
};

export type RecurringFrequency = "MONTHLY" | "QUARTERLY" | "YEARLY" | "ONE_TIME";

export type RecurringBill = {
  id: string;
  name: string;
  amount: number;
  dayOfMonth: number;
  frequency: RecurringFrequency;
  nextDueDate: string;
  createdBy: User | null;
  createdAt: string;
  updatedAt: string;
};

