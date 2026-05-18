/** Sample customer billing data until APIs are connected. */

export type CustomerPaymentRecord = {
  id: string;
  date: string;
  reference: string;
  description: string;
  amount: number;
  currency: string;
  method: string;
  status: "Paid" | "Pending" | "Failed" | "Refunded";
};

export function getDummyPaymentHistory(customerId: string): CustomerPaymentRecord[] {
  const seed = customerId.slice(-2);
  return [
    {
      id: "pay-1",
      date: "2026-03-01",
      reference: "TRX-88421",
      description: "INV-2026-0142 — Secretarial retainer",
      amount: 2_183_000,
      currency: "TZS",
      method: "Bank transfer",
      status: "Paid",
    },
    {
      id: "pay-2",
      date: "2026-02-14",
      reference: "TRX-88102",
      description: "INV-2026-0125 — February retainer",
      amount: 1_770_000,
      currency: "TZS",
      method: "Bank transfer",
      status: "Paid",
    },
    {
      id: "pay-3",
      date: "2026-01-28",
      reference: "M-PESA-9921",
      description: "INV-2026-0118 — Annual returns",
      amount: 950_000,
      currency: "TZS",
      method: "Mobile money",
      status: "Paid",
    },
    {
      id: "pay-4",
      date: "2026-01-05",
      reference: "—",
      description: "INV-2026-0102 — Formation deposit",
      amount: 1_500_000,
      currency: "TZS",
      method: "—",
      status: seed.charCodeAt(0) % 2 === 0 ? "Pending" : "Paid",
    },
    {
      id: "pay-5",
      date: "2025-12-10",
      reference: "TRX-87001",
      description: "INV-2025-0890 — Advisory pack",
      amount: 3_200_000,
      currency: "TZS",
      method: "Bank transfer",
      status: "Paid",
    },
  ];
}
