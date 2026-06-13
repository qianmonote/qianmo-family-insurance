import LinkSummaryDetail from "@/components/link-summary-detail";

export default async function SummaryRecordDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <LinkSummaryDetail id={id} />;
}
