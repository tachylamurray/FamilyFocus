"use client";

import { api } from "@/lib/api";
import { calculatePasswordStrength } from "@/lib/utils";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";

const schema = z
  .object({
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/\d/, "Password must contain at least one number")
      .regex(/[!@#$%^&*(),.?":{}|<>]/, "Password must contain at least one special symbol"),
    confirmPassword: z.string()
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"]
  });

type FormValues = z.infer<typeof schema>;

export default function SetNewPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const code = searchParams.get("code") || "";

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(
    calculatePasswordStrength("")
  );

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<FormValues>({
    resolver: zodResolver(schema)
  });

  const newPassword = watch("newPassword", "");

  useEffect(() => {
    if (newPassword) {
      setPasswordStrength(calculatePasswordStrength(newPassword));
    } else {
      setPasswordStrength(calculatePasswordStrength(""));
    }
  }, [newPassword]);

  const resetPassword = useMutation({
    mutationFn: (password: string) => api.resetPassword(email, code, password),
    onSuccess: () => {
      router.push("/login?passwordReset=true");
    }
  });

  const onSubmit = async (values: FormValues) => {
    await resetPassword.mutateAsync(values.newPassword);
  };

  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case "Weak":
        return "bg-red-500";
      case "Medium":
        return "bg-yellow-500";
      case "Strong":
        return "bg-green-500";
      default:
        return "bg-textSecondary/30";
    }
  };

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
          <h1 className="text-xl font-semibold">Set New Password</h1>
        </div>

        {/* Main Content */}
        <div className="mt-8">
          <p className="text-sm text-textSecondary">
            Create a secure password to access your account. Your new password must be different from previously used passwords.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-textSecondary">
                New Password
              </label>
              <div className="relative mt-2">
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full rounded-xl border-2 border-emerald-600/50 bg-surfaceAlt/70 px-4 py-3 pr-12 text-textPrimary placeholder:text-textSecondary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="Enter new password"
                  {...register("newPassword")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-textSecondary hover:text-textPrimary"
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.newPassword && (
                <p className="mt-1 text-sm text-danger">{errors.newPassword.message}</p>
              )}

              {/* Password Strength Indicator */}
              {newPassword && (
                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-textSecondary">
                      Password Strength
                    </span>
                    <span
                      className={`text-sm font-medium ${
                        passwordStrength.strength === "Weak"
                          ? "text-red-500"
                          : passwordStrength.strength === "Medium"
                          ? "text-yellow-500"
                          : "text-green-500"
                      }`}
                    >
                      {passwordStrength.strength}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-textSecondary/20">
                    <div
                      className={`h-full transition-all duration-300 ${getStrengthColor(
                        passwordStrength.strength
                      )}`}
                      style={{ width: `${passwordStrength.percentage}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Password Requirements */}
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`flex h-5 w-5 items-center justify-center rounded border-2 ${
                      passwordStrength.requirements.minLength
                        ? "border-green-500 bg-green-500"
                        : "border-textSecondary/50"
                    }`}
                  >
                    {passwordStrength.requirements.minLength && (
                      <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm text-textSecondary">At least 8 characters</span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`flex h-5 w-5 items-center justify-center rounded border-2 ${
                      passwordStrength.requirements.hasNumber
                        ? "border-green-500 bg-green-500"
                        : "border-textSecondary/50"
                    }`}
                  >
                    {passwordStrength.requirements.hasNumber && (
                      <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm text-textSecondary">Contains a number</span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`flex h-5 w-5 items-center justify-center rounded border-2 ${
                      passwordStrength.requirements.hasSpecialChar
                        ? "border-green-500 bg-green-500"
                        : "border-textSecondary/50"
                    }`}
                  >
                    {passwordStrength.requirements.hasSpecialChar && (
                      <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm text-textSecondary">Contains a special symbol</span>
                </div>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-textSecondary">
                Confirm New Password
              </label>
              <div className="relative mt-2">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  className="w-full rounded-xl border-2 border-emerald-600/50 bg-surfaceAlt/70 px-4 py-3 pr-12 text-textPrimary placeholder:text-textSecondary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="Re-enter password"
                  {...register("confirmPassword")}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-textSecondary hover:text-textPrimary"
                >
                  {showConfirmPassword ? (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-danger">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Reset Password Button */}
            <button
              type="submit"
              disabled={resetPassword.isPending}
              className="w-full rounded-xl bg-primary px-4 py-3 font-medium text-slate-900 transition hover:opacity-90 disabled:opacity-50"
            >
              {resetPassword.isPending ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

