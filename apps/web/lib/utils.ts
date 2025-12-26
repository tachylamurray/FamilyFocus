export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(amount);
}

export function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(date));
}

export type PasswordStrength = "Weak" | "Medium" | "Strong";

export type PasswordStrengthResult = {
  strength: PasswordStrength;
  percentage: number;
  requirements: {
    minLength: boolean;
    hasNumber: boolean;
    hasSpecialChar: boolean;
  };
};

export function calculatePasswordStrength(password: string): PasswordStrengthResult {
  const requirements = {
    minLength: password.length >= 8,
    hasNumber: /\d/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  };

  const metCount = Object.values(requirements).filter(Boolean).length;
  const totalRequirements = Object.keys(requirements).length;

  let strength: PasswordStrength;
  let percentage: number;

  if (metCount === 0) {
    strength = "Weak";
    percentage = 0;
  } else if (metCount === 1) {
    strength = "Weak";
    percentage = 33;
  } else if (metCount === 2) {
    strength = "Medium";
    percentage = 66;
  } else {
    strength = "Strong";
    percentage = 100;
  }

  return {
    strength,
    percentage,
    requirements
  };
}

