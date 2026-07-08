import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PageHeader from "@/components/shared/PageHeader";
import SectionWrapper from "@/components/shared/SectionWrapper";
import Badge from "@/components/ui/Badge";
import { articles, getArticleBySlug } from "@/data/news";
import { formatDate } from "@/lib/utils";

interface Props { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  return { title: article?.title ?? "Article" };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) notFound();

  return (
    <>
      <PageHeader title={article.title}>
        <div className="flex flex-wrap items-center gap-3 mt-3">
          <Badge variant="info" className="capitalize">{article.category}</Badge>
          <span className="text-blue-200 text-sm">{formatDate(article.publishedAt)}</span>
          <span className="text-blue-200 text-sm">By {article.author}</span>
        </div>
      </PageHeader>
      <SectionWrapper narrow>
        <div className="bg-white border border-su-gray-100 rounded-lg p-8 shadow-card">
          <p className="text-lg text-su-gray-700 font-medium leading-relaxed mb-6 border-l-4 border-su-gold pl-4">
            {article.summary}
          </p>
          {article.content.split("\n\n").map((para, i) => (
            <p key={i} className="text-su-gray-700 leading-relaxed mb-4">{para}</p>
          ))}
        </div>
      </SectionWrapper>
    </>
  );
}
