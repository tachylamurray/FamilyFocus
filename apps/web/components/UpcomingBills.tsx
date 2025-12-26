"use client";

import { DashboardOverview } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import clsx from "clsx";
import { differenceInCalendarDays } from "date-fns";
import { useState } from "react";
import AddUpcomingBillModal from "./AddUpcomingBillModal";
import { useAuth } from "./AuthProvider";

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
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBillId, setEditingBillId] = useState<string | undefined>(undefined);
  const isViewOnly = user?.role === "VIEW_ONLY";

  const handleBillClick = (billId: string) => {
    // Check if it's a recurring bill (ID starts with "recurring-")
    if (billId.startsWith("recurring-")) {
      // Extract the actual bill ID from format: "recurring-{billId}-{ISO_DATE}" or "recurring-{billId}"
      // Remove "recurring-" prefix
      const withoutPrefix = billId.replace("recurring-", "");
      
      // ISO dates start with a 4-digit year pattern: "-\d{4}-"
      // Use regex to find where the date starts and extract everything before it
      const datePattern = /-\d{4}-/; // Pattern that matches "-2024-" (start of ISO date)
      const match = withoutPrefix.match(datePattern);
      
      if (match && match.index !== undefined) {
        // Extract everything before the date (the match.index is the position of the dash before the year)
        const actualBillId = withoutPrefix.substring(0, match.index);
        setEditingBillId(actualBillId);
      } else {
        // For ONE_TIME bills or if no date pattern found, format is just "recurring-{billId}"
        setEditingBillId(withoutPrefix);
      }
      setIsModalOpen(true);
    }
    // For regular expenses, we don't handle them here (they can be edited from the expenses page)
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingBillId(undefined);
  };

  if (isLoading) {
    return (
      <div className="h-64 animate-pulse rounded-3xl bg-surfaceAlt/60" />
    );
  }

  if (!overview) {
    return null;
  }

  return (
    <>
      <section className="rounded-3xl border border-surfaceAlt bg-surfaceAlt/50 p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Upcoming Bills</h2>
          <div className="flex items-center gap-3">
            <span className="text-xs text-textSecondary">
              {overview.upcomingBills.length} total
            </span>
            {!isViewOnly && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
              >
                + Add Bill
              </button>
            )}
          </div>
        </div>
      <div className="mt-6 space-y-4">
        {overview.upcomingBills.map((expense) => {
          const status = getStatus(expense.dueDate);
          const isRecurringBill = expense.id.startsWith("recurring-");
          const isClickable = isRecurringBill && !isViewOnly;
          
          return (
            <div
              key={expense.id}
              onClick={() => isClickable && handleBillClick(expense.id)}
              className={`
                flex items-center justify-between rounded-2xl border border-surfaceAlt bg-surfaceAlt/80 px-4 py-3
                ${isClickable ? "cursor-pointer transition-colors hover:bg-surfaceAlt" : ""}
              `}
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
      <AddUpcomingBillModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        billId={editingBillId}
      />
    </>
  );
}

