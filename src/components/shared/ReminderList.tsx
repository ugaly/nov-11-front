"use client";

import { formatReminderDateTime, type ReminderEntry } from "@/lib/reminders/reminder-types";
import { Bell } from "lucide-react";

export default function ReminderList({ reminders }: { reminders?: ReminderEntry[] }) {
  if (!reminders?.length) {
    return <p className="text-sm text-gray-500">No reminders set.</p>;
  }

  return (
    <ul className="space-y-2">
      {reminders.map((r) => (
        <li
          key={r.id}
          className="flex gap-2 rounded-lg border border-gray-100 bg-gray-50/80 px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-900/50"
        >
          <Bell className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden />
          <div className="min-w-0">
            <p className="font-medium text-gray-900 dark:text-white">
              {formatReminderDateTime(r.at)}
            </p>
            {r.note ? (
              <p className="text-xs text-gray-500 dark:text-gray-400">{r.note}</p>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
