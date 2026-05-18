import EngagementsPanel from "@/components/setup/EngagementsPanel";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Engagements | Setup",
  description: "Manage customer engagements and projects.",
};

export default function EngagementsPage() {
  return <EngagementsPanel />;
}
