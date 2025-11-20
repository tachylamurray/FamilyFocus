"use client";

import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  relationship: z.string().min(2),
  password: z.string().min(6)
});

type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({
    resolver: zodResolver(schema)
  });

  useEffect(() => {
    if (!loading && user) {
      router.replace("/");
    }
  }, [user, loading, router]);

  const onSubmit = async (values: FormValues) => {
    await api.register(values);
    router.push("/login");
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-emerald-900 to-slate-950 p-4">
      <div className="w-full max-w-md rounded-3xl bg-surface/80 p-10 shadow-2xl backdrop-blur">
        <h1 className="text-3xl font-semibold">Create your account</h1>
        <p className="mt-2 text-sm text-textSecondary">
          Invite your family members once you are inside.
        </p>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-textSecondary">
              Name
            </label>
            <input
              className="mt-2 w-full rounded-xl border-2 border-emerald-600/50 bg-surfaceAlt/70 px-4 py-3 text-textPrimary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
              {...register("name")}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-danger">{errors.name.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-textSecondary">
              Email
            </label>
            <input
              type="email"
              className="mt-2 w-full rounded-xl border-2 border-emerald-600/50 bg-surfaceAlt/70 px-4 py-3 text-textPrimary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
              {...register("email")}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-danger">{errors.email.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-textSecondary">
              Relationship
            </label>
            <input
              className="mt-2 w-full rounded-xl border-2 border-emerald-600/50 bg-surfaceAlt/70 px-4 py-3 text-textPrimary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
              {...register("relationship")}
            />
            {errors.relationship && (
              <p className="mt-1 text-sm text-danger">
                {errors.relationship.message}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-textSecondary">
              Password
            </label>
            <input
              type="password"
              className="mt-2 w-full rounded-xl border-2 border-emerald-600/50 bg-surfaceAlt/70 px-4 py-3 text-textPrimary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
              {...register("password")}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-danger">
                {errors.password.message}
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={isSubmitting || loading}
            className="flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3 font-medium text-slate-900 transition hover:opacity-90 disabled:opacity-50"
          >
            {isSubmitting ? "Creating..." : "Create Account"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-textSecondary">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}

