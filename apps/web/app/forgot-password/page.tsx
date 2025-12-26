"use client";

import { api } from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";

const schema = z.object({
  email: z.string().email("Please enter a valid email address")
});

type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<FormValues>({
    resolver: zodResolver(schema)
  });

  const forgotPassword = useMutation({
    mutationFn: (email: string) => api.forgotPassword(email),
    onSuccess: (_, email) => {
      setSubmittedEmail(email);
      setIsSubmitted(true);
    },
    onError: (error: any) => {
      // Error will be handled in the form display
    }
  });

  const onSubmit = async (values: FormValues) => {
    await forgotPassword.mutateAsync(values.email);
  };

  if (isSubmitted) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-emerald-900 to-slate-950 p-4">
        <div className="w-full max-w-md rounded-3xl bg-surface/80 p-10 shadow-2xl backdrop-blur">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
              <span className="text-3xl">✉️</span>
            </div>
            <h1 className="text-2xl font-semibold text-textPrimary">Check Your Email</h1>
            <p className="mt-4 text-sm text-textSecondary">
              We've sent you a 6-digit code to reset your password.
            </p>
            <p className="mt-2 text-sm text-textSecondary">
              Please check your inbox and enter the code on the next page.
            </p>
            <Link
              href={`/verify-identity?email=${encodeURIComponent(submittedEmail)}`}
              className="mt-6 inline-block rounded-xl bg-primary px-6 py-3 font-medium text-slate-900 transition hover:opacity-90"
            >
              Continue to Verification
            </Link>
            <p className="mt-6 text-center text-sm text-textSecondary">
              <Link href="/login" className="font-medium text-primary hover:underline">
                Back to Login
              </Link>
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-emerald-900 to-slate-950 p-4">
      <div className="w-full max-w-md rounded-3xl bg-surface/80 p-10 shadow-2xl backdrop-blur">
        {/* Header */}
        <div className="mb-6 flex items-center">
          <button
            onClick={() => router.back()}
            className="mr-4 text-textSecondary hover:text-textPrimary"
            aria-label="Go back"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <h1 className="text-xl font-semibold">Forgot Password</h1>
        </div>

        {/* Main Content */}
        <div className="mt-8">
          <h2 className="text-3xl font-semibold text-textPrimary">Forgot Password?</h2>
          <p className="mt-4 text-sm text-textSecondary">
            Don't worry! It happens. Enter your email address below and we will send you a link to reset it.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
            {/* Error Message */}
            {forgotPassword.isError && (
              <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-900/20 p-4">
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
                <p className="flex-1 text-sm text-red-200">
                  {forgotPassword.error?.message || "An error occurred. Please try again."}
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-textSecondary">
                Email Address
              </label>
              <div className="relative mt-2">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-textSecondary">
                  ✉️
                </span>
                <input
                  type="email"
                  className="w-full rounded-xl border-2 border-emerald-600/50 bg-surfaceAlt/70 px-10 py-3 text-textPrimary placeholder:text-textSecondary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="Enter your email"
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-danger">{errors.email.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={forgotPassword.isPending}
              className="w-full rounded-xl bg-primary px-4 py-3 font-medium text-slate-900 transition hover:opacity-90 disabled:opacity-50"
            >
              {forgotPassword.isPending ? "Sending..." : "Send Reset Link"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-textSecondary">
            Remember your password?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Back to Login
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

