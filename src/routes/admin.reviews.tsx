import { createFileRoute } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { useState } from "react";
import { actions, fmtDate, useDb } from "@/lib/db";
import { AdminPage, Btn, Empty, Pill, safe } from "@/components/admin/kit";

export const Route = createFileRoute("/admin/reviews")({
  head: () => ({ meta: [{ title: "Reviews — Voltarc Admin" }, { name: "robots", content: "noindex" }] }),
  component: Reviews,
});

function Reviews() {
  const reviews = useDb((s) => s.reviews);
  const products = useDb((s) => s.products);
  const [tab, setTab] = useState<"pending" | "approved" | "all">("pending");
  const list = reviews.filter((r) => tab === "all" || (tab === "pending" ? !r.approved : r.approved));

  return (
    <AdminPage title="Reviews" description="Approve reviews before they appear on product pages.">
      <div className="flex gap-2">{(["pending", "approved", "all"] as const).map((t) => <button key={t} onClick={() => setTab(t)} className={`rounded-full border px-3 py-1 text-sm capitalize ${tab === t ? "bg-primary text-primary-foreground" : "bg-card"}`}>{t} <span className="opacity-60">{t === "all" ? reviews.length : reviews.filter((r) => (t === "pending" ? !r.approved : r.approved)).length}</span></button>)}</div>
      {list.length ? (
        <div className="space-y-3">
          {list.map((r) => (
            <div key={r.id} className="rounded-2xl border bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2"><span className="flex">{Array.from({ length: 5 }, (_, i) => <Star key={i} className={`h-4 w-4 ${i < r.rating ? "fill-current text-warning" : "text-muted"}`} />)}</span>{r.approved ? <Pill tone="good">Live</Pill> : <Pill tone="warn">Pending</Pill>}</div>
                  <p className="mt-2 font-medium">{r.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{r.body}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{r.author} · {products.find((p) => p.id === r.productId)?.name ?? "Unknown product"} · {fmtDate(r.createdAt)}</p>
                </div>
                <div className="flex gap-2">
                  <Btn variant={r.approved ? "outline" : "primary"} onClick={() => safe(actions.setReviewApproved(r.id, !r.approved), r.approved ? "Hidden" : "Approved")}>{r.approved ? "Hide" : "Approve"}</Btn>
                  <Btn variant="danger" onClick={() => confirm("Delete this review?") && safe(actions.deleteReview(r.id), "Deleted")}>Delete</Btn>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : <Empty>Nothing here — you're all caught up.</Empty>}
    </AdminPage>
  );
}
