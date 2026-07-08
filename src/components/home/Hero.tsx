import Link from "next/link";
import Emblem from "@/components/shared/Emblem";
import { SITE_NAME, SITE_MOTTO, NATIONAL_STATS } from "@/lib/constants";

export default function Hero() {
  return (
    <section className="bg-gradient-to-br from-su-navy via-[#223260] to-[#1a3a6e] text-white py-20 px-4">
      <div className="max-w-7xl mx-auto text-center">
        <div className="flex justify-center mb-6">
          <Emblem size={120} />
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-3">
          Welcome to the {SITE_NAME}
        </h1>
        <p className="text-su-gold italic text-lg mb-4">{SITE_MOTTO}</p>
        <p className="text-blue-200 text-lg max-w-2xl mx-auto mb-8">
          Your official gateway to government services, citizen records, national news, and legislation of the Slavakian Union.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link
            href="/services"
            className="bg-su-gold text-su-navy font-semibold px-6 py-3 rounded hover:bg-su-gold-light transition-colors"
          >
            Access Services
          </Link>
          <Link
            href="/citizen/lookup"
            className="border border-white text-white px-6 py-3 rounded hover:bg-white/10 transition-colors font-medium"
          >
            Citizen Lookup
          </Link>
        </div>

        {/* Stats bar */}
        <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
          {NATIONAL_STATS.map((stat) => (
            <div key={stat.label} className="bg-white/10 rounded-lg p-4">
              <div className="text-2xl font-bold text-su-gold">{stat.value}</div>
              <div className="text-xs text-blue-200 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
