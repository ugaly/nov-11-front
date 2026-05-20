import type { PaymentRecord } from "@/lib/payments/payment-types";

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

export const DUMMY_PAYMENTS_SEED: PaymentRecord[] = [
  {
    id: "pay-001",
    referenceNumber: "PAY-2026-0001",
    payeeName: "TRA — Tanzania Revenue Authority",
    payeeAccount: "Control No. 992814002",
    category: "TAX",
    purpose: "PAYE remittance — March 2026",
    currency: "TZS",
    amountDue: 4_850_000,
    amountPaid: 4_850_000,
    status: "PAID",
    dueAt: daysAgo(5),
    createdAt: daysAgo(12),
    paidAt: daysAgo(4),
    paymentMethod: "BANK_TRANSFER",
    reconciliationNote: "Matched to payroll register PR-03/2026",
    linkedInvoiceNumber: "INV-2026-0142",
    attachments: [
      {
        id: "att-1",
        name: "tra-receipt-march.pdf",
        mimeType: "application/pdf",
        uploadedAt: daysAgo(4),
      },
    ],
    reminders: [
      {
        id: "rem-seed-1",
        at: `${daysFromNow(3)} 09:00`,
        note: "Confirm TRA acknowledgement letter",
      },
    ],
    history: [
      {
        id: "h1",
        at: daysAgo(12),
        label: "Payment scheduled",
        detail: "Created as unpaid, due for statutory filing",
      },
      {
        id: "h2",
        at: daysAgo(4),
        label: "Paid in full",
        detail: "NMB corporate transfer",
        amount: 4_850_000,
      },
    ],
  },
  {
    id: "pay-002",
    referenceNumber: "PAY-2026-0002",
    payeeName: "City Water & Sewerage",
    category: "UTILITY",
    purpose: "Office water — Q2 2026",
    currency: "TZS",
    amountDue: 385_000,
    amountPaid: 0,
    status: "UNPAID",
    dueAt: daysFromNow(7),
    createdAt: daysAgo(2),
    reconciliationNote: "Awaiting approval from finance lead",
    attachments: [],
    reminders: [
      {
        id: "rem-seed-2",
        at: `${daysFromNow(5)} 14:30`,
        note: "Pay before utility disconnect",
      },
      {
        id: "rem-seed-3",
        at: `${daysFromNow(1)} 08:00`,
        note: "Finance approval follow-up",
      },
    ],
    history: [
      {
        id: "h1",
        at: daysAgo(2),
        label: "Created",
        detail: "External utility — unpaid",
      },
    ],
  },
  {
    id: "pay-003",
    referenceNumber: "PAY-2026-0003",
    payeeName: "Serengeti Office Supplies Ltd",
    payeeAccount: "CRDB 0150 •••• 8821",
    category: "SUPPLIER",
    purpose: "Stationery & printer consumables",
    currency: "TZS",
    amountDue: 1_200_000,
    amountPaid: 600_000,
    status: "PARTIAL",
    dueAt: daysFromNow(14),
    createdAt: daysAgo(8),
    paidAt: daysAgo(1),
    paymentMethod: "BANK_TRANSFER",
    reconciliationNote: "50% deposit paid — balance after delivery",
    attachments: [
      {
        id: "att-2",
        name: "proforma-serengeti.pdf",
        mimeType: "application/pdf",
        uploadedAt: daysAgo(8),
      },
    ],
    history: [
      { id: "h1", at: daysAgo(8), label: "Created", detail: "Supplier order" },
      {
        id: "h2",
        at: daysAgo(1),
        label: "Partial payment",
        amount: 600_000,
        detail: "First instalment",
      },
    ],
  },
];
