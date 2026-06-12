import CompanyFilesPanel from "@/components/company/CompanyFilesPanel";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Company Files",
  description: "Store, organize, and share company documents.",
};

export default function CompanyFilesPage() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
      <CompanyFilesPanel />
    </div>
  );
}
