import { DashboardOverview } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

type Props = {
  overview: DashboardOverview | undefined;
  isLoading: boolean;
};

export default function OverviewCards({ overview, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div
            key={idx}
            className="h-32 animate-pulse rounded-3xl bg-surfaceAlt/60"
          />
        ))}
      </div>
    );
  }

  if (!overview) {
    return null;
  }

  const cards = [
    {
      label: "Monthly Income",
      value: formatCurrency(overview.monthlyIncome),
      description: `Updated for ${overview.month}`
    },
    {
      label: "Total Spending",
      value: formatCurrency(overview.totalSpending),
      description: "Shared expenses across categories"
    },
    {
      label: "Net Savings",
      value: formatCurrency(overview.netSavings),
      description: "Income minus all expenses"
    },
    {
      label: "Upcoming Bills",
      value: overview.upcomingBills.length.toString(),
      description: "Due within the next 30 days"
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-3xl border border-surfaceAlt bg-surfaceAlt/50 p-6 shadow-lg"
        >
          <p className="text-sm uppercase tracking-wide text-textSecondary">
            {card.label}
          </p>
          <p className="mt-2 text-2xl font-semibold">{card.value}</p>
          <p className="mt-2 text-xs text-textSecondary">{card.description}</p>
        </div>
      ))}
    </div>
  );
}

