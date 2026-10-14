import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { actions, fmtDate, newId, slugify, useDb } from "@/lib/db";
import type { BlogPost } from "@/lib/types";
import { AdminPage, Btn, Empty, Panel, Pill, TextArea, TextInput, Toggle, safe } from "@/components/admin/kit";
import { renderMarkdown } from "@/lib/markdown";

export const Route = createFileRoute("/admin/blog")({
  head: () => ({ meta: [{ title: "Blog — Voltarc Admin" }, { name: "robots", content: "noindex" }] }),
  component: Blog,
});

function Blog() {
  const posts = useDb((s) => s.blogPosts);
  const me = useDb((s) => s.me);
  const [edit, setEdit] = useState<BlogPost | null>(null);
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false);

  const blank = (): BlogPost => ({ id: newId(), slug: "", title: "", excerpt: "", content: "", coverUrl: "", tags: [], author: me?.name ?? "", seoTitle: "", seoDescription: "", published: false, createdAt: new Date().toISOString() });
  const save = async () => {
    if (!edit?.title.trim()) return void safe(Promise.reject(new Error("Add a title")));
    setBusy(true);
    const ok = await safe(actions.savePost({ ...edit, slug: edit.slug || slugify(edit.title) }).then(() => true), "Post saved");
    setBusy(false);
    if (ok) setEdit(null);
  };
  const upload = async (f?: File) => {
    if (!f || !edit) return;
    const url = await safe(actions.uploadImage(f, f.name));
    if (url) setEdit({ ...edit, coverUrl: url });
  };

  if (edit)
    return (
      <AdminPage title={edit.title || "New post"} description="Write in Markdown: # headings, **bold**, - lists, [links](https://…)."
        actions={<><Btn variant="ghost" onClick={() => setEdit(null)}>Cancel</Btn><Btn disabled={busy} onClick={save}>{busy ? "Saving…" : "Save post"}</Btn></>}>
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            <TextInput label="Title" value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} className="text-lg font-medium" />
            <TextArea label="Excerpt" rows={2} value={edit.excerpt} onChange={(e) => setEdit({ ...edit, excerpt: e.target.value })} hint="Shown on the blog list and in search results." />
            <div className="flex gap-2"><Btn variant={!preview ? "primary" : "outline"} onClick={() => setPreview(false)}>Write</Btn><Btn variant={preview ? "primary" : "outline"} onClick={() => setPreview(true)}>Preview</Btn></div>
            {preview
              ? <article className="prose-blog min-h-96 rounded-2xl border bg-card p-6" dangerouslySetInnerHTML={{ __html: renderMarkdown(edit.content) }} />
              : <TextArea rows={22} value={edit.content} onChange={(e) => setEdit({ ...edit, content: e.target.value })} className="font-mono text-sm" placeholder="## Why LiFePO4 lasts longer…" />}
          </div>
          <div className="space-y-4">
            <Panel title="Publishing">
              <div className="space-y-3">
                <Toggle label="Published" description="Visible on the public blog" checked={edit.published} onChange={(v) => setEdit({ ...edit, published: v })} />
                <TextInput label="URL slug" value={edit.slug} placeholder={slugify(edit.title)} onChange={(e) => setEdit({ ...edit, slug: slugify(e.target.value) })} />
                <TextInput label="Author" value={edit.author} onChange={(e) => setEdit({ ...edit, author: e.target.value })} />
                <TextInput label="Tags" value={edit.tags.join(", ")} placeholder="Solar, Guides" onChange={(e) => setEdit({ ...edit, tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) })} />
              </div>
            </Panel>
            <Panel title="Cover image">
              {edit.coverUrl && <img src={edit.coverUrl} alt="" className="mb-3 aspect-video w-full rounded-xl object-cover" />}
              <input type="file" accept="image/*" onChange={(e) => upload(e.target.files?.[0])} className="text-xs" />
            </Panel>
            <Panel title="Search appearance">
              <div className="space-y-3">
                <TextInput label="SEO title" value={edit.seoTitle} placeholder={edit.title} onChange={(e) => setEdit({ ...edit, seoTitle: e.target.value })} hint={`${(edit.seoTitle || edit.title).length}/60`} />
                <TextArea label="Meta description" rows={3} value={edit.seoDescription} placeholder={edit.excerpt} onChange={(e) => setEdit({ ...edit, seoDescription: e.target.value })} hint={`${(edit.seoDescription || edit.excerpt).length}/160`} />
              </div>
            </Panel>
          </div>
        </div>
      </AdminPage>
    );

  return (
    <AdminPage title="Blog" description="Guides and news that build trust and bring in search traffic." actions={<><Link to="/blog" className="rounded-full border bg-card px-4 py-2 text-sm">View blog</Link><Btn onClick={() => setEdit(blank())}>New post</Btn></>}>
      {posts.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => (
            <div key={p.id} className="flex flex-col overflow-hidden rounded-2xl border bg-card">
              {p.coverUrl ? <img src={p.coverUrl} alt="" className="aspect-video object-cover" /> : <div className="aspect-video bg-muted" />}
              <div className="flex flex-1 flex-col p-4">
                <div className="flex items-center gap-2">{p.published ? <Pill tone="good">Published</Pill> : <Pill>Draft</Pill>}<span className="text-xs text-muted-foreground">{fmtDate(p.publishedAt ?? p.createdAt)}</span></div>
                <p className="mt-2 font-medium">{p.title}</p>
                <p className="mt-1 line-clamp-2 flex-1 text-sm text-muted-foreground">{p.excerpt}</p>
                <div className="mt-3 flex gap-3 text-sm"><button className="underline" onClick={() => setEdit(p)}>Edit</button><button className="text-destructive" onClick={() => confirm(`Delete "${p.title}"?`) && safe(actions.deletePost(p.id), "Deleted")}>Delete</button></div>
              </div>
            </div>
          ))}
        </div>
      ) : <Empty>No posts yet. If creating one fails, run supabase/admin-upgrade.sql in your Supabase SQL editor first.</Empty>}
    </AdminPage>
  );
}
