"use client";

import { Notification } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { useState } from "react";

type Props = {
  notifications: Notification[] | undefined;
  isLoading: boolean;
  onUpdate?: (id: string, message: string) => Promise<void>;
  isUpdating?: boolean;
};

export default function NotificationsPanel({
  notifications,
  isLoading,
  onUpdate,
  isUpdating = false
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editMessage, setEditMessage] = useState("");

  const handleEdit = (notification: Notification) => {
    setEditingId(notification.id);
    setEditMessage(notification.message);
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditMessage("");
  };

  const handleSave = async (id: string) => {
    if (onUpdate && editMessage.trim().length >= 4) {
      await onUpdate(id, editMessage.trim());
      setEditingId(null);
      setEditMessage("");
    }
  };

  if (isLoading) {
    return (
      <div className="h-64 animate-pulse rounded-3xl bg-surfaceAlt/60" />
    );
  }

  if (!notifications?.length) {
    return (
      <section className="rounded-3xl border border-surfaceAlt bg-surfaceAlt/50 p-6 shadow-lg">
        <h2 className="text-lg font-semibold">Family Notifications</h2>
        <p className="mt-4 text-sm text-textSecondary">
          No notifications yet. Send an update to stay aligned.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-surfaceAlt bg-surfaceAlt/50 p-6 shadow-lg">
      <h2 className="text-lg font-semibold">Family Notifications</h2>
      <div className="mt-6 space-y-4">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className="rounded-2xl border border-surfaceAlt bg-surfaceAlt/80 p-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-textSecondary">
                  {formatDate(notification.createdAt)} • {notification.sender.name}
                </p>
                {editingId === notification.id ? (
                  <div className="mt-2 space-y-2">
                    <textarea
                      value={editMessage}
                      onChange={(e) => setEditMessage(e.target.value)}
                      rows={3}
                      className="w-full resize-none rounded-xl border-2 border-emerald-600/50 bg-surface px-4 py-2 text-sm text-textPrimary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                      disabled={isUpdating}
                    />
                    {editMessage.trim().length < 4 && (
                      <p className="text-xs text-danger">
                        Message must be at least 4 characters
                      </p>
                    )}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSave(notification.id)}
                        disabled={isUpdating || editMessage.trim().length < 4}
                        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-slate-900 transition hover:opacity-90 disabled:opacity-50"
                      >
                        {isUpdating ? "Saving..." : "Save"}
                      </button>
                      <button
                        onClick={handleCancel}
                        disabled={isUpdating}
                        className="rounded-lg border border-surfaceAlt px-4 py-2 text-sm font-medium text-textSecondary transition hover:bg-surfaceAlt disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 font-medium">{notification.message}</p>
                )}
              </div>
              {editingId !== notification.id && onUpdate && (
                <button
                  onClick={() => handleEdit(notification)}
                  className="ml-4 rounded-lg px-3 py-1 text-sm text-textSecondary transition hover:bg-surfaceAlt hover:text-textPrimary"
                  title="Edit notification"
                >
                  ✏️
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

