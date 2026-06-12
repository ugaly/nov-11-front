import { listOfficeInvoices } from "@/api/invoice/invoice.api";
import { listOfficePayments } from "@/api/payment/payment.api";
import type { OfficeInvoiceResponse } from "@/api/types/invoice";
import type { OfficePaymentResponse } from "@/api/types/payment";
import type { CustomerEngagementResponse } from "@/api/types/template-config";
import { invoiceBalance } from "@/lib/invoices/invoice-utils";

export type CustomerBillingSummary = {
  invoices: OfficeInvoiceResponse[];
  payments: OfficePaymentResponse[];
  stats: {
    invoiceTotal: number;
    invoicePaid: number;
    invoiceUnpaid: number;
    invoiceDraft: number;
    invoicePaidAmount: number;
    invoiceUnpaidAmount: number;
    paymentsCount: number;
    paymentsPaidCount: number;
    paymentsPaidAmount: number;
  };
};

function engagementIds(engagements: CustomerEngagementResponse[]): Set<string> {
  return new Set(engagements.map((e) => e.id));
}

export function filterPaymentsForCustomer(
  payments: OfficePaymentResponse[],
  customerName: string,
  invoices: OfficeInvoiceResponse[],
  engagements: CustomerEngagementResponse[]
): OfficePaymentResponse[] {
  const name = customerName.trim().toLowerCase();
  const invoiceRefs = new Set(
    invoices.map((i) => i.referenceNumber.toLowerCase())
  );
  const engIds = engagementIds(engagements);

  return payments.filter((p) => {
    if (name && p.payeeName.toLowerCase().includes(name)) return true;
    if (
      p.linkedInvoiceNumber &&
      invoiceRefs.has(p.linkedInvoiceNumber.toLowerCase())
    ) {
      return true;
    }
    for (const ref of p.references ?? []) {
      if (ref.kind === "INVOICE" && invoiceRefs.has(ref.value.toLowerCase())) {
        return true;
      }
      if (ref.kind === "ENGAGEMENT" && engIds.has(ref.value)) return true;
    }
    return false;
  });
}

export async function loadCustomerBillingSummary(
  officeId: string,
  customerId: string,
  customerName: string,
  engagements: CustomerEngagementResponse[] = []
): Promise<CustomerBillingSummary> {
  const [allInvoices, allPayments] = await Promise.all([
    listOfficeInvoices(officeId),
    listOfficePayments(officeId),
  ]);

  const invoices = allInvoices.filter(
    (i) => i.customerId && i.customerId === customerId
  );
  const payments = filterPaymentsForCustomer(
    allPayments,
    customerName,
    invoices,
    engagements
  );

  const invoicePaid = invoices.filter((i) => i.status === "PAID").length;
  const invoiceUnpaid = invoices.filter(
    (i) => i.status === "SENT" || i.status === "PARTIALLY_PAID"
  ).length;
  const invoiceDraft = invoices.filter((i) => i.status === "DRAFT").length;

  const invoicePaidAmount = invoices.reduce(
    (s, i) => s + Number(i.amountPaid ?? 0),
    0
  );
  const invoiceUnpaidAmount = invoices
    .filter((i) => i.status === "SENT" || i.status === "PARTIALLY_PAID")
    .reduce((s, i) => s + invoiceBalance(i), 0);

  const paymentsPaid = payments.filter(
    (p) => p.status === "PAID" || p.status === "PARTIALLY_PAID"
  );
  const paymentsPaidAmount = paymentsPaid.reduce(
    (s, p) => s + Number(p.amountPaid),
    0
  );

  return {
    invoices,
    payments,
    stats: {
      invoiceTotal: invoices.length,
      invoicePaid,
      invoiceUnpaid,
      invoiceDraft,
      invoicePaidAmount,
      invoiceUnpaidAmount,
      paymentsCount: payments.length,
      paymentsPaidCount: paymentsPaid.length,
      paymentsPaidAmount,
    },
  };
}
