import { createFileRoute } from "@tanstack/react-router";
import { CatalogAudit } from "@/components/admin/CatalogAudit";
import { AdminPage } from "@/components/admin/kit";

export const Route = createFileRoute("/admin/audit")({
  head: () => ({ meta: [{ title: "AI listing audit — Voltarc Admin" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <AdminPage title="AI listing audit" description="Find incomplete or inconsistent product listings and get suggested fixes.">
      <CatalogAudit />
    </AdminPage>
  ),
});
