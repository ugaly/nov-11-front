import type {
  InvoiceCustomerOption,
  InvoiceRecord,
} from "@/lib/invoices/invoice-types";

const today = new Date();

function isoDaysFromNow(days: number): string {
  const d = new Date(today);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function isoDaysAgo(days: number): string {
  return isoDaysFromNow(-days);
}

export const DUMMY_INVOICE_CUSTOMERS: InvoiceCustomerOption[] = [
  {
    id: "cust-1",
    name: "Kilimanjaro Trading Co.",
    email: "accounts@kilimanjaro.co.tz",
    billingAddress: "Plot 12, Samora Ave, Dar es Salaam, Tanzania",
  },
  {
    id: "cust-2",
    name: "Serengeti Holdings Ltd",
    email: "finance@serengeti-holdings.com",
    billingAddress: "Oysterbay, Kinondoni, Dar es Salaam",
  },
  {
    id: "cust-3",
    name: "Coastal Ventures",
    email: "billing@coastalventures.tz",
    billingAddress: "Masaki Peninsula, Dar es Salaam",
  },
  {
    id: "cust-4",
    name: "Urban Retail TZ",
    email: "ap@urbanretail.tz",
    billingAddress: "Mikocheni B, Dar es Salaam",
  },
  {
    id: "cust-5",
    name: "East Africa Imports Ltd",
    email: "payments@ea-imports.com",
    billingAddress: "Kariakoo, Dar es Salaam",
  },
];

function line(
  id: string,
  description: string,
  quantity: number,
  unitPrice: number
) {
  return { id, description, quantity, unitPrice };
}

function totals(subtotal: number, vatIncluded = true, taxRate = 0.18) {
  const taxAmount = vatIncluded ? Math.round(subtotal * taxRate) : 0;
  return {
    subtotal,
    vatIncluded,
    taxRate,
    taxAmount,
    total: subtotal + taxAmount,
  };
}

export const DUMMY_INVOICES: InvoiceRecord[] = [
  {
    id: "inv-001",
    number: "INV-2026-0142",
    customerId: "cust-1",
    customerName: "Kilimanjaro Trading Co.",
    customerEmail: "accounts@kilimanjaro.co.tz",
    engagementRef: "ENG-2026-0142",
    catalogName: "Company secretarial retainer",
    type: "SUBSCRIPTION",
    status: "PAID",
    currency: "TZS",
    ...totals(1_850_000),
    amountPaid: 2_183_000,
    issuedAt: isoDaysAgo(18),
    dueAt: isoDaysAgo(4),
    paidAt: isoDaysAgo(6),
    billingAddress: DUMMY_INVOICE_CUSTOMERS[0]!.billingAddress,
    lineItems: [
      line("l1", "Monthly secretarial retainer — March 2026", 1, 1_500_000),
      line("l2", "Registry filing support (2 filings)", 2, 175_000),
    ],
    activities: [
      { id: "a1", at: isoDaysAgo(6), label: "Marked as paid", detail: "Bank transfer ref TRX-88421" },
      { id: "a2", at: isoDaysAgo(18), label: "Invoice sent", detail: "Email to accounts@kilimanjaro.co.tz" },
      { id: "a3", at: isoDaysAgo(18), label: "Invoice created", detail: "Auto-generated from engagement" },
    ],
  },
  {
    id: "inv-002",
    number: "INV-2026-0140",
    customerId: "cust-2",
    customerName: "Serengeti Holdings Ltd",
    customerEmail: "finance@serengeti-holdings.com",
    engagementRef: "ENG-2026-0140",
    catalogName: "Annual returns & filings",
    type: "RENEWAL",
    status: "DUE_7_DAYS",
    currency: "TZS",
    ...totals(2_400_000),
    amountPaid: 0,
    issuedAt: isoDaysAgo(8),
    dueAt: isoDaysFromNow(5),
    billingAddress: DUMMY_INVOICE_CUSTOMERS[1]!.billingAddress,
    lineItems: [
      line("l1", "Annual return preparation & filing", 1, 1_800_000),
      line("l2", "BRELA lodgement fees (disbursement)", 1, 600_000),
    ],
    notes: "Renewal for FY2025 compliance package.",
    activities: [
      { id: "a1", at: isoDaysAgo(3), label: "Reminder sent", detail: "Due in 7 days" },
      { id: "a2", at: isoDaysAgo(8), label: "Invoice sent" },
    ],
  },
  {
    id: "inv-003",
    number: "INV-2026-0138",
    customerId: "cust-3",
    customerName: "Coastal Ventures",
    customerEmail: "billing@coastalventures.tz",
    catalogName: "VAT registration & returns",
    type: "ONE_TIME",
    status: "UNPAID",
    currency: "TZS",
    ...totals(950_000),
    amountPaid: 0,
    issuedAt: isoDaysAgo(5),
    dueAt: isoDaysFromNow(25),
    billingAddress: DUMMY_INVOICE_CUSTOMERS[2]!.billingAddress,
    lineItems: [line("l1", "VAT registration — TRA application & setup", 1, 950_000)],
    activities: [{ id: "a1", at: isoDaysAgo(5), label: "Invoice sent" }],
  },
  {
    id: "inv-004",
    number: "INV-2026-0135",
    customerId: "cust-4",
    customerName: "Urban Retail TZ",
    customerEmail: "ap@urbanretail.tz",
    engagementRef: "ENG-2026-0135",
    catalogName: "Share transfer & board resolutions",
    type: "UPGRADE",
    status: "DUE_30_DAYS",
    currency: "TZS",
    ...totals(3_200_000),
    amountPaid: 0,
    issuedAt: isoDaysAgo(2),
    dueAt: isoDaysFromNow(28),
    billingAddress: DUMMY_INVOICE_CUSTOMERS[3]!.billingAddress,
    lineItems: [
      line("l1", "Upgrade: premium legal advisory tier", 1, 2_200_000),
      line("l2", "Share transfer documentation pack", 1, 1_000_000),
    ],
    activities: [
      { id: "a1", at: isoDaysAgo(2), label: "Upgrade invoice issued" },
      { id: "a2", at: isoDaysAgo(2), label: "Invoice sent" },
    ],
  },
  {
    id: "inv-005",
    number: "INV-2026-0132",
    customerId: "cust-5",
    customerName: "East Africa Imports Ltd",
    customerEmail: "payments@ea-imports.com",
    type: "MANUAL",
    status: "OVERDUE",
    currency: "TZS",
    ...totals(1_100_000),
    amountPaid: 0,
    issuedAt: isoDaysAgo(45),
    dueAt: isoDaysAgo(15),
    billingAddress: DUMMY_INVOICE_CUSTOMERS[4]!.billingAddress,
    lineItems: [line("l1", "Ad-hoc board minutes & resolutions", 1, 1_100_000)],
    activities: [
      { id: "a1", at: isoDaysAgo(10), label: "Overdue reminder sent" },
      { id: "a2", at: isoDaysAgo(45), label: "Invoice created", detail: "Manual invoice" },
    ],
  },
  {
    id: "inv-006",
    number: "INV-2026-0128",
    customerId: "cust-1",
    customerName: "Kilimanjaro Trading Co.",
    customerEmail: "accounts@kilimanjaro.co.tz",
    catalogName: "Formation of new company",
    type: "ONE_TIME",
    status: "DUE_7_DAYS",
    currency: "TZS",
    ...totals(4_500_000),
    amountPaid: 0,
    issuedAt: isoDaysAgo(12),
    dueAt: isoDaysFromNow(3),
    billingAddress: DUMMY_INVOICE_CUSTOMERS[0]!.billingAddress,
    lineItems: [
      line("l1", "Company incorporation — Tanzania", 1, 3_500_000),
      line("l1b", "Memorandum & articles drafting", 1, 1_000_000),
    ],
    activities: [{ id: "a1", at: isoDaysAgo(12), label: "Invoice sent" }],
  },
  {
    id: "inv-007",
    number: "INV-2026-0125",
    customerId: "cust-2",
    customerName: "Serengeti Holdings Ltd",
    customerEmail: "finance@serengeti-holdings.com",
    type: "SUBSCRIPTION",
    status: "PAID",
    currency: "TZS",
    ...totals(1_500_000),
    amountPaid: 1_770_000,
    issuedAt: isoDaysAgo(35),
    dueAt: isoDaysAgo(21),
    paidAt: isoDaysAgo(22),
    billingAddress: DUMMY_INVOICE_CUSTOMERS[1]!.billingAddress,
    lineItems: [line("l1", "Monthly secretarial retainer — February 2026", 1, 1_500_000)],
    activities: [{ id: "a1", at: isoDaysAgo(22), label: "Marked as paid" }],
  },
  {
    id: "inv-008",
    number: "INV-2026-0120",
    customerId: "cust-3",
    customerName: "Coastal Ventures",
    customerEmail: "billing@coastalventures.tz",
    type: "RENEWAL",
    status: "DRAFT",
    currency: "TZS",
    ...totals(800_000),
    amountPaid: 0,
    issuedAt: isoDaysAgo(1),
    dueAt: isoDaysFromNow(30),
    billingAddress: DUMMY_INVOICE_CUSTOMERS[2]!.billingAddress,
    lineItems: [line("l1", "Annual compliance renewal — draft", 1, 800_000)],
    activities: [{ id: "a1", at: isoDaysAgo(1), label: "Draft saved" }],
  },
  {
    id: "inv-009",
    number: "INV-2026-0115",
    customerId: "cust-4",
    customerName: "Urban Retail TZ",
    customerEmail: "ap@urbanretail.tz",
    type: "MANUAL",
    status: "CANCELLED",
    currency: "TZS",
    ...totals(450_000),
    amountPaid: 0,
    issuedAt: isoDaysAgo(60),
    dueAt: isoDaysAgo(30),
    billingAddress: DUMMY_INVOICE_CUSTOMERS[3]!.billingAddress,
    lineItems: [line("l1", "Consultation — cancelled engagement", 1, 450_000)],
    activities: [
      { id: "a1", at: isoDaysAgo(55), label: "Invoice cancelled", detail: "Client requested cancellation" },
    ],
  },
  {
    id: "inv-010",
    number: "INV-2026-0110",
    customerId: "cust-5",
    customerName: "East Africa Imports Ltd",
    customerEmail: "payments@ea-imports.com",
    type: "UPGRADE",
    status: "UNPAID",
    currency: "TZS",
    ...totals(2_750_000),
    amountPaid: 0,
    issuedAt: isoDaysAgo(7),
    dueAt: isoDaysFromNow(23),
    billingAddress: DUMMY_INVOICE_CUSTOMERS[4]!.billingAddress,
    lineItems: [line("l1", "Upgrade to full tax compliance package", 1, 2_750_000)],
    activities: [{ id: "a1", at: isoDaysAgo(7), label: "Invoice sent" }],
  },
];

export function getDummyInvoiceById(id: string): InvoiceRecord | undefined {
  return DUMMY_INVOICES.find((inv) => inv.id === id);
}
