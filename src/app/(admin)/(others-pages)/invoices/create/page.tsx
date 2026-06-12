import InvoiceCreatePanel from "@/components/invoices/InvoiceCreatePanel";
import { Metadata } from "next";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Create invoice",
};

function CreateFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Loader2 className="size-8 animate-spin text-gray-400" aria-hidden />
    </div>
  );
}

export default function InvoiceCreatePage() {
  return (
    <Suspense fallback={<CreateFallback />}>
      <InvoiceCreatePanel />
    </Suspense>
  );
}
