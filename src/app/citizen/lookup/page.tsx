import type { Metadata } from "next";
import PageHeader from "@/components/shared/PageHeader";
import SectionWrapper from "@/components/shared/SectionWrapper";
import CitizenLookupForm from "@/components/citizen/CitizenLookupForm";

export const metadata: Metadata = { title: "Citizen ID Lookup" };

export default function LookupPage() {
  return (
    <>
      <PageHeader
        title="Citizen ID Lookup"
        description="Search the national citizen database by entering a Slavakian Union citizen ID."
      />
      <SectionWrapper narrow>
        <CitizenLookupForm />
      </SectionWrapper>
    </>
  );
}
