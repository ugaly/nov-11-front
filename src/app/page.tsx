import LogisticsLoginPage from "@/components/auth/LogisticsLoginPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Staff sign in",
  description: "Staff workspace for administrators.",
};

export default function LoginHomePage() {
  return <LogisticsLoginPage />;
}
