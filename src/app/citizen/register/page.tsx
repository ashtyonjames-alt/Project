import type { Metadata } from "next";
import PageHeader from "@/components/shared/PageHeader";
import SectionWrapper from "@/components/shared/SectionWrapper";
import RegistrationForm from "@/components/citizen/RegistrationForm";

export const metadata: Metadata = { title: "Citizen Registration" };

export default function RegisterPage() {
  return (
    <>
      <PageHeader
        title="Citizen Registration"
        description="Complete this form to register in the Slavakian Union National Citizen Database."
      />
      <SectionWrapper narrow>
        <RegistrationForm />
      </SectionWrapper>
    </>
  );
}
