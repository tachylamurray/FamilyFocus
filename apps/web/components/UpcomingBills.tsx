import { DashboardOverview } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import clsx from "clsx";
import { differenceInCalendarDays } from "date-fns";

type Props = {
  overview: DashboardOverview | undefined;
  isLoading: boolean;
};

function getStatus(dueDate: string) {
  const diff = differenceInCalendarDays(new Date(dueDate), new Date());
  if (diff < 0) return { label: "Overdue", color: "text-danger" };
  if (diff <= 3) return { label: "Due Soon", color: "text-warning" };
  return { label: `Due in ${diff} days`, color: "text-primary" };
}

export default function UpcomingBills({ overview, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="h-64 animate-pulse rounded-3xl bg-surfaceAlt/60" />
    );
  }

  if (!overview) {
    return null;
  }

  return (
    <section className="rounded-3xl border border-surfaceAlt bg-surfaceAlt/50 p-6 shadow-lg">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Upcoming Bills</h2>
        <span className="text-xs text-textSecondary">
          {overview.upcomingBills.length} total
        </span>
      </div>
      <div className="mt-6 space-y-4">
        {overview.upcomingBills.map((expense) => {
          const status = getStatus(expense.dueDate);
          return (
            <div
              key={expense.id}
              className="flex items-center justify-between rounded-2xl border border-surfaceAlt bg-surfaceAlt/80 px-4 py-3"
            >
              <div>
                <p className="font-medium">{expense.category}</p>
                <p className="text-sm text-textSecondary">
                  Due {formatDate(expense.dueDate)}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold">{formatCurrency(expense.amount)}</p>
                <p className={clsx("text-xs", status.color)}>{status.label}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

