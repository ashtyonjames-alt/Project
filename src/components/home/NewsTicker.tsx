"use client";

import Link from "next/link";
import { articles } from "@/data/news";

export default function NewsTicker() {
  const headlines = articles.slice(0, 5);

  return (
    <div className="bg-su-navy text-white py-2 px-4 overflow-hidden">
      <div className="max-w-7xl mx-auto flex items-center gap-4">
        <span className="shrink-0 bg-su-gold text-su-navy text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wide">
          Latest
        </span>
        <div className="overflow-hidden flex-1">
          <div className="flex gap-12 animate-[ticker_40s_linear_infinite] whitespace-nowrap">
            {[...headlines, ...headlines].map((a, i) => (
              <Link
                key={`${a.slug}-${i}`}
                href={`/news/${a.slug}`}
                className="text-sm text-blue-200 hover:text-white transition-colors shrink-0"
              >
                {a.title}
              </Link>
            ))}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes ticker {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
