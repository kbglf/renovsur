import Link from "next/link";
import { notFound } from "next/navigation";
import { getPost } from "@/data/blog-posts";
import { formatDate } from "@/lib/utils";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const { BLOG_POSTS } = await import("@/data/blog-posts");
  return BLOG_POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  return { title: post.title, description: post.excerpt };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const paragraphs = post.content.split("\n\n");

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <Link href="/blog" className="text-sm font-medium text-emerald-600 hover:underline">
        ← Retour aux guides
      </Link>
      <h1 className="mt-6 text-3xl font-bold text-slate-900 sm:text-4xl">{post.title}</h1>
      <p className="mt-4 text-sm text-slate-500">
        {formatDate(post.date)} · {post.readTime}
      </p>
      <div className="prose prose-slate mt-10 max-w-none">
        {paragraphs.map((para, i) => {
          if (para.startsWith("**") && para.includes("**")) {
            const title = para.replace(/\*\*/g, "");
            return (
              <h2 key={i} className="mt-8 text-xl font-bold text-slate-900">
                {title}
              </h2>
            );
          }
          if (para.startsWith("|")) {
            return (
              <pre key={i} className="mt-4 overflow-x-auto rounded-xl bg-slate-50 p-4 text-sm">
                {para}
              </pre>
            );
          }
          return (
            <p key={i} className="mt-4 leading-relaxed text-slate-700">
              {para.replace(/\*\*(.*?)\*\*/g, "$1")}
            </p>
          );
        })}
      </div>
      <div className="mt-12 rounded-2xl bg-emerald-600 p-8 text-center text-white">
        <p className="font-semibold">Analysez votre devis maintenant</p>
        <Link
          href="/analyser"
          className="mt-4 inline-block rounded-full bg-white px-6 py-3 text-sm font-semibold text-emerald-700"
        >
          Analyse gratuite →
        </Link>
      </div>
    </article>
  );
}
