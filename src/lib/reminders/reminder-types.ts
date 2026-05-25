export type ReminderSchedule =
  | "ONE_WEEK_BEFORE"
  | "TWO_WEEKS_BEFORE"
  | "ONE_MONTH_BEFORE"
  | "ON_REFERENCE_DATE"
  | "EVERY_WEEK"
  | "EVERY_MONTH"
  | "CUSTOM";

export type ReminderEntry = {
  id: string;
  schedule: ReminderSchedule;
  /** Set when `schedule` is `CUSTOM` — `YYYY-MM-DD HH:mm`. */
  at?: string;
  note?: string;
};

export type ReminderReferenceKind = "due" | "expense";

export function newReminderId(): string {
  return `rem_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function createEmptyReminder(): ReminderEntry {
  return {
    id: newReminderId(),
    schedule: "ONE_WEEK_BEFORE",
    note: "",
  };
}

/** Normalize legacy rows that only stored `at`. */
export function normalizeReminder(
  raw: ReminderEntry & { at?: string; schedule?: ReminderSchedule }
): ReminderEntry {
  if (raw.schedule) {
    return {
      id: raw.id,
      schedule: raw.schedule,
      at: raw.schedule === "CUSTOM" ? raw.at?.trim() : undefined,
      note: raw.note?.trim() || undefined,
    };
  }
  if (raw.at?.trim()) {
    return {
      id: raw.id,
      schedule: "CUSTOM",
      at: raw.at.trim(),
      note: raw.note?.trim() || undefined,
    };
  }
  return { id: raw.id, schedule: "ONE_WEEK_BEFORE", note: raw.note?.trim() };
}

export function sanitizeReminders(items: ReminderEntry[]): ReminderEntry[] {
  return items
    .map((r) => normalizeReminder(r))
    .filter((r) => {
      if (r.schedule === "CUSTOM") return Boolean(r.at?.trim());
      return true;
    })
    .map((r) => ({
      id: r.id,
      schedule: r.schedule,
      at: r.schedule === "CUSTOM" ? r.at!.trim() : undefined,
      note: r.note?.trim() || undefined,
    }));
}

export function referenceDateLabel(kind: ReminderReferenceKind): string {
  return kind === "expense" ? "expense date" : "due date";
}

export function reminderScheduleOptions(
  kind: ReminderReferenceKind
): { value: ReminderSchedule; label: string }[] {
  const ref = referenceDateLabel(kind);
  return [
    { value: "ONE_WEEK_BEFORE", label: `1 week before ${ref}` },
    { value: "TWO_WEEKS_BEFORE", label: `2 weeks before ${ref}` },
    { value: "ONE_MONTH_BEFORE", label: `1 month before ${ref}` },
    { value: "ON_REFERENCE_DATE", label: `On ${ref}` },
    { value: "EVERY_WEEK", label: "Every week" },
    { value: "EVERY_MONTH", label: "Every month" },
    { value: "CUSTOM", label: "Specify date & time" },
  ];
}

export function reminderScheduleLabel(
  schedule: ReminderSchedule,
  kind: ReminderReferenceKind = "due"
): string {
  return (
    reminderScheduleOptions(kind).find((o) => o.value === schedule)?.label ??
    schedule
  );
}

function parseReferenceDate(isoDate: string): Date | null {
  const d = new Date(`${isoDate}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Format as `YYYY-MM-DD HH:mm` for storage/display. */
export function formatDateTimeLocal(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function resolveReminderDateTime(
  entry: ReminderEntry,
  referenceDate?: string
): string | null {
  const normalized = normalizeReminder(entry);
  if (normalized.schedule === "CUSTOM") {
    return normalized.at?.trim() || null;
  }
  if (!referenceDate) return null;

  const ref = parseReferenceDate(referenceDate);
  if (!ref) return null;

  const at = new Date(ref);
  at.setHours(9, 0, 0, 0);

  switch (normalized.schedule) {
    case "ONE_WEEK_BEFORE":
      at.setDate(at.getDate() - 7);
      return formatDateTimeLocal(at);
    case "TWO_WEEKS_BEFORE":
      at.setDate(at.getDate() - 14);
      return formatDateTimeLocal(at);
    case "ONE_MONTH_BEFORE":
      at.setMonth(at.getMonth() - 1);
      return formatDateTimeLocal(at);
    case "ON_REFERENCE_DATE":
      return formatDateTimeLocal(at);
    case "EVERY_WEEK":
    case "EVERY_MONTH":
      return null;
    default:
      return null;
  }
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

export function formatReminderSummary(
  entry: ReminderEntry,
  referenceDate?: string,
  kind: ReminderReferenceKind = "due"
): string {
  const normalized = normalizeReminder(entry);
  const label = reminderScheduleLabel(normalized.schedule, kind);

  if (
    normalized.schedule === "EVERY_WEEK" ||
    normalized.schedule === "EVERY_MONTH"
  ) {
    return label;
  }

  if (normalized.schedule === "CUSTOM") {
    const at = normalized.at?.trim();
    return at ? `${label} — ${formatReminderDateTime(at)}` : label;
  }

  const resolved = resolveReminderDateTime(normalized, referenceDate);
  if (resolved) {
    return `${label} (${formatReminderDateTime(resolved)})`;
  }

  return label;
}
