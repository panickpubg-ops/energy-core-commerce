import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { actions, newId, slugify, useDb } from "@/lib/db";
import type { Category } from "@/lib/types";
import { AdminPage, Btn, Panel, TextArea, TextInput, safe } from "@/components/admin/kit";

export const Route = createFileRoute("/admin/categories")({
  head: () => ({ meta: [{ title: "Categories — Voltarc Admin" }, { name: "robots", content: "noindex" }] }),
  component: Categories,
});

const blank = (sort: number): Category => ({ id: newId(), slug: "", name: "", description: "", image: "", sort });

function Categories() {
  const categories = useDb((s) => s.categories);
  const products = useDb((s) => s.products);
  const [edit, setEdit] = useState<Category | null>(null);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!edit?.name.trim()) return;
    setBusy(true);
    await safe(actions.saveCategory({ ...edit, slug: edit.slug || slugify(edit.name) }), "Category saved");
    setBusy(false);
    setEdit(null);
  };
  const upload = async (f?: File) => {
    if (!f || !edit) return;
    const url = await safe(actions.uploadImage(f, f.name));
    if (url) setEdit({ ...edit, image: url });
  };

  return (
    <AdminPage title="Categories" description="Organise how products appear in the shop and navigation." actions={<Btn onClick={() => setEdit(blank(categories.length + 1))}>New category</Btn>}>
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="grid gap-3 sm:grid-cols-2">
          {categories.map((c) => (
            <button key={c.id} onClick={() => setEdit(c)} className={`flex gap-4 rounded-2xl border bg-card p-4 text-left transition hover:border-foreground/30 ${edit?.id === c.id ? "ring-2 ring-primary" : ""}`}>
              {c.image ? <img src={c.image} alt="" className="h-16 w-16 rounded-xl object-cover" /> : <span className="h-16 w-16 rounded-xl bg-muted" />}
              <span className="min-w-0 flex-1"><span className="block font-medium">{c.name}</span><span className="block font-mono text-xs text-muted-foreground">/{c.slug} · #{c.sort}</span><span className="mt-1 block text-xs text-muted-foreground">{products.filter((p) => p.categoryId === c.id).length} products</span></span>
            </button>
          ))}
        </div>
        {edit ? (
          <Panel title={categories.some((c) => c.id === edit.id) ? "Edit category" : "New category"} className="h-fit lg:sticky lg:top-6">
            <div className="space-y-3">
              <TextInput label="Name" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
              <TextInput label="URL slug" value={edit.slug} placeholder={slugify(edit.name)} onChange={(e) => setEdit({ ...edit, slug: slugify(e.target.value) })} />
              <TextArea label="Description" rows={3} value={edit.description} onChange={(e) => setEdit({ ...edit, description: e.target.value })} />
              <TextInput label="Sort order" type="number" value={edit.sort} onChange={(e) => setEdit({ ...edit, sort: +e.target.value })} />
              <div>
                <span className="mb-1 block text-xs font-medium text-muted-foreground">Cover image</span>
                {edit.image && <img src={edit.image} alt="" className="mb-2 h-28 w-full rounded-xl object-cover" />}
                <input type="file" accept="image/*" onChange={(e) => upload(e.target.files?.[0])} className="text-xs" />
              </div>
              <div className="flex gap-2 pt-2">
                <Btn disabled={busy} onClick={save}>{busy ? "Saving…" : "Save"}</Btn>
                <Btn variant="ghost" onClick={() => setEdit(null)}>Cancel</Btn>
                {categories.some((c) => c.id === edit.id) && <Btn variant="danger" className="ml-auto" onClick={() => confirm(`Delete ${edit.name}? Products keep existing but lose this category.`) && safe(actions.deleteCategory(edit.id), "Deleted").then(() => setEdit(null))}>Delete</Btn>}
              </div>
            </div>
          </Panel>
        ) : <p className="text-sm text-muted-foreground">Select a category to edit it.</p>}
      </div>
    </AdminPage>
  );
}
