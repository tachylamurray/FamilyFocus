"use client";

import { useAuth } from "@/components/AuthProvider";
import { User } from "@/lib/types";
import clsx from "clsx";

type Props = {
  user: User;
  pathname: string;
  onMenuToggle: () => void;
};

const titles: Record<string, string> = {
  "/": "Family Finance Dashboard",
  "/expenses": "Manage Expenses",
  "/notifications": "Family Notifications",
  "/members": "Family Members",
  "/profile": "Profile Settings"
};

export default function TopBar({ user, pathname, onMenuToggle }: Props) {
  const { logout } = useAuth();
  const title = titles[pathname] ?? "Family Finance";

  return (
    <header className="border-b border-surfaceAlt bg-surface/80 px-4 py-5 shadow-sm backdrop-blur md:px-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            className="rounded-full bg-surfaceAlt px-3 py-2 text-lg md:hidden"
            onClick={onMenuToggle}
          >
            ☰
          </button>
          <div>
            <h1 className="text-xl font-semibold md:text-2xl">{title}</h1>
            <p className="text-sm text-textSecondary">
              Welcome back, {user.name.split(" ")[0]}!
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden flex-col text-right text-sm text-textSecondary md:flex">
            <span className="font-medium text-textPrimary">{user.name}</span>
            <span>{user.relationship}</span>
          </div>
          <div
            className={clsx(
              "flex h-11 w-11 items-center justify-center rounded-full bg-primary text-slate-900"
            )}
          >
            {user.name
              .split(" ")
              .map((part) => part[0])
              .join("" )}
          </div>
          <button
            onClick={logout}
            className="rounded-xl border border-primary/60 px-4 py-2 text-sm font-medium text-primary transition hover:bg-primary/10"
          >
            Log Out
          </button>
        </div>
      </div>
    </header>
  );
}

