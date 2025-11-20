import { DashboardOverview } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

type Props = {
  overview: DashboardOverview | undefined;
  isLoading: boolean;
};

export default function SpendingByCategory({
  overview,
  isLoading
}: Props) {
  if (isLoading) {
    return (
      <div className="h-64 animate-pulse rounded-3xl bg-surfaceAlt/60" />
    );
  }

  if (!overview) {
    return null;
  }

  const entries = Object.entries(overview.spendingByCategory);
  const maxValue = Math.max(...entries.map(([, value]) => value), 1);

  return (
    <section className="rounded-3xl border border-surfaceAlt bg-surfaceAlt/50 p-6 shadow-lg">
      <h2 className="text-lg font-semibold">Spending by Category</h2>
      <div className="mt-6 space-y-4">
        {entries.map(([category, value]) => (
          <div key={category}>
            <div className="flex items-center justify-between text-sm">
              <span>{category}</span>
              <span className="text-textSecondary">
                {formatCurrency(value)}
              </span>
            </div>
            <div className="mt-2 h-3 rounded-full bg-surface">
              <div
                className="h-3 rounded-full bg-primary"
                style={{ width: `${Math.max(6, (value / maxValue) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

