import { Expense } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";

type Props = {
  expenses: Expense[] | undefined;
  onSelect: (expense: Expense) => void;
};

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api").replace(/\/api$/, "");

export default function ExpensesTable({ expenses, onSelect }: Props) {
  if (!expenses?.length) {
    return (
      <div className="rounded-3xl border border-surfaceAlt bg-surfaceAlt/50 p-6 text-sm text-textSecondary">
        No expenses found. Add your first shared bill to get started.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-surfaceAlt bg-surfaceAlt/50 shadow-lg">
      <table className="min-w-full divide-y divide-surfaceAlt text-left text-sm">
        <thead className="bg-surface">
          <tr>
            <th className="px-6 py-3 font-medium uppercase tracking-wide text-textSecondary">
              Category
            </th>
            <th className="px-6 py-3 font-medium uppercase tracking-wide text-textSecondary">
              Amount
            </th>
            <th className="px-6 py-3 font-medium uppercase tracking-wide text-textSecondary">
              Due Date
            </th>
            <th className="px-6 py-3 font-medium uppercase tracking-wide text-textSecondary">
              Image
            </th>
            <th className="px-6 py-3 font-medium uppercase tracking-wide text-textSecondary">
              Payer
            </th>
            <th className="px-6 py-3 font-medium uppercase tracking-wide text-textSecondary">
              Notes
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surfaceAlt">
          {expenses.map((expense) => (
            <tr
              key={expense.id}
              className="cursor-pointer transition hover:bg-surface"
              onClick={() => onSelect(expense)}
            >
              <td className="px-6 py-4 font-medium">{expense.category}</td>
              <td className="px-6 py-4">{formatCurrency(expense.amount)}</td>
              <td className="px-6 py-4 text-textSecondary">
                {formatDate(expense.dueDate)}
              </td>
              <td className="px-6 py-4">
                {expense.imageUrl ? (
                  <img
                    src={`${API_BASE_URL}${expense.imageUrl}`}
                    alt={`${expense.category} screenshot`}
                    className="h-12 w-12 rounded-lg object-cover border border-surfaceAlt cursor-pointer hover:opacity-80 transition"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(`${API_BASE_URL}${expense.imageUrl}`, "_blank");
                    }}
                  />
                ) : (
                  <span className="text-textSecondary">—</span>
                )}
              </td>
              <td className="px-6 py-4 text-textSecondary">
                {expense.createdBy?.name ?? "—"}
              </td>
              <td className="px-6 py-4 text-textSecondary">
                {expense.notes ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

