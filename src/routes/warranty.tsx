import { createFileRoute } from "@tanstack/react-router";
import { PageTitle } from "@/components/site/Field";
export const Route = createFileRoute("/warranty")({
  head: () => ({ meta: [{ title: "Warranty — Voltarc" }, { name: "description", content: "Warranty at Voltarc Energy." }, { property: "og:title", content: "Warranty — Voltarc" }, { property: "og:description", content: "Warranty at Voltarc Energy." }] }),
  component: () => (
    <div className="mx-auto max-w-4xl px-4 py-12 lg:px-8">
      <PageTitle eyebrow="Voltarc Energy" title="Warranty">Engineer-led lithium energy storage. Reach us at support@voltarc.dev or +1 (800) 555-0199.</PageTitle>
    </div>
  ),
});
