import PaymentDetailPanel from "@/components/payments/PaymentDetailPanel";

export default async function PaymentDetailPage({
  params,
}: {
  params: Promise<{ paymentId: string }>;
}) {
  const { paymentId } = await params;
  return <PaymentDetailPanel paymentId={paymentId} />;
}
