"use client";

import AppShell from "@/components/AppShell";
import OverviewCards from "@/components/OverviewCards";
import SpendingByCategory from "@/components/SpendingByCategory";
import UpcomingBills from "@/components/UpcomingBills";
import NotificationsPanel from "@/components/NotificationsPanel";
import IncomeSources from "@/components/IncomeSources";
import { useAuth } from "@/components/AuthProvider";
import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  const { data: overviewData, isLoading: overviewLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api.getDashboard(),
    enabled: !!user
  });

  const { data: notificationsData, isLoading: notificationsLoading } =
    useQuery({
      queryKey: ["notifications"],
      queryFn: () => api.listNotifications(),
      enabled: !!user
    });

  if (!user) {
    return null;
  }

  return (
    <AppShell>
      <div className="space-y-8">
        <OverviewCards
          overview={overviewData?.overview}
          isLoading={overviewLoading}
        />
        <div className="grid gap-6 lg:grid-cols-3">
          <IncomeSources
            overview={overviewData?.overview}
            isLoading={overviewLoading}
          />
          <div className="lg:col-span-2">
            <UpcomingBills
              overview={overviewData?.overview}
              isLoading={overviewLoading}
            />
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <SpendingByCategory
            overview={overviewData?.overview}
            isLoading={overviewLoading}
          />
          <div className="lg:col-span-2">
            <NotificationsPanel
              notifications={notificationsData?.notifications}
              isLoading={notificationsLoading}
            />
          </div>
        </div>
      </div>
    </AppShell>
  );
}

