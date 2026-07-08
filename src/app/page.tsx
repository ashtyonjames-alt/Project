import Hero from "@/components/home/Hero";
import QuickLinks from "@/components/home/QuickLinks";
import NewsTicker from "@/components/home/NewsTicker";
import { articles } from "@/data/news";
import { formatShortDate } from "@/lib/utils";
import Link from "next/link";
import Badge from "@/components/ui/Badge";

export default function HomePage() {
  const latestNews = articles.slice(0, 3);

  return (
    <>
      <NewsTicker />
      <Hero />
      <QuickLinks />

      {/* Latest news section */}
      <section className="py-12 px-4 bg-su-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-su-navy">Latest News</h2>
              <p className="text-su-gray-500 text-sm mt-1">Official government announcements and national news</p>
            </div>
            <Link href="/news" className="text-su-blue text-sm font-medium hover:underline">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {latestNews.map((article) => (
              <Link
                key={article.slug}
                href={`/news/${article.slug}`}
                className="bg-white border border-su-gray-100 rounded-lg p-5 shadow-card hover:shadow-card-hover transition-shadow block"
              >
                <Badge variant="info" className="mb-3 capitalize">{article.category}</Badge>
                <h3 className="font-semibold text-su-gray-900 leading-snug mb-2">{article.title}</h3>
                <p className="text-su-gray-500 text-sm line-clamp-2 mb-3">{article.summary}</p>
                <p className="text-xs text-su-gray-500">{formatShortDate(article.publishedAt)}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Emergency notice */}
      <section className="bg-su-blue-pale border-t border-su-blue/20 py-6 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <span className="text-2xl">🔔</span>
          <div>
            <p className="font-semibold text-su-navy text-sm">Public Notice</p>
            <p className="text-su-gray-700 text-sm">
              The new tax reform package for 2027 is open for public consultation from 1 July 2026.{" "}
              <Link href="/news/tax-reform-2027" className="text-su-blue hover:underline font-medium">
                Read more
              </Link>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
