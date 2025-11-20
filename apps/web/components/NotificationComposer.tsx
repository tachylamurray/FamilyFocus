"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { User } from "@/lib/types";

const schema = z.object({
  message: z.string().min(4, "Please enter a quick message"),
  recipients: z.array(z.string()).optional()
});

type FormValues = z.infer<typeof schema>;

type Props = {
  members: User[];
  onSubmit: (values: FormValues) => Promise<void>;
  submitting: boolean;
};

export default function NotificationComposer({
  members,
  onSubmit,
  submitting
}: Props) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      message: "",
      recipients: []
    }
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values);
    form.reset();
  });

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl border border-surfaceAlt bg-surfaceAlt/50 p-6 shadow-lg"
    >
      <h2 className="text-lg font-semibold">Send a Family Update</h2>
      <p className="mt-1 text-sm text-textSecondary">
        Keep everyone aligned on important financial events.
      </p>
      <textarea
        rows={4}
        className="mt-4 w-full resize-none rounded-2xl border border-surfaceAlt bg-surface px-4 py-3 text-sm text-textPrimary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
        placeholder="e.g., John Doe’s social security benefits end Monday, Nov 11."
        {...form.register("message")}
      />
      {form.formState.errors.message && (
        <p className="mt-1 text-sm text-danger">
          {form.formState.errors.message.message}
        </p>
      )}
      <div className="mt-4 space-y-2 text-sm text-textSecondary">
        <p>Select recipients (optional)</p>
        <div className="grid gap-2 md:grid-cols-2">
          {members.map((member) => (
            <label
              key={member.id}
              className="flex items-center gap-3 rounded-2xl border border-surfaceAlt bg-surface px-4 py-3"
            >
              <input
                type="checkbox"
                value={member.id}
                {...form.register("recipients")}
              />
              <span>
                <span className="font-medium text-textPrimary">
                  {member.name}
                </span>{" "}
                <span className="text-xs uppercase text-textSecondary">
                  {member.role}
                </span>
              </span>
            </label>
          ))}
        </div>
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="mt-6 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-slate-900 transition hover:opacity-90 disabled:opacity-50"
      >
        {submitting ? "Sending..." : "Send Notification"}
      </button>
    </form>
  );
}

