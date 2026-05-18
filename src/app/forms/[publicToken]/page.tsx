import PublicWorkItemFormPage from "@/components/forms/PublicWorkItemFormPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Customer form",
  description: "Submit information for your engagement",
};

type Props = { params: Promise<{ publicToken: string }> };

export default async function PublicFormPage({ params }: Props) {
  const { publicToken } = await params;
  return <PublicWorkItemFormPage publicToken={publicToken} />;
}
