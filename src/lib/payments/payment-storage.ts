import { DUMMY_PAYMENTS_SEED } from "@/lib/payments/payment-dummy-data";
import type { PaymentRecord } from "@/lib/payments/payment-types";
import { derivePaymentStatus } from "@/lib/payments/payment-utils";

const STORAGE_KEY = "nov_payments_v1";

function readAll(): PaymentRecord[] {
  if (typeof window === "undefined") return [...DUMMY_PAYMENTS_SEED];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [...DUMMY_PAYMENTS_SEED];
    const parsed = JSON.parse(raw) as PaymentRecord[];
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : [...DUMMY_PAYMENTS_SEED];
  } catch {
    return [...DUMMY_PAYMENTS_SEED];
  }
}

function writeAll(items: PaymentRecord[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function listPayments(): PaymentRecord[] {
  return readAll().sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getPaymentById(id: string): PaymentRecord | undefined {
  return readAll().find((p) => p.id === id);
}

export function savePayment(record: PaymentRecord): PaymentRecord {
  const items = readAll();
  const idx = items.findIndex((p) => p.id === record.id);
  const normalized: PaymentRecord = {
    ...record,
    status: derivePaymentStatus(
      record.amountDue,
      record.amountPaid,
      record.status
    ),
  };
  if (idx >= 0) items[idx] = normalized;
  else items.unshift(normalized);
  writeAll(items);
  return normalized;
}

export function deletePayment(id: string): void {
  writeAll(readAll().filter((p) => p.id !== id));
}

export function nextPaymentReference(): string {
  const year = new Date().getFullYear();
  const n = readAll().length + 1;
  return `PAY-${year}-${String(n).padStart(4, "0")}`;
}
