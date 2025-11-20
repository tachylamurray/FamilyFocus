"use client";

import { useAuth } from "@/components/AuthProvider";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { usePathname } from "next/navigation";
import { useState } from "react";

type Props = {
  children: React.ReactNode;
};

export default function AppShell({ children }: Props) {
  const { user } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        user={user}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar
          user={user}
          pathname={pathname ?? "/"}
          onMenuToggle={() => setMobileOpen((prev) => !prev)}
        />
        <main className="flex-1 overflow-y-auto bg-surface px-6 py-8 md:px-10">
          {children}
        </main>
      </div>
    </div>
  );
}

