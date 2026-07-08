import type { Metadata } from "next";
import PageHeader from "@/components/shared/PageHeader";
import SectionWrapper from "@/components/shared/SectionWrapper";
import Badge from "@/components/ui/Badge";
import type { Document } from "@/types";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "My Documents" };

const mockDocuments: Document[] = [
  { id: "DOC-001", type: "passport", title: "Slavakian Union Passport", issuedDate: "2020-03-15", expiryDate: "2030-03-14", status: "valid" },
  { id: "DOC-002", type: "id-card", title: "National Identity Card", issuedDate: "2022-07-01", expiryDate: "2032-06-30", status: "valid" },
  { id: "DOC-003", type: "birth-certificate", title: "Birth Certificate", issuedDate: "1985-03-20", status: "valid" },
  { id: "DOC-004", type: "tax-record", title: "Tax Filing Record 2025", issuedDate: "2026-04-10", status: "valid" },
  { id: "DOC-005", type: "tax-record", title: "Tax Filing Record 2024", issuedDate: "2025-04-08", status: "valid" },
  { id: "DOC-006", type: "permit", title: "Building Permit — 12 Krevna St", issuedDate: "2019-06-01", expiryDate: "2024-05-31", status: "expired" },
];

const typeIcons: Record<string, string> = {
  passport: "🛂",
  "id-card": "🪪",
  "birth-certificate": "📋",
  "tax-record": "💰",
  permit: "🏗️",
};

export default function DocumentsPage() {
  return (
    <>
      <PageHeader
        title="My Documents"
        description="Your official government-issued documents and records."
      />
      <SectionWrapper>
        <div className="bg-white border border-su-gray-100 rounded-lg shadow-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-su-gray-100 bg-su-gray-50">
                <th className="text-left px-5 py-3 font-semibold text-su-gray-700">Document</th>
                <th className="text-left px-5 py-3 font-semibold text-su-gray-700">Issued</th>
                <th className="text-left px-5 py-3 font-semibold text-su-gray-700">Expires</th>
                <th className="text-left px-5 py-3 font-semibold text-su-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {mockDocuments.map((doc) => (
                <tr key={doc.id} className="border-b border-su-gray-50 hover:bg-su-gray-50">
                  <td className="px-5 py-3">
                    <span className="mr-2">{typeIcons[doc.type]}</span>
                    {doc.title}
                  </td>
                  <td className="px-5 py-3 text-su-gray-500">{formatDate(doc.issuedDate)}</td>
                  <td className="px-5 py-3 text-su-gray-500">{doc.expiryDate ? formatDate(doc.expiryDate) : "—"}</td>
                  <td className="px-5 py-3">
                    <Badge variant={doc.status} className="capitalize">{doc.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionWrapper>
    </>
  );
}
