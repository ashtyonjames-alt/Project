import Link from "next/link";
import Badge from "@/components/ui/Badge";
import type { Law } from "@/types";

export default function LawCard({ law }: { law: Law }) {
  return (
    <Link
      href={`/news/laws/${law.id}`}
      className="bg-white border border-su-gray-100 rounded-lg p-5 shadow-card hover:shadow-card-hover transition-shadow block"
    >
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span className="text-xs font-mono text-su-gray-500">{law.id}</span>
        <Badge variant={law.status as "active" | "repealed" | "amended" | "proposed"} className="capitalize">
          {law.status}
        </Badge>
        <Badge variant="info" className="capitalize">{law.category}</Badge>
      </div>
      <h3 className="font-semibold text-su-gray-900 leading-snug mb-2">{law.shortTitle}</h3>
      <p className="text-su-gray-500 text-sm line-clamp-2">{law.summary}</p>
    </Link>
  );
}
