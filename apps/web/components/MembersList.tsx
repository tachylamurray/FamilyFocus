"use client";

import { User } from "@/lib/types";
import { useAuth } from "@/components/AuthProvider";
import { api } from "@/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

type Props = {
  members: User[] | undefined;
};

const roleDescriptions: Record<string, string> = {
  ADMIN: "Full access",
  MEMBER: "Can manage own expenses",
  VIEW_ONLY: "Read-only access"
};

type ConfirmationAction = "promote" | "demote" | "delete";

type ConfirmationState = {
  member: User;
  action: ConfirmationAction;
};

export default function MembersList({ members }: Props) {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [confirmationState, setConfirmationState] = useState<ConfirmationState | null>(null);
  const isAdmin = currentUser?.role === "ADMIN";

  const updateRole = useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: "ADMIN" | "MEMBER" | "VIEW_ONLY" }) =>
      api.updateMemberRole(memberId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      setConfirmationState(null);
    }
  });

  const deleteMember = useMutation({
    mutationFn: api.deleteMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      setConfirmationState(null);
    }
  });

  const handleMakeAdmin = (member: User) => {
    if (member.role === "ADMIN" || member.id === currentUser?.id) {
      return;
    }
    setConfirmationState({ member, action: "promote" });
  };

  const handleRemoveAdmin = (member: User) => {
    if (member.role !== "ADMIN" || member.id === currentUser?.id) {
      return;
    }
    setConfirmationState({ member, action: "demote" });
  };

  const handleDeleteUser = (member: User) => {
    if (member.id === currentUser?.id) {
      return;
    }
    setConfirmationState({ member, action: "delete" });
  };

  const confirmAction = () => {
    if (confirmationState) {
      if (confirmationState.action === "delete") {
        deleteMember.mutate(confirmationState.member.id);
      } else {
        const role = confirmationState.action === "promote" ? "ADMIN" : "MEMBER";
        updateRole.mutate({ memberId: confirmationState.member.id, role });
      }
    }
  };

  if (!members?.length) {
    return (
      <section className="rounded-3xl border border-surfaceAlt bg-surfaceAlt/50 p-6 text-sm text-textSecondary">
        No members yet. Invite your family to collaborate.
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-surfaceAlt bg-surfaceAlt/50 p-6 shadow-lg">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Family Members</h2>
        <span className="text-xs text-textSecondary">
          {members.length} total
        </span>
      </div>
      <div className="mt-6 space-y-4">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between rounded-2xl border border-surfaceAlt bg-surfaceAlt/80 px-4 py-3"
          >
            <div>
              <p className="font-medium">{member.name}</p>
              <p className="text-sm text-textSecondary">{member.email}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right text-sm text-textSecondary">
                <p className="font-semibold text-textPrimary">{member.role}</p>
                <p>{roleDescriptions[member.role]}</p>
              </div>
              {isAdmin && member.id !== currentUser?.id && (
                <div className="flex gap-2">
                  {member.role !== "ADMIN" ? (
                    <button
                      onClick={() => handleMakeAdmin(member)}
                      disabled={updateRole.isPending || deleteMember.isPending}
                      className="rounded-xl border border-primary/60 px-4 py-2 text-sm font-medium text-primary transition hover:bg-primary/10 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Make Admin
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRemoveAdmin(member)}
                      disabled={updateRole.isPending || deleteMember.isPending}
                      className="rounded-xl border border-danger/60 px-4 py-2 text-sm font-medium text-danger transition hover:bg-danger/10 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Remove Admin
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteUser(member)}
                    disabled={updateRole.isPending || deleteMember.isPending}
                    className="rounded-xl border border-danger/60 bg-danger/10 px-4 py-2 text-sm font-medium text-danger transition hover:bg-danger/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Delete user"
                  >
                    🗑️
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Confirmation Dialog */}
      {confirmationState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-3xl border border-surfaceAlt bg-surface p-6 shadow-xl">
            <h3 className="text-lg font-semibold">
              {confirmationState.action === "promote" 
                ? "Confirm Admin Promotion" 
                : confirmationState.action === "demote"
                ? "Confirm Remove Admin"
                : "Confirm Delete User"}
            </h3>
            <p className="mt-2 text-sm text-textSecondary">
              {confirmationState.action === "promote" ? (
                <>
                  Are you sure you want to make <span className="font-medium text-textPrimary">{confirmationState.member.name}</span> an admin?
                </>
              ) : confirmationState.action === "demote" ? (
                <>
                  Are you sure you want to remove admin privileges from <span className="font-medium text-textPrimary">{confirmationState.member.name}</span>?
                </>
              ) : (
                <>
                  Are you sure you want to delete <span className="font-medium text-textPrimary">{confirmationState.member.name}</span>?
                </>
              )}
            </p>
            <p className="mt-1 text-xs text-textSecondary">
              {confirmationState.action === "promote" ? (
                "Admins have full access to all features, including the ability to promote other users to admin."
              ) : confirmationState.action === "demote" ? (
                "This user will be demoted to MEMBER role and will lose admin privileges, including the ability to promote other users."
              ) : (
                "This action cannot be undone. The user and all their associated data (notifications) will be permanently deleted. Their expenses and incomes will remain but will no longer be associated with a user."
              )}
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setConfirmationState(null)}
                disabled={updateRole.isPending || deleteMember.isPending}
                className="rounded-xl border border-surfaceAlt px-4 py-2 text-sm font-medium text-textSecondary transition hover:bg-surfaceAlt/70 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmAction}
                disabled={updateRole.isPending || deleteMember.isPending}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition hover:opacity-90 disabled:opacity-50 ${
                  confirmationState.action === "promote"
                    ? "bg-primary text-slate-900"
                    : "bg-danger text-white"
                }`}
              >
                {confirmationState.action === "delete" 
                  ? (deleteMember.isPending ? "Deleting..." : "Delete User")
                  : updateRole.isPending 
                    ? (confirmationState.action === "promote" ? "Promoting..." : "Removing...")
                    : (confirmationState.action === "promote" ? "Make Admin" : "Remove Admin")}
              </button>
            </div>
            {(updateRole.isError || deleteMember.isError) && (
              <p className="mt-4 text-sm text-danger">
                {confirmationState.action === "delete" 
                  ? "Failed to delete user. Please try again."
                  : "Failed to update role. Please try again."}
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

