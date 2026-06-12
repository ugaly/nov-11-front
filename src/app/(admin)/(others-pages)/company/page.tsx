import CompanyManagementPanel from "@/components/company/CompanyManagementPanel";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Company | Management",
  description: "View and manage your company profile and portfolio sections.",
};

export default function CompanyPage() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
      <CompanyManagementPanel />
    </div>
  );
}
