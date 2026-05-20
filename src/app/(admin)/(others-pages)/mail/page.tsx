import MailPanel from "@/components/mail/MailPanel";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mail",
};

export default function MailPage() {
  return <MailPanel />;
}
