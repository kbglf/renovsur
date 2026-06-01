import Link from "next/link";
import { BLOG_POSTS } from "@/data/blog-posts";
import { formatDate } from "@/lib/utils";

export const metadata = {
  title: "Guides travaux — Blog RénovSûr",
  description: "Conseils pour éviter les arnaques et vérifier vos devis travaux.",
};

export default function BlogPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="text-3xl font-bold text-slate-900">Guides travaux</h1>
      <p className="mt-3 text-slate-600">
        Conseils pratiques pour protéger votre budget rénovation
      </p>
      <div className="mt-10 space-y-6">
        {BLOG_POSTS.map((post) => (
          <article
            key={post.slug}
            className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition hover:shadow-md"
          >
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-emerald-50 px-3 py-0.5 text-xs font-medium text-emerald-700"
                >
                  {tag}
                </span>
              ))}
            </div>
            <h2 className="mt-3 text-xl font-bold text-slate-900">
              <Link href={`/blog/${post.slug}`} className="hover:text-emerald-700">
                {post.title}
              </Link>
            </h2>
            <p className="mt-2 text-slate-600">{post.excerpt}</p>
            <p className="mt-4 text-xs text-slate-500">
              {formatDate(post.date)} · {post.readTime}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
