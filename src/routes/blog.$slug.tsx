import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useEffect } from "react";
import { fmtDate, useDb } from "@/lib/db";
import { readingMinutes, renderMarkdown } from "@/lib/markdown";

export const Route = createFileRoute("/blog/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug.replace(/-/g, " ")} — Voltarc Energy Blog` },
      { name: "description", content: "An article from the Voltarc Energy journal on lithium batteries and energy storage." },
      { property: "og:title", content: `${params.slug.replace(/-/g, " ")} — Voltarc Energy` },
      { property: "og:description", content: "An article from the Voltarc Energy journal." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Post,
});

function Post() {
  const { slug } = Route.useParams();
  const post = useDb((s) => s.blogPosts.find((p) => p.slug === slug));
  const loaded = useDb((s) => s.loaded);
  const suffix = useDb((s) => s.config.seo.titleSuffix);
  useEffect(() => {
    if (!post) return;
    document.title = `${post.seoTitle || post.title} — ${suffix}`;
    document.querySelector('meta[name="description"]')?.setAttribute("content", post.seoDescription || post.excerpt);
  }, [post, suffix]);

  if (!post) return <div className="mx-auto max-w-3xl px-4 py-24 text-center text-muted-foreground">{loaded ? <>Article not found. <Link to="/blog" className="underline">Back to the blog</Link></> : "Loading…"}</div>;
  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <Link to="/blog" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />All articles</Link>
      <p className="mt-8 font-mono text-xs uppercase tracking-wider text-muted-foreground">{post.tags.join(" · ") || "Article"}</p>
      <h1 className="mt-3 text-4xl font-semibold leading-tight sm:text-5xl">{post.title}</h1>
      <p className="mt-4 text-lg text-muted-foreground">{post.excerpt}</p>
      <p className="mt-6 text-sm text-muted-foreground">{post.author} · {fmtDate(post.publishedAt ?? post.createdAt)} · {readingMinutes(post.content)} min read</p>
      {post.coverUrl && <img src={post.coverUrl} alt="" className="mt-8 aspect-[16/9] w-full rounded-3xl object-cover" />}
      <div className="prose-blog mt-10" dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }} />
    </article>
  );
}
