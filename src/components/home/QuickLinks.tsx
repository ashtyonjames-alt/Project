import Card from "@/components/ui/Card";

const links = [
  { icon: "🪪", title: "Citizen Portal", description: "Look up citizen records, register, or access your documents.", href: "/citizen" },
  { icon: "📰", title: "Latest News", description: "Government announcements, policy updates, and national news.", href: "/news" },
  { icon: "📜", title: "Legislation", description: "Browse the laws and statutes of the Slavakian Union.", href: "/news/laws" },
  { icon: "💰", title: "Tax Filing", description: "File your personal income tax return online.", href: "/services/tax-filing" },
  { icon: "🗳️", title: "Voting & Elections", description: "Check registration, find your polling station, view upcoming elections.", href: "/services/voting" },
  { icon: "📋", title: "Permits", description: "Apply for building permits, business licences, and other authorisations.", href: "/services/permits" },
];

export default function QuickLinks() {
  return (
    <section className="py-12 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold text-su-navy mb-2">Government Services</h2>
        <p className="text-su-gray-500 mb-8">Quick access to the most used citizen services.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {links.map((link) => (
            <Card key={link.href} {...link} />
          ))}
        </div>
      </div>
    </section>
  );
}
