"use client";

import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const { login, loading, user } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<FormValues>({
    resolver: zodResolver(schema)
  });

  useEffect(() => {
    if (!loading && user) {
      router.replace("/");
    }
  }, [user, loading, router]);

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await login(values.email, values.password);
    } catch (error: any) {
      // Extract error message
      const message = error?.message || "Incorrect email or password. Please try again.";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-emerald-900 to-slate-950 p-4">
      <div className="w-full max-w-md rounded-3xl bg-surface/80 p-10 shadow-2xl backdrop-blur">
        <h1 className="text-3xl font-semibold">Family Finance</h1>
        <p className="mt-2 text-sm text-textSecondary">
          Sign in to access your shared finances.
        </p>

        {/* Error Message Box */}
        {errorMessage && (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-900/20 p-4">
            <svg
              className="h-5 w-5 flex-shrink-0 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="flex-1 text-sm text-red-200">{errorMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
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
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-textSecondary">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-primary hover:underline"
              >
                Forgot Password?
              </Link>
            </div>
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
            {isSubmitting ? "Signing In..." : "Sign In"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-textSecondary">
          Need an account?{" "}
          <Link href="/register" className="font-medium text-primary">
            Create one
          </Link>
        </p>
      </div>
    </main>
  );
}

