"use client";

import AppShell from "@/components/AppShell";
import ExpenseForm from "@/components/ExpenseForm";
import ExpensesTable from "@/components/ExpensesTable";
import { useAuth } from "@/components/AuthProvider";
import { api } from "@/lib/api";
import { Expense } from "@/lib/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ExpensesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedExpense, setSelectedExpense] = useState<Expense | undefined>();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  const { data, isLoading } = useQuery({
    queryKey: ["expenses"],
    queryFn: () => api.listExpenses(),
    enabled: !!user
  });

  const createExpense = useMutation({
    mutationFn: api.createExpense,
    onSuccess: () => {
      setSelectedExpense(undefined);
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
  });

  const updateExpense = useMutation({
    mutationFn: ({ id, values }: { id: string; values: Partial<Expense> }) =>
      api.updateExpense(id, values),
    onSuccess: () => {
      setSelectedExpense(undefined);
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
  });

  const deleteExpense = useMutation({
    mutationFn: api.deleteExpense,
    onSuccess: () => {
      setSelectedExpense(undefined);
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
  });

  if (!user) {
    return null;
  }

  const userIsAdmin = user.role === "ADMIN";
  const userIsViewOnly = user.role === "VIEW_ONLY";
  const canEdit =
    !userIsViewOnly &&
    (userIsAdmin ||
      (selectedExpense ? selectedExpense.createdBy?.id === user.id : true));

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="w-full lg:w-2/3">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Shared Expenses</h2>
              <p className="text-sm text-textSecondary">
                Click a row to edit or send a reminder.
              </p>
            </div>
            <div className="mt-4">
              {isLoading ? (
                <div className="h-64 animate-pulse rounded-3xl bg-surfaceAlt/60" />
              ) : (
                <ExpensesTable
                  expenses={data?.expenses}
                  onSelect={setSelectedExpense}
                />
              )}
            </div>
          </div>
          <div className="w-full lg:w-1/3">
            <div className="rounded-3xl border border-surfaceAlt bg-surfaceAlt/50 p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">
                    {selectedExpense ? "Edit Expense" : "Add Expense"}
                  </h2>
                  <p className="mt-1 text-sm text-textSecondary">
                    Track bills so everyone stays aligned.
                  </p>
                </div>
                {selectedExpense && (
                  <button
                    onClick={() => setSelectedExpense(undefined)}
                    className="text-sm text-textSecondary hover:text-textPrimary transition"
                    type="button"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="mt-6">
                <ExpenseForm
                  initialValues={selectedExpense}
                  submitting={
                    createExpense.isPending ||
                    updateExpense.isPending ||
                    deleteExpense.isPending
                  }
                  canEdit={canEdit}
                  onSubmit={async (values) => {
                    if (selectedExpense) {
                      await updateExpense.mutateAsync({
                        id: selectedExpense.id,
                        values: values as Partial<Expense> & { image?: File }
                      });
                    } else {
                      await createExpense.mutateAsync(values as Partial<Expense> & { image?: File });
                    }
                  }}
                  onDelete={
                    selectedExpense && canEdit
                      ? async () =>
                          await deleteExpense.mutateAsync(selectedExpense.id)
                      : undefined
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

