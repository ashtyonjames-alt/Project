import type { Metadata } from "next";
import PageHeader from "@/components/shared/PageHeader";
import SectionWrapper from "@/components/shared/SectionWrapper";
import Card from "@/components/ui/Card";

export const metadata: Metadata = { title: "Citizen Portal" };

export default function CitizenPage() {
  return (
    <>
      <PageHeader
        title="Citizen Portal"
        description="Access citizen services, look up records, and manage your official documents."
      />
      <SectionWrapper>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card
            icon="🔍"
            title="Citizen ID Lookup"
            description="Search for any citizen record by their unique Slavakian Union ID number."
            href="/citizen/lookup"
          />
          <Card
            icon="✍️"
            title="Register as a Citizen"
            description="Complete the online registration form to be entered into the national citizen database."
            href="/citizen/register"
          />
          <Card
            icon="📄"
            title="My Documents"
            description="View and manage your official government-issued documents, including passport and ID card."
            href="/citizen/documents"
          />
        </div>
      </SectionWrapper>
    </>
  );
}
