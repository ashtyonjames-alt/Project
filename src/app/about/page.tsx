import type { Metadata } from "next";
import PageHeader from "@/components/shared/PageHeader";
import SectionWrapper from "@/components/shared/SectionWrapper";
import { history, branches, leaders } from "@/data/government";
import Emblem from "@/components/shared/Emblem";

export const metadata: Metadata = { title: "About the Slavakian Union" };

export default function AboutPage() {
  return (
    <>
      <PageHeader
        title="About the Slavakian Union"
        description="History, government structure, and national leadership."
      />
      <SectionWrapper>
        {/* History */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-su-navy mb-6">National History</h2>
          <div className="space-y-6">
            {history.map((h) => (
              <div key={h.period} className="bg-white border border-su-gray-100 rounded-lg p-6 shadow-card">
                <h3 className="font-semibold text-su-blue mb-2">{h.period}</h3>
                <p className="text-su-gray-700 leading-relaxed">{h.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Government structure */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-su-navy mb-6">Government Structure</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {branches.map((b) => (
              <div key={b.name} className="bg-white border border-su-gray-100 rounded-lg p-6 shadow-card text-center">
                <div className="text-4xl mb-3">{b.icon}</div>
                <h3 className="font-bold text-su-navy text-lg mb-2">{b.name}</h3>
                <p className="text-su-gray-700 text-sm leading-relaxed">{b.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Leadership */}
        <section>
          <h2 className="text-2xl font-bold text-su-navy mb-6">National Leadership</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {leaders.map((leader) => (
              <div key={leader.name} className="bg-white border border-su-gray-100 rounded-lg p-6 shadow-card flex gap-4">
                <div className="shrink-0">
                  <Emblem size={48} />
                </div>
                <div>
                  <h3 className="font-bold text-su-navy">{leader.name}</h3>
                  <p className="text-su-blue text-sm font-medium">{leader.title}</p>
                  <p className="text-xs text-su-gray-500 mb-2">{leader.role} · Since {new Date(leader.termStart).getFullYear()}</p>
                  <p className="text-su-gray-700 text-sm leading-relaxed">{leader.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </SectionWrapper>
    </>
  );
}
