import ServiceCatalogsPanel from "@/components/setup/ServiceCatalogsPanel";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Service catalogs | Setup",
  description: "Configure service template catalogs.",
};

export default function ServiceCatalogsPage() {
  return <ServiceCatalogsPanel />;
}
