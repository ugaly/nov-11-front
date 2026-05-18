export type DashboardPeriod = "today" | "week" | "month";

export const DASHBOARD_PERIOD_LABELS: Record<DashboardPeriod, string> = {
  today: "Today",
  week: "This week",
  month: "This month",
};

export function periodRange(period: DashboardPeriod): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  if (period === "today") {
    return { start, end };
  }

  if (period === "week") {
    start.setDate(start.getDate() - 6);
    return { start, end };
  }

  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  return { start, end };
}

export function isDateInPeriod(
  iso: string | null | undefined,
  period: DashboardPeriod
): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  const { start, end } = periodRange(period);
  return d >= start && d <= end;
}

/** Last N calendar days ending today (for daily category chart). */
export function lastNDays(n: number): Date[] {
  const days: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push(d);
  }
  return days;
}

export function formatDayLabel(d: Date): string {
  return d.toLocaleDateString(undefined, { weekday: "short" });
}

/** Last N months including current (for monthly category chart). */
export function lastNMonths(n: number): { key: string; label: string }[] {
  const out: { key: string; label: string }[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString(undefined, { month: "short" });
    out.push({ key, label });
  }
  return out;
}

export function monthKey(iso: string): string | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function dayKey(iso: string): string | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}
