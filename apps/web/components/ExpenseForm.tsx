"use client";

import { Expense, ExpenseCategory } from "@/lib/types";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState, useRef } from "react";

const schema = z.object({
  category: z.string(),
  amount: z.number({ invalid_type_error: "Enter a numeric amount" }).min(0),
  dueDate: z.string(),
  notes: z.string().optional()
});

type FormValues = z.infer<typeof schema>;

type Props = {
  initialValues?: Expense;
  onSubmit: (values: FormValues & { image?: File }) => Promise<void>;
  onDelete?: () => Promise<void>;
  submitting: boolean;
  canEdit: boolean;
};

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api").replace(/\/api$/, "");

const categories: ExpenseCategory[] = [
  "Mortgage",
  "Property Taxes",
  "Electricity",
  "Water",
  "Gas",
  "Groceries",
  "Insurance",
  "Therapy Expenses"
];

export default function ExpenseForm({
  initialValues,
  onSubmit,
  onDelete,
  submitting,
  canEdit
}: Props) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      category: categories[0],
      amount: 0,
      dueDate: new Date().toISOString().split("T")[0],
      notes: ""
    }
  });

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset form when initialValues changes (when user selects/deselects an expense)
  useEffect(() => {
    if (initialValues) {
      form.reset({
        category: initialValues.category,
        amount: initialValues.amount,
        dueDate: initialValues.dueDate.split("T")[0],
        notes: initialValues.notes ?? ""
      });
      setSelectedImage(null);
      setImagePreview(initialValues.imageUrl ? `${API_BASE_URL}${initialValues.imageUrl}` : null);
    } else {
      form.reset({
        category: categories[0],
        amount: 0,
        dueDate: new Date().toISOString().split("T")[0],
        notes: ""
      });
      setSelectedImage(null);
      setImagePreview(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValues?.id]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit({
      ...values,
      image: selectedImage || undefined
    });
    if (!initialValues) {
      form.reset();
      setSelectedImage(null);
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm text-textSecondary">Category</label>
          <select
            className="mt-2 w-full rounded-xl border-2 border-emerald-600/50 bg-surfaceAlt/70 px-4 py-3 text-textPrimary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50 disabled:cursor-not-allowed"
            {...form.register("category")}
            disabled={!canEdit}
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm text-textSecondary">Amount</label>
          <input
            type="number"
            step="0.01"
            className="mt-2 w-full rounded-xl border-2 border-emerald-600/50 bg-surfaceAlt/70 px-4 py-3 text-textPrimary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50 disabled:cursor-not-allowed"
            {...form.register("amount", { valueAsNumber: true })}
            disabled={!canEdit}
          />
          {form.formState.errors.amount && (
            <p className="mt-1 text-sm text-danger">
              {form.formState.errors.amount.message}
            </p>
          )}
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm text-textSecondary">Due Date</label>
          <input
            type="date"
            className="mt-2 w-full rounded-xl border-2 border-emerald-600/50 bg-surfaceAlt/70 px-4 py-3 text-textPrimary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50 disabled:cursor-not-allowed"
            {...form.register("dueDate")}
            disabled={!canEdit}
          />
        </div>
        <div>
          <label className="text-sm text-textSecondary">Notes</label>
          <input
            className="mt-2 w-full rounded-xl border-2 border-emerald-600/50 bg-surfaceAlt/70 px-4 py-3 text-textPrimary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50 disabled:cursor-not-allowed"
            {...form.register("notes")}
            disabled={!canEdit}
          />
        </div>
      </div>
      <div>
        <label className="text-sm text-textSecondary">Expense Screenshot (Optional)</label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          disabled={!canEdit}
          className="mt-2 w-full rounded-xl border-2 border-emerald-600/50 bg-surfaceAlt/70 px-4 py-3 text-textPrimary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50 disabled:cursor-not-allowed file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-slate-900 hover:file:opacity-90"
        />
        {(imagePreview || selectedImage) && (
          <div className="mt-3">
            <img
              src={imagePreview || undefined}
              alt="Expense preview"
              className="max-h-48 w-full rounded-xl object-contain border border-surfaceAlt"
            />
            {selectedImage && (
              <p className="mt-1 text-xs text-textSecondary">
                New image selected: {selectedImage.name}
              </p>
            )}
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-textSecondary">
          <span>*</span>
          <span>Admins can edit or delete any expense. Members can edit theirs.</span>
        </div>
        <div className="flex items-center gap-3">
          {initialValues && onDelete && canEdit && (
            <button
              type="button"
              onClick={onDelete}
              className="rounded-xl border border-danger/60 px-5 py-2 text-sm font-medium text-danger transition hover:bg-danger/10"
              disabled={submitting}
            >
              Delete
            </button>
          )}
          {canEdit && (
            <button
              type="submit"
              className="rounded-xl bg-primary px-6 py-2 text-sm font-semibold text-slate-900 transition hover:opacity-90 disabled:opacity-50"
              disabled={submitting}
            >
              {submitting ? "Saving..." : "Save Expense"}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}

