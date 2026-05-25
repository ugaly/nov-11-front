import type { ExpenseRecord } from "@/lib/expenses/expense-types";

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export const DUMMY_EXPENSES_SEED: ExpenseRecord[] = [
  {
    id: "exp-001",
    referenceNumber: "EXP-2026-0041",
    title: "Client visit — Arusha",
    vendor: "Precision Air",
    category: "TRAVEL",
    description: "Round trip DSM–ARK for engagement kickoff",
    currency: "TZS",
    amount: 890_000,
    status: "PAID",
    expenseDate: daysAgo(10),
    createdAt: daysAgo(11),
    paidAt: daysAgo(9),
    paymentMethod: "Card",
    linkedPaymentRef: "PAY-2026-0001",
    notes: "Billable to engagement ENG-2026-0142",
    reminders: [
      {
        id: "rem-exp-1",
        schedule: "ONE_MONTH_BEFORE",
        note: "Attach boarding passes to engagement file",
      },
    ],
    history: [
      { id: "h1", at: daysAgo(11), label: "Submitted" },
      { id: "h2", at: daysAgo(10), label: "Approved" },
      { id: "h3", at: daysAgo(9), label: "Marked paid" },
    ],
  },
  {
    id: "exp-002",
    referenceNumber: "EXP-2026-0042",
    title: "Microsoft 365 seats",
    vendor: "Microsoft",
    category: "SOFTWARE",
    description: "Annual renewal — 12 users",
    currency: "TZS",
    amount: 2_400_000,
    status: "APPROVED",
    expenseDate: daysAgo(3),
    createdAt: daysAgo(4),
    reminders: [
      {
        id: "rem-exp-2",
        schedule: "EVERY_MONTH",
        note: "Process payment before renewal lapses",
      },
    ],
    history: [
      { id: "h1", at: daysAgo(4), label: "Submitted for approval" },
      { id: "h2", at: daysAgo(3), label: "Approved by finance" },
    ],
  },
  {
    id: "exp-003",
    referenceNumber: "EXP-2026-0043",
    title: "Office refreshments",
    vendor: "Local supermarket",
    category: "OFFICE",
    description: "Monthly pantry restock",
    currency: "TZS",
    amount: 185_000,
    status: "DRAFT",
    expenseDate: daysAgo(1),
    createdAt: daysAgo(1),
    history: [{ id: "h1", at: daysAgo(1), label: "Draft created" }],
  },
];
