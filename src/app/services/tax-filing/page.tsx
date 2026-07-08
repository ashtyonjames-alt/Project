import type { Metadata } from "next";
import PageHeader from "@/components/shared/PageHeader";
import SectionWrapper from "@/components/shared/SectionWrapper";
import TaxFilingForm from "@/components/services/TaxFilingForm";

export const metadata: Metadata = { title: "Tax Filing" };

export default function TaxFilingPage() {
  return (
    <>
      <PageHeader
        title="Personal Income Tax Filing"
        description="File your annual personal income tax return for tax year 2025."
      />
      <SectionWrapper narrow>
        <TaxFilingForm />
      </SectionWrapper>
    </>
  );
}
