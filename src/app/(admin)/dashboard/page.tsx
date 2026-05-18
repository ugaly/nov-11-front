import type { Metadata } from "next";
import OperationsDashboard from "@/components/dashboard/OperationsDashboard";

export const metadata: Metadata = {
  title: "Dashboard",
  description:
    "Company overview: customers, engagements, and service category performance.",
};

export default function DashboardPage() {
  return <OperationsDashboard />;
}
