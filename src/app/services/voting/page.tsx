import type { Metadata } from "next";
import PageHeader from "@/components/shared/PageHeader";
import SectionWrapper from "@/components/shared/SectionWrapper";
import Badge from "@/components/ui/Badge";
import Alert from "@/components/ui/Alert";

export const metadata: Metadata = { title: "Voting & Elections" };

const upcomingElections = [
  { name: "National Assembly General Election", date: "18 October 2026", type: "National", status: "Scheduled" },
  { name: "Novagrad Central District Council", date: "22 November 2026", type: "Local", status: "Scheduled" },
  { name: "Ostmark District Council By-Election", date: "14 September 2026", type: "Local", status: "Confirmed" },
];

const districts = [
  { name: "Novagrad Central", seats: 12, pollingStations: 48, registeredVoters: "142,300" },
  { name: "Novagrad East", seats: 10, pollingStations: 39, registeredVoters: "118,500" },
  { name: "Novagrad West", seats: 9, pollingStations: 35, registeredVoters: "105,200" },
  { name: "Ostmark", seats: 11, pollingStations: 43, registeredVoters: "131,800" },
  { name: "Velikov", seats: 14, pollingStations: 56, registeredVoters: "172,400" },
  { name: "Kradova", seats: 8, pollingStations: 31, registeredVoters: "92,700" },
  { name: "Zarevka", seats: 7, pollingStations: 28, registeredVoters: "84,100" },
  { name: "Mirova", seats: 9, pollingStations: 36, registeredVoters: "109,000" },
];

export default function VotingPage() {
  return (
    <>
      <PageHeader
        title="Voting & Elections"
        description="Electoral registration, polling station information, and upcoming election schedules."
      />
      <SectionWrapper>
        <Alert type="info" title="Electoral Registration" className="mb-8">
          The voter registration deadline for the 2026 National Assembly election is <strong>18 September 2026</strong>. Ensure your details are up to date in the national citizen database.
        </Alert>

        <h2 className="text-xl font-bold text-su-navy mb-4">Upcoming Elections</h2>
        <div className="bg-white border border-su-gray-100 rounded-lg shadow-card overflow-x-auto mb-10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-su-gray-100 bg-su-gray-50">
                <th className="text-left px-5 py-3 font-semibold text-su-gray-700">Election</th>
                <th className="text-left px-5 py-3 font-semibold text-su-gray-700">Date</th>
                <th className="text-left px-5 py-3 font-semibold text-su-gray-700">Type</th>
                <th className="text-left px-5 py-3 font-semibold text-su-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {upcomingElections.map((e) => (
                <tr key={e.name} className="border-b border-su-gray-50 hover:bg-su-gray-50">
                  <td className="px-5 py-3 font-medium">{e.name}</td>
                  <td className="px-5 py-3 text-su-gray-500">{e.date}</td>
                  <td className="px-5 py-3"><Badge variant="info">{e.type}</Badge></td>
                  <td className="px-5 py-3"><Badge variant="active">{e.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 className="text-xl font-bold text-su-navy mb-4">Electoral Districts</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {districts.map((d) => (
            <div key={d.name} className="bg-white border border-su-gray-100 rounded-lg p-4 shadow-card text-sm">
              <h3 className="font-semibold text-su-navy mb-2">{d.name}</h3>
              <div className="space-y-1 text-su-gray-500">
                <div className="flex justify-between"><span>Assembly Seats</span><span className="font-medium text-su-gray-900">{d.seats}</span></div>
                <div className="flex justify-between"><span>Polling Stations</span><span className="font-medium text-su-gray-900">{d.pollingStations}</span></div>
                <div className="flex justify-between"><span>Registered Voters</span><span className="font-medium text-su-gray-900">{d.registeredVoters}</span></div>
              </div>
            </div>
          ))}
        </div>
      </SectionWrapper>
    </>
  );
}
