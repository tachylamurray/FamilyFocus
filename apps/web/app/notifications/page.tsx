"use client";

import AppShell from "@/components/AppShell";
import NotificationComposer from "@/components/NotificationComposer";
import NotificationsPanel from "@/components/NotificationsPanel";
import { useAuth } from "@/components/AuthProvider";
import { api } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function NotificationsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  const { data: notificationsData, isLoading: notificationsLoading } =
    useQuery({
      queryKey: ["notifications"],
      queryFn: () => api.listNotifications(),
      enabled: !!user
    });

  const { data: membersData } = useQuery({
    queryKey: ["members"],
    queryFn: () => api.listMembers(),
    enabled: !!user
  });

  const sendNotification = useMutation({
    mutationFn: (payload: { message: string; recipients?: string[] }) =>
      api.createNotification(payload.message, payload.recipients),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
  });

  if (!user) {
    return null;
  }

  return (
    <AppShell>
      <div className="grid gap-6 lg:grid-cols-2">
        <NotificationComposer
          members={membersData?.members ?? []}
          submitting={sendNotification.isPending}
          onSubmit={async ({ message, recipients }) => {
            await sendNotification.mutateAsync({
              message,
              recipients:
                recipients && recipients.length > 0 ? recipients : undefined
            });
          }}
        />
        <NotificationsPanel
          notifications={notificationsData?.notifications}
          isLoading={notificationsLoading}
        />
      </div>
    </AppShell>
  );
}

