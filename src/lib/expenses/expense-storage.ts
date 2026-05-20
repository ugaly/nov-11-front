import { DUMMY_EXPENSES_SEED } from "@/lib/expenses/expense-dummy-data";
import type { ExpenseRecord } from "@/lib/expenses/expense-types";

const STORAGE_KEY = "nov_expenses_v1";

function readAll(): ExpenseRecord[] {
  if (typeof window === "undefined") return [...DUMMY_EXPENSES_SEED];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [...DUMMY_EXPENSES_SEED];
    const parsed = JSON.parse(raw) as ExpenseRecord[];
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : [...DUMMY_EXPENSES_SEED];
  } catch {
    return [...DUMMY_EXPENSES_SEED];
  }
}

function writeAll(items: ExpenseRecord[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function listExpenses(): ExpenseRecord[] {
  return readAll().sort(
    (a, b) =>
      new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime()
  );
}

export function getExpenseById(id: string): ExpenseRecord | undefined {
  return readAll().find((e) => e.id === id);
}

export function saveExpense(record: ExpenseRecord): ExpenseRecord {
  const items = readAll();
  const idx = items.findIndex((e) => e.id === record.id);
  if (idx >= 0) items[idx] = record;
  else items.unshift(record);
  writeAll(items);
  return record;
}

export function nextExpenseReference(): string {
  const year = new Date().getFullYear();
  const n = readAll().length + 1;
  return `EXP-${year}-${String(n).padStart(4, "0")}`;
}
