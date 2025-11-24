"use client";

import AppShell from "@/components/AppShell";
import { useAuth } from "@/components/AuthProvider";
import { api } from "@/lib/api";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name must be less than 100 characters")
});

type FormValues = z.infer<typeof schema>;

export default function ProfilePage() {
  const { user, loading, refreshUser } = useAuth();
  const router = useRouter();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: user?.name || ""
    }
  });

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name
      });
    }
  }, [user, form]);

  const updateProfile = useMutation({
    mutationFn: api.updateProfile,
    onSuccess: async () => {
      await refreshUser();
      setSuccessMessage("Profile updated successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    await updateProfile.mutateAsync(values);
  });

  if (!user) {
    return null;
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl space-y-8">
        <div>
          <h2 className="text-xl font-semibold">Profile Settings</h2>
          <p className="mt-1 text-sm text-textSecondary">
            Update your profile information
          </p>
        </div>

        <div className="rounded-3xl border border-surfaceAlt bg-surfaceAlt/50 p-6 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="text-sm text-textSecondary">Email</label>
              <input
                type="email"
                value={user.email}
                disabled
                className="mt-2 w-full rounded-xl border-2 border-emerald-600/50 bg-surfaceAlt/70 px-4 py-3 text-textSecondary opacity-50 cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-textSecondary">
                Email cannot be changed
              </p>
            </div>

            <div>
              <label className="text-sm text-textSecondary">Name</label>
              <input
                type="text"
                className="mt-2 w-full rounded-xl border-2 border-emerald-600/50 bg-surfaceAlt/70 px-4 py-3 text-textPrimary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                {...form.register("name")}
              />
              {form.formState.errors.name && (
                <p className="mt-1 text-sm text-danger">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm text-textSecondary">Relationship</label>
              <input
                type="text"
                value={user.relationship}
                disabled
                className="mt-2 w-full rounded-xl border-2 border-emerald-600/50 bg-surfaceAlt/70 px-4 py-3 text-textSecondary opacity-50 cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-textSecondary">
                Relationship cannot be changed
              </p>
            </div>

            <div>
              <label className="text-sm text-textSecondary">Role</label>
              <input
                type="text"
                value={user.role}
                disabled
                className="mt-2 w-full rounded-xl border-2 border-emerald-600/50 bg-surfaceAlt/70 px-4 py-3 text-textSecondary opacity-50 cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-textSecondary">
                Role cannot be changed
              </p>
            </div>

            {successMessage && (
              <div className="rounded-xl bg-primary/20 px-4 py-3 text-sm text-primary">
                {successMessage}
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={updateProfile.isPending || !form.formState.isDirty}
                className="rounded-xl bg-primary px-6 py-2 text-sm font-semibold text-slate-900 transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updateProfile.isPending ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppShell>
  );
}

