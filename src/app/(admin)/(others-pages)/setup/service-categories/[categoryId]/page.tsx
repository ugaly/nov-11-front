import CategoryDetailPanel from "@/components/setup/CategoryDetailPanel";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Category detail | Setup",
};

type Props = { params: Promise<{ categoryId: string }> };

export default async function CategoryDetailPage({ params }: Props) {
  const { categoryId } = await params;
  return <CategoryDetailPanel categoryId={categoryId} />;
}
