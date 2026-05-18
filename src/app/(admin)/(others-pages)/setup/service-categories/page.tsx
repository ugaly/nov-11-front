import ServiceCategoriesPanel from "@/components/setup/ServiceCategoriesPanel";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Service categories | Setup",
  description: "Configure service category groupings.",
};

export default function ServiceCategoriesPage() {
  return <ServiceCategoriesPanel />;
}
