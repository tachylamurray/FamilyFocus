"use client";

import { api } from "@/lib/api";
import { RecurringBill, RecurringFrequency } from "@/lib/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useAuth } from "./AuthProvider";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  billId?: string; // If provided, opens in edit mode
};

export default function AddUpcomingBillModal({ isOpen, onClose, billId }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [firstDueDate, setFirstDueDate] = useState("");
  const [frequency, setFrequency] = useState<RecurringFrequency>("MONTHLY");

  const isEditMode = !!billId;

  // Fetch bill data when in edit mode
  const { data: billsData, isLoading: isLoadingBill } = useQuery({
    queryKey: ["recurring-bills"],
    queryFn: () => api.listRecurringBills(),
    enabled: isEditMode && isOpen && !!billId
  });

  const billToEdit = billsData?.bills.find((b) => b.id === billId);

  const resetForm = () => {
    setName("");
    setAmount("");
    setFirstDueDate("");
    setFrequency("MONTHLY");
  };

  // Pre-populate form when bill data is loaded
  useEffect(() => {
    if (billToEdit && isEditMode) {
      setName(billToEdit.name);
      setAmount(billToEdit.amount.toString());
      setFirstDueDate(billToEdit.nextDueDate.split("T")[0]);
      setFrequency(billToEdit.frequency);
    } else if (!isEditMode) {
      // Reset form when opening in add mode
      resetForm();
    }
  }, [billToEdit, isEditMode]);

  const createBill = useMutation({
    mutationFn: (payload: {
      name: string;
      amount: number;
      firstDueDate: string;
      frequency: RecurringFrequency;
    }) => api.createRecurringBill(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["recurring-bills"] });
      onClose();
      resetForm();
    }
  });

  const updateBill = useMutation({
    mutationFn: (payload: {
      name: string;
      amount: number;
      firstDueDate: string;
      frequency: RecurringFrequency;
    }) => {
      if (!billId) throw new Error("billId is required for update");
      return api.updateRecurringBill(billId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["recurring-bills"] });
      onClose();
      resetForm();
    }
  });

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !amount || !firstDueDate) {
      return;
    }

    const payload = {
      name: name.trim(),
      amount: parseFloat(amount),
      firstDueDate,
      frequency
    };

    if (isEditMode) {
      updateBill.mutate(payload);
    } else {
      createBill.mutate(payload);
    }
  };

  if (!isOpen) return null;

  const isSubmitting = createBill.isPending || updateBill.isPending;
  const canSubmit = name.trim() && amount && firstDueDate && !isSubmitting && !isLoadingBill;
  const isViewOnly = user?.role === "VIEW_ONLY";

  // Show loading state while fetching bill data in edit mode
  if (isEditMode && isLoadingBill) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-md rounded-3xl border border-surfaceAlt bg-surface p-6 shadow-xl">
          <div className="py-8 text-center text-textSecondary">Loading bill data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-3xl border border-surfaceAlt bg-surface p-6 shadow-xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={handleClose}
            className="text-textSecondary hover:text-textPrimary"
          >
            Cancel
          </button>
          <h2 className="text-lg font-semibold">{isEditMode ? "Edit Bill" : "Add Bill"}</h2>
          <div className="w-16" /> {/* Spacer for centering */}
        </div>

        {isViewOnly ? (
          <p className="py-8 text-center text-textSecondary">
            View-only members cannot {isEditMode ? "edit" : "add"} bills
          </p>
        ) : isLoadingBill ? (
          <p className="py-8 text-center text-textSecondary">Loading bill data...</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* What is this bill for? */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                What is this bill for?
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-textSecondary">
                  📄
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Rent, Internet, Electricity"
                  className="w-full rounded-2xl border border-surfaceAlt bg-surfaceAlt/50 px-10 py-3 text-textPrimary placeholder:text-textSecondary focus:border-primary focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* How much is it? */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                How much is it?
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-textSecondary">
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-2xl border border-surfaceAlt bg-surfaceAlt/50 px-10 py-3 text-textPrimary placeholder:text-textSecondary focus:border-primary focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* When is it due? */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                When is it due?
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={firstDueDate}
                  onChange={(e) => setFirstDueDate(e.target.value)}
                  className="w-full rounded-2xl border border-surfaceAlt bg-surfaceAlt/50 px-4 py-3 pr-12 text-textPrimary focus:border-primary focus:outline-none [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-3 [&::-webkit-calendar-picker-indicator]:w-6 [&::-webkit-calendar-picker-indicator]:h-6 [&::-moz-calendar-picker-indicator]:opacity-0"
                  required
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const input = (e.currentTarget.previousElementSibling as HTMLInputElement);
                    if (input && typeof input.showPicker === "function") {
                      input.showPicker();
                    } else {
                      input.focus();
                    }
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-textSecondary hover:text-textPrimary cursor-pointer bg-transparent border-none p-0"
                  aria-label="Open calendar"
                  tabIndex={-1}
                >
                  📅
                </button>
              </div>
            </div>

            {/* How often? */}
            <div>
              <label className="mb-2 block text-sm font-medium">How often?</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFrequency("MONTHLY")}
                  className={`
                    rounded-2xl border py-3 font-medium transition-colors
                    ${
                      frequency === "MONTHLY"
                        ? "border-primary bg-primary text-white"
                        : "border-surfaceAlt bg-surfaceAlt/50 text-textPrimary"
                    }
                  `}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setFrequency("QUARTERLY")}
                  className={`
                    rounded-2xl border py-3 font-medium transition-colors
                    ${
                      frequency === "QUARTERLY"
                        ? "border-primary bg-primary text-white"
                        : "border-surfaceAlt bg-surfaceAlt/50 text-textPrimary"
                    }
                  `}
                >
                  Quarterly
                </button>
                <button
                  type="button"
                  onClick={() => setFrequency("YEARLY")}
                  className={`
                    rounded-2xl border py-3 font-medium transition-colors
                    ${
                      frequency === "YEARLY"
                        ? "border-primary bg-primary text-white"
                        : "border-surfaceAlt bg-surfaceAlt/50 text-textPrimary"
                    }
                  `}
                >
                  Yearly
                </button>
                <button
                  type="button"
                  onClick={() => setFrequency("ONE_TIME")}
                  className={`
                    rounded-2xl border py-3 font-medium transition-colors
                    ${
                      frequency === "ONE_TIME"
                        ? "border-primary bg-primary text-white"
                        : "border-surfaceAlt bg-surfaceAlt/50 text-textPrimary"
                    }
                  `}
                >
                  One-time
                </button>
              </div>
            </div>

            {/* Save Bill Button */}
            <button
              type="submit"
              disabled={!canSubmit}
              className={`
                w-full rounded-2xl py-4 font-semibold transition-colors
                ${
                  canSubmit
                    ? "bg-primary text-white hover:bg-primary/90"
                    : "bg-surfaceAlt/50 text-textSecondary cursor-not-allowed"
                }
              `}
            >
              {isSubmitting ? "Saving..." : `✓ ${isEditMode ? "Update" : "Save"} Bill`}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

