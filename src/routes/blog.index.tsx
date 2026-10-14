import { createFileRoute, Link } from "@tanstack/react-router";
import { fmtDate, useDb } from "@/lib/db";
import { readingMinutes } from "@/lib/markdown";
import { PageTitle } from "@/components/site/Field";

export const Route = createFileRoute("/blog/")({
  head: () => ({
    meta: [
      { title: "Blog — Voltarc Energy" },
      { name: "description", content: "Guides on LiFePO4 batteries, solar storage, BMS and safe lithium installs from the Voltarc engineering team." },
      { property: "og:title", content: "Voltarc Energy Blog" },
      { property: "og:description", content: "Guides on LiFePO4 batteries, solar storage, BMS and safe lithium installs." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BlogIndex,
});

function BlogIndex() {
  const posts = useDb((s) => s.blogPosts.filter((p) => p.published));
  const loaded = useDb((s) => s.loaded);
  const [lead, ...rest] = posts;
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
      <PageTitle eyebrow="Journal" title="Energy, explained.">Practical guides on lithium batteries, solar storage and system design.</PageTitle>
      {!loaded ? <p className="py-16 text-muted-foreground">Loading…</p> : !lead ? <p className="py-16 text-muted-foreground">New articles are on the way.</p> : (
        <>
          <Link to="/blog/$slug" params={{ slug: lead.slug }} className="group mt-10 grid gap-8 overflow-hidden rounded-3xl border bg-card lg:grid-cols-2">
            {lead.coverUrl ? <img src={lead.coverUrl} alt="" className="aspect-[16/10] h-full w-full object-cover transition group-hover:scale-[1.02]" /> : <div className="aspect-[16/10] bg-muted" />}
            <div className="flex flex-col justify-center p-8">
              <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">{lead.tags[0] ?? "Featured"} · {readingMinutes(lead.content)} min read</p>
              <h2 className="mt-3 text-3xl font-semibold group-hover:underline">{lead.title}</h2>
              <p className="mt-3 text-muted-foreground">{lead.excerpt}</p>
              <p className="mt-6 text-sm text-muted-foreground">{lead.author} · {fmtDate(lead.publishedAt ?? lead.createdAt)}</p>
            </div>
          </Link>
          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((p) => (
              <Link key={p.id} to="/blog/$slug" params={{ slug: p.slug }} className="group">
                {p.coverUrl ? <img src={p.coverUrl} alt="" className="aspect-[16/10] w-full rounded-2xl object-cover" /> : <div className="aspect-[16/10] rounded-2xl bg-muted" />}
                <p className="mt-4 font-mono text-xs uppercase tracking-wider text-muted-foreground">{p.tags[0] ?? "Article"} · {readingMinutes(p.content)} min</p>
                <h3 className="mt-2 text-lg font-semibold group-hover:underline">{p.title}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.excerpt}</p>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
