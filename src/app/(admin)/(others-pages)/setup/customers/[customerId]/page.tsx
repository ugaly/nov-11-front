import CustomerDetailPanel from "@/components/setup/CustomerDetailPanel";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Customer detail | Setup",
};

type Props = { params: Promise<{ customerId: string }> };

export default async function CustomerDetailPage({ params }: Props) {
  const { customerId } = await params;
  return <CustomerDetailPanel customerId={customerId} />;
}
