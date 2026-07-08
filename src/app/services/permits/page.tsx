import type { Metadata } from "next";
import PageHeader from "@/components/shared/PageHeader";
import SectionWrapper from "@/components/shared/SectionWrapper";
import PermitForm from "@/components/services/PermitForm";

export const metadata: Metadata = { title: "Permit Applications" };

export default function PermitsPage() {
  return (
    <>
      <PageHeader
        title="Permit Applications"
        description="Apply for building permits, business licences, event authorisations, and other official permits."
      />
      <SectionWrapper narrow>
        <PermitForm />
      </SectionWrapper>
    </>
  );
}
