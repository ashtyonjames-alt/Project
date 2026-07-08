import type { Metadata } from "next";
import PageHeader from "@/components/shared/PageHeader";
import SectionWrapper from "@/components/shared/SectionWrapper";
import ArticleCard from "@/components/news/ArticleCard";
import { articles } from "@/data/news";

export const metadata: Metadata = { title: "News & Announcements" };

export default function NewsPage() {
  return (
    <>
      <PageHeader
        title="News & Announcements"
        description="Official government communications, policy updates, and national news from the Slavakian Union."
      />
      <SectionWrapper>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {articles.map((article) => (
            <ArticleCard key={article.slug} article={article} />
          ))}
        </div>
      </SectionWrapper>
    </>
  );
}
