import Link from "next/link";
import { User } from "@/lib/types";
import clsx from "clsx";
import { usePathname } from "next/navigation";

type Props = {
  user: User;
  mobileOpen: boolean;
  onClose: () => void;
};

const links = [
  { href: "/", label: "Dashboard", icon: "📊" },
  { href: "/expenses", label: "Expenses", icon: "💸" },
  { href: "/notifications", label: "Notifications", icon: "🔔" },
  { href: "/members", label: "Members", icon: "👥" },
  { href: "/profile", label: "Profile", icon: "👤" }
];

export default function Sidebar({ user, mobileOpen, onClose }: Props) {
  const pathname = usePathname();

  return (
    <>
      <div
        className={clsx(
          "fixed inset-y-0 left-0 z-40 w-72 transform border-r border-surfaceAlt bg-surface p-6 shadow-xl transition duration-300 md:static md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex items-center justify-between">
          <p className="text-xl font-semibold">Family Finance</p>
          <button
            className="md:hidden"
            onClick={onClose}
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>
        <div className="mt-8 space-y-6">
          <div>
            <p className="text-sm uppercase tracking-wide text-textSecondary">
              Logged in as
            </p>
            <h2 className="mt-2 text-lg font-semibold">{user.name}</h2>
            <p className="text-sm text-textSecondary">
              {user.relationship} · {user.role}
            </p>
          </div>
          <nav className="space-y-2">
            {links.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={clsx(
                    "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                    active
                      ? "bg-primary/20 text-primary"
                      : "text-textSecondary hover:bg-surfaceAlt/70 hover:text-textPrimary"
                  )}
                  onClick={onClose}
                >
                  <span className="text-lg">{link.icon}</span>
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
          onClick={onClose}
        />
      )}
    </>
  );
}

