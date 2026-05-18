import EngagementDetailPanel from "@/components/setup/EngagementDetailPanel";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Engagement detail | Setup",
};

type Props = { params: Promise<{ engagementId: string }> };

export default async function EngagementDetailPage({ params }: Props) {
  const { engagementId } = await params;
  return <EngagementDetailPanel engagementId={engagementId} />;
}
