import type { Metadata } from "next";
import PageHeader from "@/components/shared/PageHeader";
import SectionWrapper from "@/components/shared/SectionWrapper";
import LawCard from "@/components/news/LawCard";
import { laws } from "@/data/laws";

export const metadata: Metadata = { title: "Legislation" };

export default function LawsPage() {
  return (
    <>
      <PageHeader
        title="Legislation"
        description="Browse the Acts, statutes, and regulations of the Slavakian Union National Assembly."
      />
      <SectionWrapper>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {laws.map((law) => (
            <LawCard key={law.id} law={law} />
          ))}
        </div>
      </SectionWrapper>
    </>
  );
}
