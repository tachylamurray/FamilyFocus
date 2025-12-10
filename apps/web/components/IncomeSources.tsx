import { DashboardOverview } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

type Props = {
  overview: DashboardOverview | undefined;
  isLoading: boolean;
};

export default function IncomeSources({ overview, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="h-48 animate-pulse rounded-3xl bg-surfaceAlt/60" />
    );
  }

  if (!overview) {
    return null;
  }

  // Get income sources from overview, with defaults
  const socialSecurity = overview.incomeBySource?.["Social Security"] ?? 1900;
  const retirement401k = overview.incomeBySource?.["401k/IRA"] ?? 0;

  const incomeSources = [
    {
      label: "Social Security",
      amount: socialSecurity,
      icon: "💵"
    },
    {
      label: "401k/IRA",
      amount: retirement401k,
      icon: "💰"
    }
  ];

  return (
    <section className="rounded-3xl border border-surfaceAlt bg-surfaceAlt/50 p-6 shadow-lg">
      <h2 className="text-lg font-semibold">Income Sources</h2>
      <div className="mt-6 space-y-4">
        {incomeSources.map((source) => (
          <div
            key={source.label}
            className="flex items-center justify-between rounded-2xl border border-surfaceAlt bg-surfaceAlt/80 px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{source.icon}</span>
              <span className="font-medium">{source.label}</span>
            </div>
            <p className="text-lg font-semibold">{formatCurrency(source.amount)}</p>
          </div>
        ))}
        <div className="mt-4 border-t border-surfaceAlt pt-4">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-textPrimary">Total Monthly Income</span>
            <p className="text-xl font-semibold text-primary">
              {formatCurrency(overview.monthlyIncome)}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

