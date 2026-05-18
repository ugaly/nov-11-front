import CatalogDetailPanel from "@/components/setup/CatalogDetailPanel";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Catalog detail | Setup",
};

type Props = { params: Promise<{ catalogId: string }> };

export default async function CatalogDetailPage({ params }: Props) {
  const { catalogId } = await params;
  return <CatalogDetailPanel catalogId={catalogId} />;
}
