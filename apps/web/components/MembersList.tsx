import { User } from "@/lib/types";

type Props = {
  members: User[] | undefined;
};

const roleDescriptions: Record<string, string> = {
  ADMIN: "Full access",
  MEMBER: "Can manage own expenses",
  VIEW_ONLY: "Read-only access"
};

export default function MembersList({ members }: Props) {
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
            <div className="text-right text-sm text-textSecondary">
              <p className="font-semibold text-textPrimary">{member.role}</p>
              <p>{roleDescriptions[member.role]}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

