import { Notification } from "@/lib/types";
import { formatDate } from "@/lib/utils";

type Props = {
  notifications: Notification[] | undefined;
  isLoading: boolean;
};

export default function NotificationsPanel({
  notifications,
  isLoading
}: Props) {
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
            <p className="text-sm text-textSecondary">
              {formatDate(notification.createdAt)} • {notification.sender.name}
            </p>
            <p className="mt-2 font-medium">{notification.message}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

