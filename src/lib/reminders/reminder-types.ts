/** Scheduled reminder — `at` is local datetime `YYYY-MM-DD HH:mm`. */
export type ReminderEntry = {
  id: string;
  at: string;
  note?: string;
};

export function newReminderId(): string {
  return `rem_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function createEmptyReminder(): ReminderEntry {
  return { id: newReminderId(), at: "", note: "" };
}

export function sanitizeReminders(items: ReminderEntry[]): ReminderEntry[] {
  return items
    .filter((r) => r.at.trim())
    .map((r) => ({
      id: r.id,
      at: r.at.trim(),
      note: r.note?.trim() || undefined,
    }));
}

export function formatReminderDateTime(at: string): string {
  try {
    const normalized = at.includes("T") ? at : at.replace(" ", "T");
    const d = new Date(normalized);
    if (Number.isNaN(d.getTime())) return at;
    return d.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return at;
  }
}
