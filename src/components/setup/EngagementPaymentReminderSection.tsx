"use client";

import type { GeneralPermissionDto } from "@/api/types/general";
import ReminderFields from "@/components/shared/ReminderFields";
import Label from "@/components/form/Label";
import type { ReminderEntry } from "@/lib/reminders/reminder-types";

const checkboxClass =
  "size-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500";

export default function EngagementPaymentReminderSection({
  reminders,
  onRemindersChange,
  recipientUserIds,
  onRecipientsChange,
  officeUsers,
  periodEnd,
  loadingUsers,
}: {
  reminders: ReminderEntry[];
  onRemindersChange: (items: ReminderEntry[]) => void;
  recipientUserIds: string[];
  onRecipientsChange: (ids: string[]) => void;
  officeUsers: GeneralPermissionDto[];
  periodEnd: string;
  loadingUsers?: boolean;
}) {
  const hasReminders = reminders.length > 0;

  function toggleRecipient(userId: string) {
    onRecipientsChange(
      recipientUserIds.includes(userId)
        ? recipientUserIds.filter((id) => id !== userId)
        : [...recipientUserIds, userId]
    );
  }

  return (
    <div className="space-y-4 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        Payment reminders
        <span className="ml-1 font-normal normal-case text-gray-400">
          (optional)
        </span>
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Send email reminders to internal office users before the period end date.
        Each reminder can include its own message.
      </p>

      <ReminderFields
        value={reminders}
        onChange={onRemindersChange}
        referenceDate={periodEnd}
        referenceKind="engagement"
        optional
      />

      {hasReminders ? (
        <div className="space-y-2 border-t border-gray-200 pt-4 dark:border-gray-700">
          <Label>Reminder recipients *</Label>
          <p className="text-xs text-gray-500">
            Select one or more office users to receive the reminder emails.
          </p>
          {loadingUsers ? (
            <p className="text-xs text-gray-500">Loading office users…</p>
          ) : officeUsers.length === 0 ? (
            <p className="text-xs text-amber-700 dark:text-amber-300">
              No office users found for this customer&apos;s office.
            </p>
          ) : (
            <ul className="max-h-40 space-y-2 overflow-y-auto rounded-lg border border-gray-200 p-3 dark:border-gray-700">
              {officeUsers.map((user) => {
                const checked = recipientUserIds.includes(user.userId);
                return (
                  <li key={user.userId}>
                    <label className="flex cursor-pointer items-start gap-3 rounded-md px-1 py-1 hover:bg-gray-50 dark:hover:bg-gray-900/40">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleRecipient(user.userId)}
                        className={`${checkboxClass} mt-0.5`}
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-gray-800 dark:text-white/90">
                          {user.userFullName}
                        </span>
                        <span className="text-xs text-gray-500">
                          {user.userEmail}
                        </span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
