import type { Order, OrderStatus } from "@/lib/types";
import { fmtDate } from "@/lib/db";

const STEPS: OrderStatus[] = ["paid", "processing", "shipped", "delivered"];
const LABEL: Record<OrderStatus, string> = { pending: "Pending", paid: "Confirmed", processing: "Processing", shipped: "Shipped", delivered: "Delivered", cancelled: "Cancelled", refunded: "Refunded" };

export function StatusBadge({ status }: { status: OrderStatus }) {
  const tone = status === "delivered" ? "bg-success/15 text-success" : status === "cancelled" || status === "refunded" ? "bg-destructive/10 text-destructive" : status === "shipped" ? "bg-accent text-accent-foreground" : "bg-muted text-foreground";
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${tone}`}>{LABEL[status]}</span>;
}

export function OrderTimeline({ order }: { order: Order }) {
  if (order.status === "cancelled" || order.status === "refunded") return <StatusBadge status={order.status} />;
  const idx = STEPS.indexOf(order.status);
  return (
    <ol className="grid grid-cols-4 gap-2">
      {STEPS.map((s, i) => {
        const at = order.timeline.find((t) => t.status === s)?.at;
        return (
          <li key={s}>
            <div className={`h-1.5 rounded-full ${i <= idx ? "bg-primary" : "bg-muted"}`} />
            <p className={`mt-2 text-xs font-medium ${i <= idx ? "" : "text-muted-foreground"}`}>{LABEL[s]}</p>
            {at && <p className="text-[11px] text-muted-foreground">{fmtDate(at)}</p>}
          </li>
        );
      })}
    </ol>
  );
}
