import Link from "next/link";
import Badge from "@/components/ui/Badge";
import { formatShortDate } from "@/lib/utils";
import type { NewsArticle } from "@/types";

export default function ArticleCard({ article }: { article: NewsArticle }) {
  return (
    <Link
      href={`/news/${article.slug}`}
      className="bg-white border border-su-gray-100 rounded-lg p-5 shadow-card hover:shadow-card-hover transition-shadow block"
    >
      <div className="flex items-center justify-between mb-3">
        <Badge variant="info" className="capitalize">{article.category}</Badge>
        <span className="text-xs text-su-gray-500">{formatShortDate(article.publishedAt)}</span>
      </div>
      <h3 className="font-semibold text-su-gray-900 leading-snug mb-2">{article.title}</h3>
      <p className="text-su-gray-500 text-sm line-clamp-3 mb-3">{article.summary}</p>
      <p className="text-xs text-su-gray-500">By {article.author}</p>
    </Link>
  );
}
