"use client";

import { api } from "@/lib/api";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";

export default function VerifyIdentityPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [resendCountdown, setResendCountdown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const verifyCode = useMutation({
    mutationFn: ({ email, code }: { email: string; code: string }) =>
      api.verifyResetCode(email, code),
    onSuccess: (_, variables) => {
      router.push(`/set-new-password?email=${encodeURIComponent(variables.email)}&code=${variables.code}`);
    }
  });

  const resendCode = useMutation({
    mutationFn: () => api.forgotPassword(email),
    onSuccess: () => {
      setResendCountdown(45);
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    }
  });

  useEffect(() => {
    // Start countdown timer
    if (resendCountdown > 0) {
      const timer = setTimeout(() => {
        setResendCountdown(resendCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  useEffect(() => {
    // Auto-focus first input
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-advance to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits are entered
    if (newCode.every((digit) => digit !== "") && newCode.join("").length === 6) {
      handleSubmit(newCode.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newCode = [...code];
    for (let i = 0; i < 6; i++) {
      newCode[i] = pastedData[i] || "";
    }
    setCode(newCode);
    // Focus the next empty input or the last one
    const nextEmptyIndex = newCode.findIndex((digit) => !digit);
    const focusIndex = nextEmptyIndex === -1 ? 5 : nextEmptyIndex;
    inputRefs.current[focusIndex]?.focus();
  };

  const handleSubmit = (codeToVerify?: string) => {
    const codeString = codeToVerify || code.join("");
    if (codeString.length === 6 && email) {
      verifyCode.mutate({ email, code: codeString });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const maskEmail = (email: string) => {
    if (!email) return "";
    const [localPart, domain] = email.split("@");
    if (!localPart || !domain) return email;
    const maskedLocal = localPart.slice(0, 2) + "***";
    return `${maskedLocal}@${domain}`;
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
          <h1 className="text-xl font-semibold">Verify Your Identity</h1>
        </div>

        {/* Progress Indicators */}
        <div className="mb-6 flex items-center justify-center gap-2">
          <div className="h-2 w-2 rounded-full bg-textSecondary/30" />
          <div className="h-2 w-2 rounded-full bg-primary" />
          <div className="h-2 w-2 rounded-full bg-textSecondary/30" />
        </div>

        {/* Main Content */}
        <div className="mt-8">
          <h2 className="text-3xl font-semibold text-textPrimary">Verify Your Identity</h2>
          <p className="mt-4 text-sm text-textSecondary">
            We sent a 6-digit code to <strong>{maskEmail(email)}</strong>. Please enter it below to reset your password.
          </p>

          {/* Code Input Fields */}
          <div className="mt-8">
            <div className="flex justify-center gap-2">
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  className="h-14 w-12 rounded-xl border-2 border-emerald-600/50 bg-surfaceAlt/70 text-center text-2xl font-semibold text-textPrimary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              ))}
            </div>

            {verifyCode.isError && (
              <p className="mt-4 text-center text-sm text-danger">
                Invalid or expired code. Please try again.
              </p>
            )}
          </div>

          {/* Verify Button */}
          <button
            onClick={() => handleSubmit()}
            disabled={code.join("").length !== 6 || verifyCode.isPending}
            className="mt-8 w-full rounded-xl bg-primary px-4 py-3 font-medium text-slate-900 transition hover:opacity-90 disabled:opacity-50"
          >
            {verifyCode.isPending ? "Verifying..." : "Verify Code"}
          </button>

          {/* Resend Code */}
          <div className="mt-6 text-center text-sm text-textSecondary">
            Didn't receive a code?{" "}
            {resendCountdown > 0 ? (
              <span className="text-textSecondary">
                Resend ({formatTime(resendCountdown)})
              </span>
            ) : (
              <button
                onClick={() => resendCode.mutate()}
                disabled={resendCode.isPending}
                className="font-medium text-primary hover:underline disabled:opacity-50"
              >
                {resendCode.isPending ? "Sending..." : "Resend"}
              </button>
            )}
          </div>

          {/* Back to Login */}
          <p className="mt-6 text-center text-sm text-textSecondary">
            <Link href="/login" className="font-medium text-primary hover:underline">
              ← Back to Login
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

