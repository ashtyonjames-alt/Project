import type { Metadata } from "next";
import PageHeader from "@/components/shared/PageHeader";
import SectionWrapper from "@/components/shared/SectionWrapper";
import Card from "@/components/ui/Card";
import { services } from "@/data/services";

export const metadata: Metadata = { title: "Government Services" };

export default function ServicesPage() {
  return (
    <>
      <PageHeader
        title="Government Services"
        description="Access all digital services provided by the federal government of the Slavakian Union."
      />
      <SectionWrapper>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {services.map((service) => (
            <Card
              key={service.id}
              icon={service.icon}
              title={service.name}
              description={service.description}
              href={service.href}
            />
          ))}
        </div>
      </SectionWrapper>
    </>
  );
}
