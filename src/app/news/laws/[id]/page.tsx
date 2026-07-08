import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PageHeader from "@/components/shared/PageHeader";
import SectionWrapper from "@/components/shared/SectionWrapper";
import Badge from "@/components/ui/Badge";
import { laws, getLawById } from "@/data/laws";
import { formatDate } from "@/lib/utils";

interface Props { params: Promise<{ id: string }> }

export async function generateStaticParams() {
  return laws.map((l) => ({ id: l.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const law = getLawById(id);
  return { title: law?.shortTitle ?? "Legislation" };
}

export default async function LawPage({ params }: Props) {
  const { id } = await params;
  const law = getLawById(id);
  if (!law) notFound();

  return (
    <>
      <PageHeader title={law.title}>
        <div className="flex flex-wrap items-center gap-3 mt-3">
          <Badge variant={law.status as "active" | "repealed" | "amended" | "proposed"} className="capitalize">
            {law.status}
          </Badge>
          <Badge variant="info" className="capitalize">{law.category}</Badge>
          <span className="text-blue-200 text-sm">Enacted: {formatDate(law.enactedDate)}</span>
          {law.lastAmended && (
            <span className="text-blue-200 text-sm">Last amended: {formatDate(law.lastAmended)}</span>
          )}
        </div>
      </PageHeader>
      <SectionWrapper narrow>
        <div className="bg-white border border-su-gray-100 rounded-lg p-8 shadow-card mb-6">
          <h2 className="font-semibold text-su-navy mb-2">Summary</h2>
          <p className="text-su-gray-700 leading-relaxed border-l-4 border-su-gold pl-4">{law.summary}</p>
        </div>
        <div className="bg-white border border-su-gray-100 rounded-lg p-8 shadow-card">
          <h2 className="font-semibold text-su-navy mb-4">Full Text</h2>
          <div className="font-mono text-sm text-su-gray-700 leading-relaxed whitespace-pre-wrap bg-su-gray-50 rounded p-4 border border-su-gray-100">
            {law.fullText}
          </div>
        </div>
      </SectionWrapper>
    </>
  );
}
