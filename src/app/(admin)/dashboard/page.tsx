import type { Metadata } from "next";
import TodayDashboard from "@/components/today/TodayDashboard";

export const metadata: Metadata = {
  title: "Today | Branch operations",
  description:
    "Real-time logistics snapshot for your branch: receipts, shipments, and SLA.",
};

export default function TodayPage() {
  return <TodayDashboard />;
}
