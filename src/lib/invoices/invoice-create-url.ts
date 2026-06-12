/** Build `/invoices/create` with customer prefill for engagement / customer actions. */
export function invoiceCreateUrl(params: {
  customerId?: string;
  name?: string;
  email?: string;
  lineDescription?: string;
  amount?: number;
  notes?: string;
}): string {
  const q = new URLSearchParams();
  if (params.customerId) q.set("customerId", params.customerId);
  if (params.name?.trim()) q.set("name", params.name.trim());
  if (params.email?.trim()) q.set("email", params.email.trim());
  if (params.lineDescription?.trim()) q.set("line", params.lineDescription.trim());
  if (params.amount != null && params.amount > 0) {
    q.set("amount", String(Math.round(params.amount)));
  }
  if (params.notes?.trim()) q.set("notes", params.notes.trim());
  const s = q.toString();
  return s ? `/invoices/create?${s}` : "/invoices/create";
}
