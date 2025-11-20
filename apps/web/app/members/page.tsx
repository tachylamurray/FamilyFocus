"use client";

import AppShell from "@/components/AppShell";
import MembersList from "@/components/MembersList";
import { useAuth } from "@/components/AuthProvider";
import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function MembersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  const { data, isLoading } = useQuery({
    queryKey: ["members"],
    queryFn: () => api.listMembers(),
    enabled: !!user
  });

  if (!user) {
    return null;
  }

  return (
    <AppShell>
      {isLoading ? (
        <div className="h-64 animate-pulse rounded-3xl bg-surfaceAlt/60" />
      ) : (
        <MembersList members={data?.members} />
      )}
    </AppShell>
  );
}

